
import { supabase } from '../supabaseClient';

const BUCKET_NAME = 'story-assets';

/**
 * Retry helper for Storage calls
 */
async function withRetry<T>(fn: () => Promise<T>, attempts = 3, delayMs = 2000): Promise<T> {
  let lastError: any;
  for (let i = 0; i < attempts; i++) {
    try {
      return await fn();
    } catch (error: any) {
      lastError = error;
      const msg = (error.message || '').toLowerCase();
      if (msg.includes('failed to fetch') || msg.includes('network') || msg.includes('timeout')) {
        console.warn(`Storage API warning (Attempt ${i + 1}/${attempts}). Retrying...`);
        await new Promise(resolve => setTimeout(resolve, delayMs * (i + 1)));
      } else {
        throw error;
      }
    }
  }
  throw lastError;
}

// Helper: Convert Base64 string to Blob SAFELY without fetch()
const base64ToBlobSafe = (base64: string, mimeType: string = 'image/jpeg'): Blob => {
  const base64Clean = base64.split(',')[1] || base64;
  const byteString = atob(base64Clean);
  const ab = new ArrayBuffer(byteString.length);
  const ia = new Uint8Array(ab);
  for (let i = 0; i < byteString.length; i++) {
    ia[i] = byteString.charCodeAt(i);
  }
  return new Blob([ab], { type: mimeType });
};

// Helper: Compress & Resize Image (Max 1024px, JPEG 70%)
export const compressImage = async (base64Str: string, quality = 0.7): Promise<Blob> => {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.crossOrigin = 'anonymous'; 
    img.src = base64Str;
    
    img.onload = () => {
      const canvas = document.createElement('canvas');
      const MAX_DIMENSION = 1024;
      let width = img.width;
      let height = img.height;

      if (width > height) {
        if (width > MAX_DIMENSION) {
          height = Math.round(height * (MAX_DIMENSION / width));
          width = MAX_DIMENSION;
        }
      } else {
        if (height > MAX_DIMENSION) {
          width = Math.round(width * (MAX_DIMENSION / height));
          height = MAX_DIMENSION;
        }
      }

      canvas.width = width;
      canvas.height = height;
      
      const ctx = canvas.getContext('2d');
      if (!ctx) {
        reject(new Error('Canvas context failed'));
        return;
      }
      
      ctx.fillStyle = '#FFFFFF';
      ctx.fillRect(0, 0, canvas.width, canvas.height);
      ctx.drawImage(img, 0, 0, width, height);
      
      canvas.toBlob(
        (blob) => {
          if (blob) resolve(blob);
          else reject(new Error('Compression failed'));
        },
        'image/jpeg',
        quality
      );
    };
    
    img.onerror = () => reject(new Error('Image load failed'));
  });
};

// --- WAV HEADER GENERATION HELPERS ---
const writeString = (view: DataView, offset: number, string: string) => {
  for (let i = 0; i < string.length; i++) {
    view.setUint8(offset + i, string.charCodeAt(i));
  }
};

const createWavHeader = (dataLength: number, sampleRate: number = 24000, numChannels: number = 1, bitsPerSample: number = 16) => {
  const header = new ArrayBuffer(44);
  const view = new DataView(header);
  writeString(view, 0, 'RIFF');
  view.setUint32(4, 36 + dataLength, true);
  writeString(view, 8, 'WAVE');
  writeString(view, 12, 'fmt ');
  view.setUint32(16, 16, true);
  view.setUint16(20, 1, true);
  view.setUint16(22, numChannels, true);
  view.setUint32(24, sampleRate, true);
  view.setUint32(28, sampleRate * numChannels * (bitsPerSample / 8), true);
  view.setUint16(32, numChannels * (bitsPerSample / 8), true);
  view.setUint16(34, bitsPerSample, true);
  writeString(view, 36, 'data');
  view.setUint32(40, dataLength, true);
  return header;
};

const base64AudioToWavBlob = async (base64: string): Promise<Blob> => {
    const binaryString = atob(base64);
    const len = binaryString.length;
    const bytes = new Uint8Array(len);
    for (let i = 0; i < len; i++) {
        bytes[i] = binaryString.charCodeAt(i);
    }
    const header = createWavHeader(len);
    const headerBytes = new Uint8Array(header);
    const wavBytes = new Uint8Array(header.byteLength + len);
    wavBytes.set(headerBytes, 0);
    wavBytes.set(bytes, headerBytes.byteLength);
    return new Blob([wavBytes], { type: 'audio/wav' }); 
};

export const uploadStoryAsset = async (
    file: Blob, 
    userId: string, 
    storyId: string, 
    fileName: string
): Promise<string | null> => {
    return withRetry(async () => {
        const path = `${userId}/${storyId}/${fileName}`;
        const { data, error } = await supabase.storage
            .from(BUCKET_NAME)
            .upload(path, file, {
                cacheControl: '3600',
                upsert: true
            });

        if (error) {
            if (error.message.includes('row-level security') || error.message.includes('permission denied')) {
                throw new Error("STORAGE_PERMISSION_ERROR");
            }
            throw error;
        }

        const { data: { publicUrl } } = supabase.storage
            .from(BUCKET_NAME)
            .getPublicUrl(path);

        return publicUrl;
    });
};

export const processAndUploadImage = async (base64: string, userId: string, storyId: string, pageIndex: number | 'cover'): Promise<string | null> => {
    try {
        const compressedBlob = await compressImage(base64, 0.7); 
        const fileName = `img_${pageIndex}_${Date.now()}.jpg`;
        return await uploadStoryAsset(compressedBlob, userId, storyId, fileName);
    } catch (e) {
        console.error("Image processing failed:", e);
        throw e;
    }
};

export const processAndUploadAudio = async (base64: string, userId: string, storyId: string, pageIndex: number): Promise<string | null> => {
    try {
        const audioBlob = await base64AudioToWavBlob(base64); 
        const fileName = `audio_${pageIndex}_${Date.now()}.wav`;
        return await uploadStoryAsset(audioBlob, userId, storyId, fileName);
    } catch (e) {
        console.error("Audio processing failed:", e);
        return null;
    }
};
