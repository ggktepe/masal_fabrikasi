
import { GoogleGenAI, Type, Modality } from "@google/genai";
import { StoryParams, StoryPage, VoiceType } from "../types";
import { MAIN_CHARACTERS, SIDE_CHARACTERS, VISUAL_STYLES } from "../constants";

const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

const MODEL_TEXT = 'gemini-3-flash-preview';
const MODEL_IMAGE = 'gemini-2.5-flash-image'; 
const MODEL_TTS = 'gemini-2.5-flash-preview-tts';

/**
 * Enhanced Retry Helper with Exponential Backoff
 */
async function withRetry<T>(fn: () => Promise<T>, attempts = 5, initialDelay = 1000): Promise<T> {
  let lastError: any;
  for (let i = 0; i < attempts; i++) {
    try {
      return await fn();
    } catch (error: any) {
      lastError = error;
      const msg = (error.message || '').toLowerCase();
      const isNetworkError = 
        msg.includes('failed to fetch') || 
        msg.includes('networkerror') || 
        msg.includes('503') || 
        msg.includes('500') || 
        msg.includes('deadline exceeded') ||
        msg.includes('load failed');

      if (isNetworkError && i < attempts - 1) {
        const delay = initialDelay * Math.pow(2, i); // 1s, 2s, 4s, 8s...
        console.warn(`Gemini API error (Attempt ${i + 1}/${attempts}). Retrying in ${delay}ms... Reason: ${msg}`);
        await new Promise(resolve => setTimeout(resolve, delay));
      } else {
        throw error;
      }
    }
  }
  throw lastError;
}

export const analyzeUserPhoto = async (base64Data: string): Promise<string> => {
  return withRetry(async () => {
    const response = await ai.models.generateContent({
      model: MODEL_TEXT,
      contents: [
        {
          inlineData: {
            mimeType: "image/jpeg",
            data: base64Data.split(',')[1] || base64Data
          }
        },
        {
          text: "Analyze this photo of a child. Create a detailed physical description for a character based on the appearance of the child in the photo. Focus on: hair color/style, skin tone, eye color, and any notable features like glasses. The description should be suitable for use in image generation prompts. Avoid names, just physical attributes. Keep it concise."
        }
      ]
    });
    return response.text || "A cute young child with bright eyes and a happy smile.";
  });
};

export const generateStoryContent = async (params: StoryParams, predefinedCharacterDescription?: string): Promise<{ title: string; pages: StoryPage[]; characterVisualDescription: string; sideCharacterVisualDescription: string }> => {
  return withRetry(async () => {
    const mainCharDef = MAIN_CHARACTERS.find(c => c.id === params.mainCharacterId);
    const sideCharDef = SIDE_CHARACTERS.find(c => c.id === params.sideCharacterId);
    const styleDef = VISUAL_STYLES.find(s => s.id === params.styleId);

    const isEnglish = params.language === 'en';
    const targetLang = isEnglish ? 'English' : 'Turkish (Türkçe)';
    const childAge = params.childAge || 5;

    let textRequirements = "";
    if (childAge <= 2) {
        textRequirements = `Target Age 0-2: Use very simple, rhythmic and melodic language in ${targetLang}. Each page MUST have exactly 3 short, basic sentences. Keep it very easy to follow for a toddler.`;
    } else if (childAge <= 4) {
        textRequirements = `Target Age 3-4: Use simple and engaging language in ${targetLang}. Each page MUST have exactly 4 sentences. The story should be clear and move at a steady pace.`;
    } else if (childAge === 5) {
        textRequirements = `Target Age 5: Use expressive language in ${targetLang} with a richer vocabulary. Each page MUST have exactly 5 sentences. Include some simple dialogue between characters.`;
    } else if (childAge === 6) {
        textRequirements = `Target Age 6: Use descriptive and engaging language in ${targetLang}. Each page MUST have exactly 6 sentences. Include diologue and expressive scenes to make the story come alive.`;
    } else {
        textRequirements = `Target Age 7+: Use descriptive, immersive and slightly complex narrative in ${targetLang}. Each page MUST have 7 to 8 sentences. Include frequent dialogue and build a deep story world suitable for school-age children.`;
    }

    const mainNameInstructions = params.mainCharacterName 
      ? `Name is "${params.mainCharacterName}"` 
      : `User did not provide a name. Generate a cute name for the main character in ${targetLang}.`;
    
    let sideCharacterPrompt = "";
    if (params.sideCharacterId === 'sc_none') {
      sideCharacterPrompt = "There is NO side character. Set sideCharacterVisualDescription to an empty string.";
    } else if (params.sideCharacterId === 'sc_villain') {
      const villainType = params.sideCharacterType || 'Villain';
      const sideNameInstructions = params.sideCharacterName
        ? `Name is "${params.sideCharacterName}"`
        : `User did not provide a name. Generate a fitting name for this villain in ${targetLang}.`;

      sideCharacterPrompt = `ANTAGONIST/VILLAIN: This is a ${villainType}. ${sideNameInstructions}. 
      CRITICAL REQUIREMENT: This character is the BAD character/VILLAIN of the story. The story MUST involve a conflict where the hero overcomes this villain's challenge. The hero should be brave and clever.`;
    } else {
      const sideNameInstructions = params.sideCharacterName
        ? `Name is "${params.sideCharacterName}"`
        : `User did not provide a name. Generate a cute name for a ${sideCharDef?.name} in ${targetLang}.`;

      sideCharacterPrompt = `Side Character: ${sideCharDef?.name} (${sideCharDef?.description}). ${sideNameInstructions}`;
    }

    const characterDescriptionGuidance = predefinedCharacterDescription 
      ? `MANDATORY Main Character Look: ${predefinedCharacterDescription}. Use this as the base for characterVisualDescription.`
      : `Main Character Type: ${mainCharDef?.name} (${mainCharDef?.description}).`;

    const styleGuidance = styleDef ? `The visual style of the book is: ${styleDef.prompt}. Describe image prompts suitable for this specific style.` : "The visual style is Pixar-like animation.";

    const prompt = `
      You are a professional children's book author. Write a bedtime story for a child aged ${childAge} in ${targetLang}.
      
      Characters:
      1. Main Character: ${characterDescriptionGuidance} ${mainNameInstructions}
      2. ${sideCharacterPrompt}
      
      Setting: ${params.location}.
      Theme: ${params.theme}.
      Style: ${styleGuidance}
      
      Requirements:
      - Create exactly 16 pages.
      - Provide a catchy Title in ${targetLang}.
      - ${textRequirements}
      
      CONSISTENCY REQUIREMENT:
      1. characterVisualDescription: A detailed physical description of the MAIN character (clothes, colors, accessories) consistent with the chosen style.
      2. sideCharacterVisualDescription: A detailed physical description of the SIDE/VILLAIN character (clothes, colors, accessories) consistent with the chosen style. If no side character is used, this MUST be an empty string.
      
      Output JSON format only.
    `;

    const response = await ai.models.generateContent({
      model: MODEL_TEXT,
      contents: prompt,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            title: { type: Type.STRING },
            characterVisualDescription: { type: Type.STRING },
            sideCharacterVisualDescription: { type: Type.STRING },
            pages: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                properties: {
                  pageNumber: { type: Type.INTEGER },
                  text: { type: Type.STRING },
                  imagePrompt: { type: Type.STRING }
                },
                required: ["pageNumber", "text", "imagePrompt"]
              }
            }
          },
          required: ["title", "pages", "characterVisualDescription", "sideCharacterVisualDescription"]
        }
      }
    });

    let text = response.text || "{}";
    const data = JSON.parse(text);
    return data;
  });
};

export const generateIllustration = async (prompt: string, styleId: string, aspectRatio: "1:1" | "16:9" = "1:1"): Promise<string | undefined> => {
  return withRetry(async () => {
      const styleDef = VISUAL_STYLES.find(s => s.id === styleId);
      const stylePrompt = styleDef?.prompt || "Children's book illustration, 3d render, pixar style, colorful, cute, vibrant, high quality.";
      
      const enhancedPrompt = `${stylePrompt} ${prompt}`;
      
      const response = await ai.models.generateContent({
        model: MODEL_IMAGE,
        contents: {
          parts: [{ text: enhancedPrompt }]
        },
      });

      for (const part of response.candidates?.[0]?.content?.parts || []) {
        if (part.inlineData) {
          return `data:image/png;base64,${part.inlineData.data}`;
        }
      }
      return undefined;
  });
};

export const generateNarration = async (text: string, voiceType: VoiceType): Promise<string | undefined> => {
  return withRetry(async () => {
        const isMale = voiceType === VoiceType.Male;
        const voiceName = isMale ? 'Charon' : 'Kore';
        
        const tonalPrefix = isMale 
          ? "Tok, güven verici ve akıcı bir baba sesiyle, normal bir tempoda anlat: " 
          : "Yumuşak, şefkatli ve akıcı bir anne sesiyle, canlı ve normal bir hızda anlat: ";

        const response = await ai.models.generateContent({
            model: MODEL_TTS,
            contents: [{ parts: [{ text: tonalPrefix + text }] }],
            config: {
                responseModalities: [Modality.AUDIO],
                speechConfig: {
                    voiceConfig: {
                        prebuiltVoiceConfig: { voiceName: voiceName },
                    },
                },
            },
        });
        return response.candidates?.[0]?.content?.parts?.[0]?.inlineData?.data;
  }, 3, 2000);
};
