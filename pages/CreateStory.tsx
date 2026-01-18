
import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useApp } from '../context/AppContext';
import { MAIN_CHARACTERS, SIDE_CHARACTERS, LOCATIONS, THEMES, VISUAL_STYLES } from '../constants';
import { VoiceType, StoryParams, Story } from '../types';
import { generateStoryContent, generateIllustration, generateNarration, analyzeUserPhoto } from '../services/geminiService';
import { processAndUploadImage, processAndUploadAudio, compressImage } from '../services/storageService';

const StepIndicator = ({ step }: { step: number }) => (
  <div className="flex justify-center space-x-2 mb-6 shrink-0">
    {[1, 2, 3, 4, 5, 6, 7].map(i => (
      <div key={i} className={`h-2 rounded-full transition-all duration-500 ${i === step ? 'w-10 bg-magic-500' : 'w-2 bg-magic-200'}`} />
    ))}
  </div>
);

// Fallback UUID generator in case crypto.randomUUID is not available
const generateUUID = () => {
  if (typeof crypto !== 'undefined' && crypto.randomUUID) {
    return crypto.randomUUID();
  }
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
    const r = Math.random() * 16 | 0, v = c === 'x' ? r : (r & 0x3 | 0x8);
    return v.toString(16);
  });
};

const SelectionGrid = ({ 
  items, 
  selected, 
  onSelect, 
  showNameInput = false, 
  nameValue, 
  onNameChange, 
  placeholder,
  customValue,
  onCustomValueChange,
  customPlaceholder = "Kendi seçimini yaz...",
  onSelfClick,
  selfProfessionValue,
  onSelfProfessionChange,
  allowSelf = false,
  allowOther = true
}: any) => {
  const getSoftBg = (index: number) => {
    const colors = [
      'bg-magic-50 border-magic-100', 
      'bg-mint-50 border-mint-100',   
      'bg-amber-50 border-amber-100', 
      'bg-sky-50 border-sky-100',     
    ];
    return colors[index % colors.length];
  };

  const displayItems = [...items];
  
  if (allowSelf) {
    displayItems.push({ id: 'self', name: 'Kendim', emoji: '🤳', type: 'Special' });
  }
  
  if (allowOther) {
    displayItems.push({ id: 'other', name: 'Diğer', emoji: '🎨', type: 'Custom' });
  }

  const isCustomOrVillain = selected === 'other' || selected === 'sc_villain';

  return (
    <div className="flex-1 flex flex-col min-h-0"> 
        {showNameInput && (
            <div className="px-4 mb-2 shrink-0 space-y-2">
              <input 
                  type="text"
                  placeholder={placeholder}
                  className="w-full bg-white/80 backdrop-blur-md border-2 border-magic-100 rounded-[1.5rem] p-4 text-center shadow-inner focus:border-magic-400 focus:outline-none placeholder-magic-200 font-bold text-lg dark:bg-slate-900/50 dark:border-slate-800 dark:text-white"
                  value={nameValue}
                  onChange={e => onNameChange(e.target.value)}
              />
              
              {selected === 'self' && (
                  <input 
                      type="text"
                      placeholder="Ne olmak istersin? (Örn: Doktor, Astronot...)"
                      className="w-full bg-sky-50/50 backdrop-blur-md border-2 border-sky-200 rounded-[1.5rem] p-4 text-center shadow-sm focus:border-sky-400 focus:outline-none placeholder-sky-300 font-bold text-lg animate-fade-in"
                      value={selfProfessionValue}
                      onChange={e => onSelfProfessionChange(e.target.value)}
                  />
              )}
            </div>
        )}

        {isCustomOrVillain && allowOther && (
             <div className="px-4 mb-4 shrink-0 animate-fade-in">
                <input 
                    type="text"
                    placeholder={customPlaceholder}
                    className="w-full bg-amber-50/50 backdrop-blur-md border-2 border-gold-300 rounded-[1.5rem] p-4 text-center shadow-sm focus:border-gold-500 focus:outline-none placeholder-gold-300 font-bold text-lg"
                    value={customValue}
                    onChange={e => onCustomValueChange(e.target.value)}
                    autoFocus
                />
             </div>
        )}

        <div className="grid grid-cols-2 gap-4 overflow-y-auto no-scrollbar pb-10 px-4">
        {displayItems.map((item: any, idx: number) => {
            const isSelected = selected === item.id;
            const isOther = item.id === 'other';
            const isSelf = item.id === 'self';
            
            return (
              <div 
              key={item.id}
              onClick={() => {
                if ('vibrate' in navigator) navigator.vibrate(5);
                if (isSelf && onSelfClick) {
                    onSelfClick();
                } else {
                    onSelect(item.id);
                }
              }}
              className={`relative p-5 rounded-magic border-2 cursor-pointer transition-all duration-500 flex flex-col items-center justify-center text-center group ${
                  isSelected 
                  ? 'bg-white dark:bg-slate-800 border-gold-400 shadow-[0_15px_30_30px_-10px_rgba(245,158,11,0.3)] scale-105 z-10' 
                  : isOther || isSelf
                    ? 'bg-amber-50 dark:bg-slate-900/50 border-dashed border-amber-200 dark:border-slate-700'
                    : `${getSoftBg(idx)} dark:bg-slate-900/30 border-transparent shadow-sm opacity-90 hover:opacity-100`
              }`}
              >
                <div className={`text-6xl mb-3 transform transition-transform duration-500 ${isSelected ? 'scale-110 animate-float' : 'group-hover:scale-105'}`}>
                  {item.emoji}
                </div>
                
                <div className={`font-bold text-sm tracking-tight transition-colors ${isSelected ? 'text-magic-700 dark:text-magic-400' : 'text-magic-900/70 dark:text-slate-400'}`}>
                  {item.name}
                </div>

                {isSelected && (
                  <div className="absolute inset-0 rounded-magic border-4 border-gold-200/50 animate-pulse pointer-events-none"></div>
                )}
              </div>
            );
        })}
        </div>
    </div>
  );
};

const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

export const CreateStory: React.FC<{ resumeStory?: Story | null }> = ({ resumeStory }) => {
  const { addStory, setCurrentTab, userProfile, settings, setResumingStory, spendCredits } = useApp();
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [loadingMessage, setLoadingMessage] = useState('');
  
  const [activeStory, setActiveStory] = useState<Story | null>(null);
  const isGeneratingRef = useRef(false);

  const [showCamera, setShowCamera] = useState(false);
  const [isPhotoProcessing, setIsPhotoProcessing] = useState(false);
  const [userPhoto, setUserPhoto] = useState<string | null>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const galleryInputRef = useRef<HTMLInputElement>(null);

  const [mainCharId, setMainCharId] = useState(MAIN_CHARACTERS[0].id);
  const [mainCharName, setMainCharName] = useState('');
  const [customMainChar, setCustomMainChar] = useState('');
  const [selfProfession, setSelfProfession] = useState('');

  const [sideCharId, setSideCharId] = useState(SIDE_CHARACTERS[0].id);
  const [sideCharName, setSideCharName] = useState('');
  const [customSideChar, setCustomSideChar] = useState('');
  const [customVillainType, setCustomVillainType] = useState('');

  const [locationId, setLocationId] = useState(LOCATIONS[0].id);
  const [customLocation, setCustomLocation] = useState('');

  const [themeId, setThemeId] = useState(THEMES[0].id);
  const [customTheme, setCustomTheme] = useState('');

  const [styleId, setStyleId] = useState(VISUAL_STYLES[0].id); 

  const [voice, setVoice] = useState<VoiceType>(VoiceType.Female);
  const [language, setLanguage] = useState<'tr' | 'en'>('tr');

  const wakeLockRef = useRef<any>(null);

  const requestWakeLock = useCallback(async () => {
    if ('wakeLock' in navigator) {
      try {
        wakeLockRef.current = await (navigator as any).wakeLock.request('screen');
      } catch (err: any) {}
    }
  }, []);

  const releaseWakeLock = useCallback(() => {
    if (wakeLockRef.current) {
      try {
        wakeLockRef.current.release();
      } catch (e) {}
      wakeLockRef.current = null;
    }
  }, []);

  useEffect(() => {
    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible') {
        requestWakeLock();
        if (loading && activeStory && !isGeneratingRef.current) {
          startGeneration(activeStory);
        }
      }
    };
    document.addEventListener('visibilitychange', handleVisibilityChange);
    return () => document.removeEventListener('visibilitychange', handleVisibilityChange);
  }, [loading, activeStory, requestWakeLock]);

  useEffect(() => {
    if (userProfile?.childName) {
      setMainCharName(userProfile.childName);
    }
  }, [userProfile]);

  useEffect(() => {
    if (resumeStory) {
      startGeneration(resumeStory);
    }
  }, [resumeStory]);

  const startCamera = async () => {
      setShowCamera(true);
      try {
          const stream = await navigator.mediaDevices.getUserMedia({ 
            video: { facingMode: 'user', width: { ideal: 720 }, height: { ideal: 720 } }, 
            audio: false 
          });
          if (videoRef.current) {
              videoRef.current.srcObject = stream;
          }
      } catch (err) {
          // alert("Kameraya ulaşılamadı. Galeriden seçim yapabilirsiniz.");
          // Only alert if we're not falling back to gallery choice implicitly
      }
  };

  const capturePhoto = () => {
      if (videoRef.current && canvasRef.current) {
          const context = canvasRef.current.getContext('2d');
          if (context) {
              canvasRef.current.width = videoRef.current.videoWidth;
              canvasRef.current.height = videoRef.current.videoHeight;
              context.drawImage(videoRef.current, 0, 0);
              const dataUrl = canvasRef.current.toDataURL('image/jpeg');
              setUserPhoto(dataUrl);
              const stream = videoRef.current.srcObject as MediaStream;
              if (stream) stream.getTracks().forEach(track => track.stop());
          }
      }
  };

  const handleGallerySelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setIsPhotoProcessing(true);
      try {
        const reader = new FileReader();
        reader.onloadend = async () => {
          const base64 = reader.result as string;
          const compressedBlob = await compressImage(base64, 0.7);
          const compressedReader = new FileReader();
          compressedReader.onloadend = () => {
            setUserPhoto(compressedReader.result as string);
            setIsPhotoProcessing(false);
          };
          compressedReader.readAsDataURL(compressedBlob);
        };
        reader.readAsDataURL(file);
      } catch (err) {
        console.error("Gallery select error:", err);
        setIsPhotoProcessing(false);
      }
    }
  };

  const confirmSelfie = () => {
      setMainCharId('self');
      setShowCamera(false);
  };

  const cancelCamera = () => {
      if (videoRef.current?.srcObject) {
          const stream = videoRef.current.srcObject as MediaStream;
          stream.getTracks().forEach(track => track.stop());
      }
      setShowCamera(false);
  };

  const calculateAge = (birthDateString: string): number => {
      const birthDate = new Date(birthDateString);
      const today = new Date();
      let age = today.getFullYear() - birthDate.getFullYear();
      const m = today.getMonth() - birthDate.getMonth();
      if (m < 0 || (m === 0 && today.getDate() < birthDate.getDate())) age--;
      return age > 0 ? age : 5;
  };

  const startGeneration = async (existingStory?: Story) => {
    if (!userProfile?.id) return alert("Lütfen önce giriş yap.");
    if (isGeneratingRef.current) return; 

    const creditCost = settings.soundEnabled ? 20 : 10;
    
    if (!existingStory && (userProfile.credits ?? 0) < creditCost) {
      alert(`Bu masalı oluşturmak için ${creditCost} krediye ihtiyacın var. Lütfen ayarlardan kredi yükle veya seslendirmeyi kapat! ✨`);
      setCurrentTab('settings');
      return;
    }

    isGeneratingRef.current = true;
    setLoading(true);
    await requestWakeLock();

    try {
      if (!existingStory) {
        setLoadingMessage(`Krediler harcanıyor... (Maliyet: ${creditCost}) 🪙`);
        const spendResult = await spendCredits(creditCost);
        if (!spendResult.success) {
          throw new Error(spendResult.error || "Kredi harcanırken hata oluştu.");
        }
      }

      let currentStory: Story;
      let startPageIndex = 0;
      let characterVisualDescription = "";
      let sideCharacterVisualDescription = "";

      if (existingStory) {
        currentStory = { ...existingStory };
        startPageIndex = existingStory.pages.findIndex(p => !p.imageUrl);
        if (startPageIndex === -1) startPageIndex = existingStory.pages.length;
        
        characterVisualDescription = existingStory.characterVisualDescription || "";
        sideCharacterVisualDescription = existingStory.sideCharacterVisualDescription || "";
        setActiveStory(currentStory);
        setLoadingMessage(`Sihir Kaldığı Yerden Devam Ediyor... (Sayfa ${startPageIndex + 1})`);
      } else {
        setLoadingMessage("Sihirli Aynaya Soruluyor... 📸");
        
        let predefinedCharacterDescription = undefined;
        if (mainCharId === 'self' && userPhoto) {
            predefinedCharacterDescription = await analyzeUserPhoto(userPhoto);
            if (selfProfession.trim()) {
                predefinedCharacterDescription += ` The character is dressed as a ${selfProfession.trim()} and performing roles related to it.`;
            }
        }

        setLoadingMessage("Masalın yazılıyor... ✍️");
        const locObj = LOCATIONS.find(l => l.id === locationId);
        const themeObj = THEMES.find(t => t.id === themeId);
        const childAge = userProfile?.birthDate ? calculateAge(userProfile.birthDate) : 5;

        const finalMainCharType = mainCharId === 'other' ? customMainChar : (mainCharId === 'self' ? (selfProfession || 'Kahraman') : (MAIN_CHARACTERS.find(c => c.id === mainCharId)?.name || "Karakter"));
        const finalSideCharType = sideCharId === 'other' ? customSideChar : (sideCharId === 'sc_villain' ? customVillainType : (SIDE_CHARACTERS.find(c => c.id === sideCharId)?.name || ""));
        const finalLocation = locationId === 'other' ? customLocation : (locObj?.name || "Bilinmeyen Yer");
        const finalTheme = themeId === 'other' ? customTheme : (themeObj?.name || "Macera");

        const params: StoryParams = {
          mainCharacterId: mainCharId,
          mainCharacterName: mainCharName.trim() || finalMainCharType, 
          sideCharacterId: sideCharId === 'other' ? 'custom' : sideCharId,
          sideCharacterName: sideCharName.trim() || finalSideCharType,
          sideCharacterType: sideCharId === 'sc_villain' ? (customVillainType || 'Antagonist') : undefined,
          location: finalLocation,
          theme: finalTheme,
          styleId,
          voice,
          childAge,
          language
        };

        const content = await generateStoryContent(params, predefinedCharacterDescription);
        if (!content || !content.pages) throw new Error("Hikaye içeriği üretilemedi.");

        characterVisualDescription = content.characterVisualDescription;
        sideCharacterVisualDescription = content.sideCharacterVisualDescription;

        // Ensure UUID is generated correctly
        const storyId = generateUUID();

        currentStory = {
          id: storyId,
          title: content.title,
          createdAt: Date.now(),
          params,
          pages: content.pages.map(p => ({ ...p, imageUrl: undefined })), 
          isComplete: false,
          characterVisualDescription,
          sideCharacterVisualDescription
        };

        setActiveStory(currentStory);
        await addStory(currentStory);

        setLoadingMessage("Sihirli Kapak Boyanıyor... 🎨");
        const charGuide = sideCharacterVisualDescription 
          ? `Characters: 1) ${characterVisualDescription}. 2) ${sideCharacterVisualDescription}.` 
          : `Main Character: ${characterVisualDescription}.`;
        
        const coverPrompt = `${charGuide} Action: Book cover close up. Both characters smiling. Setting: ${params.location}.`;
        const coverBase64 = await generateIllustration(coverPrompt, styleId, "1:1");
        if (coverBase64) {
          const coverUrl = await processAndUploadImage(coverBase64, userProfile.id, currentStory.id, 'cover');
          currentStory.coverImage = coverUrl || undefined;
          await addStory(currentStory);
        }
      }

      const charGuide = currentStory.characterVisualDescription 
          ? (currentStory.sideCharacterVisualDescription 
             ? `Characters: 1) ${currentStory.characterVisualDescription}. 2) ${currentStory.sideCharacterVisualDescription}.` 
             : `Main Character: ${currentStory.characterVisualDescription}.`)
          : "";

      const totalPages = currentStory.pages.length;

      for (let i = startPageIndex; i < totalPages; i++) {
        setLoadingMessage(`Sayfa Boyanıyor: ${i + 1} / ${totalPages} 🎬`);
        
        const page = currentStory.pages[i];
        const pagePrompt = `${charGuide} Scene: ${page.imagePrompt}. Ensure characters look consistent. Setting: ${currentStory.params.location}.`;
        
        try {
          const imgPromise = generateIllustration(pagePrompt, currentStory.params.styleId, "1:1");
          const audioPromise = settings.soundEnabled ? generateNarration(page.text, currentStory.params.voice) : Promise.resolve(undefined);
          
          const [imgBase64, audioBase64] = await Promise.all([imgPromise, audioPromise]);
          
          if (imgBase64) page.imageUrl = await processAndUploadImage(imgBase64, userProfile.id, currentStory.id, i) || undefined;
          if (audioBase64) page.audioUrl = await processAndUploadAudio(audioBase64, userProfile.id, currentStory.id, i) || undefined;
          
          await addStory(currentStory);
          if (i < totalPages - 1) await delay(800); 
        } catch (innerError) {
          console.error(`Page ${i+1} Generation Failed:`, innerError);
          throw innerError; 
        }
      }

      setLoadingMessage("Masal Tamamlandı! ✨");
      currentStory.isComplete = true;
      await addStory(currentStory);
      
      setResumingStory(null);
      setLoading(false);
      isGeneratingRef.current = false;
      releaseWakeLock();
      setCurrentTab('library');

    } catch (e: any) {
      console.error("Story Loop Error:", e);
      isGeneratingRef.current = false;
      const errorMsg = (e.message || '').toLowerCase();
      if (errorMsg.includes('fetch')) {
        setLoadingMessage("Bağlantı hatası... Lütfen bekleyin.");
      } else {
        setLoadingMessage("Bir sorun oluştu...");
      }
      
      if (document.visibilityState === 'visible') {
        alert("Sihirli fırçalar bir sorunla karşılaştı. Bağlantınızı kontrol edip kütüphaneden 'Devam Et' diyebilirsiniz.");
        setLoading(false);
        releaseWakeLock();
      }
    }
  };

  const handleFinish = () => {
    if (mainCharId === 'other' && !customMainChar.trim()) return alert("Lütfen ana kahramanın ne olduğunu yaz.");
    if (mainCharId === 'self' && !userPhoto) return alert("Lütfen önce bir fotoğrafını çek.");
    if (sideCharId === 'other' && !customSideChar.trim()) return alert("Lütfen yan karakterin ne olduğunu yaz.");
    if (sideCharId === 'sc_villain' && !customVillainType.trim()) return alert("Lütfen kötü karakterin ne olduğunu yaz.");
    if (locationId === 'other' && !customLocation.trim()) return alert("Lütfen mekanın neresi olduğunu yaz.");
    if (themeId === 'other' && !customTheme.trim()) return alert("Lütfen konunun ne olduğunu yaz.");
    startGeneration();
  };

  if (showCamera) {
      return (
          <div className="fixed inset-0 z-[100] bg-black/95 backdrop-blur-xl flex flex-col items-center justify-center p-4 md:p-8 overflow-y-auto no-scrollbar">
              <div className="w-full max-w-lg aspect-square relative rounded-[2rem] md:rounded-[3rem] overflow-hidden border-4 border-white shadow-2xl bg-slate-900 shrink-0 max-h-[60vh] md:max-h-none">
                  {!userPhoto ? (
                      <video ref={videoRef} autoPlay playsInline className="w-full h-full object-cover scale-x-[-1]" />
                  ) : (
                      <img src={userPhoto} className="w-full h-full object-cover scale-x-[-1]" alt="Captured" />
                  )}
                  {isPhotoProcessing && (
                      <div className="absolute inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center text-white font-bold">
                          Fotoğraf İşleniyor... ⏳
                      </div>
                  )}
                  <div className="absolute inset-0 border-[20px] md:border-[40px] border-black/40 pointer-events-none flex items-center justify-center">
                      <div className="w-full h-full border-2 md:border-4 border-white/20 rounded-full border-dashed"></div>
                  </div>
              </div>

              <div className="mt-8 flex flex-col gap-4 w-full max-w-sm shrink-0">
                  {!userPhoto ? (
                      <div className="grid grid-cols-2 gap-4">
                        <button onClick={cancelCamera} className="bg-white/10 text-white font-bold py-4 rounded-2xl hover:bg-white/20 transition-all">Vazgeç</button>
                        <button onClick={capturePhoto} className="bg-white text-black font-bold py-4 rounded-2xl shadow-xl active:scale-95 transition-all">Fotoğraf Çek 📸</button>
                        <button 
                            onClick={() => galleryInputRef.current?.click()} 
                            className="col-span-2 bg-sky-500 text-white font-bold py-4 rounded-2xl shadow-xl active:scale-95 transition-all flex items-center justify-center gap-2"
                        >
                            <span>🖼️</span> Galeriden Seç
                        </button>
                        <input ref={galleryInputRef} type="file" accept="image/*" className="hidden" onChange={handleGallerySelect} />
                      </div>
                  ) : (
                      <div className="grid grid-cols-2 gap-4">
                        <button onClick={() => setUserPhoto(null)} className="bg-white/10 text-white font-bold py-4 rounded-2xl hover:bg-white/20 transition-all">Tekrar Dene</button>
                        <button onClick={confirmSelfie} className="bg-gradient-to-r from-gold-400 to-magic-500 text-white font-bold py-4 rounded-2xl shadow-xl active:scale-95 transition-all">Sihre Kat! ✨</button>
                        <button 
                            onClick={() => galleryInputRef.current?.click()} 
                            className="col-span-2 bg-white/10 text-white/70 font-bold py-3 rounded-2xl hover:bg-white/20 transition-all flex items-center justify-center gap-2 text-sm"
                        >
                             Farklı Fotoğraf Seç
                        </button>
                        <input ref={galleryInputRef} type="file" accept="image/*" className="hidden" onChange={handleGallerySelect} />
                      </div>
                  )}
              </div>
              <canvas ref={canvasRef} className="hidden" />
          </div>
      );
  }

  if (loading) {
    return (
      <div className="h-full flex flex-col bg-sky-50 dark:bg-slate-950 transition-colors">
        <div className="flex-1 flex flex-col items-center justify-center p-6 text-center animate-fade-in">
          <div className="w-full max-w-sm mb-10 relative group">
              <div className="absolute inset-0 bg-gradient-to-tr from-gold-400/20 via-magic-500/30 to-sky-400/20 rounded-[3rem] blur-3xl animate-pulse"></div>
              <div className="relative z-10 w-full aspect-square rounded-[3rem] overflow-hidden border-8 border-white dark:border-slate-800 shadow-[0_20px_50px_rgba(0,0,0,0.15)] bg-slate-900">
                  <video 
                      src="https://qwmvqpbnxqxaoskieyyw.supabase.co/storage/v1/object/public/images/icon_anime.mp4" 
                      autoPlay 
                      loop 
                      muted 
                      playsInline
                      className="w-full h-full object-cover scale-105" 
                  />
                  <div className="absolute inset-0 bg-gradient-to-b from-white/5 to-transparent pointer-events-none"></div>
              </div>
          </div>
          <div className="space-y-6 w-full max-w-sm px-4">
              <div className="space-y-2">
                  <h2 className="text-3xl font-black text-magic-700 dark:text-magic-400 tracking-tight leading-none drop-shadow-sm">
                    {loadingMessage}
                  </h2>
                  <div className="flex items-center justify-center gap-2 pt-2">
                    {[0, 1, 2, 3].map(i => (
                      <div key={i} className="w-2.5 h-2.5 bg-gold-400 rounded-full animate-bounce" style={{animationDelay: `${i*150}ms`}} />
                    ))}
                  </div>
              </div>
              <div className="bg-white/70 dark:bg-slate-900/70 backdrop-blur-2xl p-6 rounded-[2rem] border-2 border-white dark:border-slate-800 shadow-xl relative overflow-hidden">
                 <p className="text-gold-600 dark:text-gold-400 text-[10px] font-black uppercase tracking-[0.3em] mb-3">Sihirli Uyarı 🧚</p>
                 <p className="text-magic-900 dark:text-slate-200 text-sm font-bold leading-relaxed px-1">
                    Masalın kusursuz boyanması için lütfen <strong>ekranı kapatma</strong> ve bu sayfadan <strong>ayrılma</strong>. 
                 </p>
              </div>
              <button onClick={() => setLoading(false)} className="text-xs text-magic-400 underline opacity-40">Vazgeç</button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full pt-6 pb-24 text-magic-900 dark:text-slate-100 overflow-hidden relative">
      <div className="watercolor-blob absolute -top-20 -left-20 w-64 h-64 bg-magic-200 rounded-full dark:opacity-10"></div>
      <div className="watercolor-blob absolute -bottom-20 -right-20 w-64 h-64 bg-sky-200 rounded-full dark:opacity-10"></div>

      <h1 className="text-3xl font-bold text-center mb-1 shrink-0 tracking-tight text-magic-700 dark:text-magic-400">Masal Fabrikası</h1>
      <p className="text-xs text-center mb-4 text-magic-400 dark:text-slate-500 font-bold uppercase tracking-widest shrink-0">Sihirli Seçimlerini Yap</p>
      
      <StepIndicator step={step} />

      <div className="flex-1 flex flex-col min-h-0 animate-fade-in">
        {step === 1 && (
          <div className="flex-1 flex flex-col min-h-0">
            <h2 className="text-xl text-center mb-4 font-bold text-magic-600 dark:text-magic-400 shrink-0">Ana Kahramanın Kim?</h2>
            <SelectionGrid 
              items={MAIN_CHARACTERS} 
              selected={mainCharId} 
              onSelect={setMainCharId} 
              showNameInput={true}
              placeholder="Kahramanın Adı..."
              nameValue={mainCharName}
              onNameChange={setMainCharName}
              customValue={customMainChar}
              onCustomValueChange={setCustomMainChar}
              customPlaceholder="Örn: Astronot, Futbolcu, Kedi..."
              onSelfClick={startCamera}
              selfProfessionValue={selfProfession}
              onSelfProfessionChange={setSelfProfession}
              allowSelf={true}
            />
            {userPhoto && mainCharId === 'self' && (
                <div className="px-4 mb-4 shrink-0 flex items-center gap-3 bg-white/50 dark:bg-slate-900/50 p-3 rounded-2xl border border-gold-200 dark:border-slate-800 mx-4">
                    <img src={userPhoto} className="w-12 h-12 rounded-full object-cover border-2 border-gold-400" alt="Self Preview" />
                    <div className="flex-1">
                        <p className="text-[10px] font-black text-gold-600 uppercase tracking-widest">Senin Karakterin</p>
                        <p className="text-xs font-bold">Görselin hazırlandı! ✨</p>
                    </div>
                    <button onClick={startCamera} className="text-xl">🔄</button>
                </div>
            )}
            <div className="mt-4 px-4 pt-2 shrink-0">
              <button onClick={() => setStep(2)} className="w-full bg-gradient-to-r from-magic-500 to-sky-500 text-white py-4 rounded-magic font-bold shadow-lg transform active:scale-95 transition-all text-lg">İleri ➡️</button>
            </div>
          </div>
        )}

        {step === 2 && (
          <div className="flex-1 flex flex-col min-h-0">
            <h2 className="text-xl text-center mb-4 font-bold text-magic-600 dark:text-magic-400 shrink-0">Bir Arkadaş Seç</h2>
            <SelectionGrid 
              items={SIDE_CHARACTERS} 
              selected={sideCharId} 
              onSelect={setSideCharId}
              showNameInput={sideCharId !== 'sc_none'}
              placeholder={sideCharId === 'sc_villain' ? "Karakterin Adı..." : "Arkadaşının Adı..."}
              nameValue={sideCharName}
              onNameChange={setSideCharName}
              customValue={sideCharId === 'sc_villain' ? customVillainType : customSideChar}
              onCustomValueChange={sideCharId === 'sc_villain' ? setCustomVillainType : setCustomSideChar}
              customPlaceholder={sideCharId === 'sc_villain' ? "Karakterin Türü (Örn: Kötü Cadı, Canavar...)" : "Kendi seçimini yaz..."}
              allowSelf={false}
            />
             <div className="flex gap-4 mt-4 px-4 pt-2 shrink-0">
              <button onClick={() => setStep(1)} className="flex-1 bg-white dark:bg-slate-900 border-2 border-magic-100 dark:border-slate-800 text-magic-600 py-4 rounded-magic font-bold transform active:scale-95 transition-all">⬅️ Geri</button>
              <button onClick={() => setStep(3)} className="flex-1 bg-gradient-to-r from-magic-500 to-sky-500 text-white py-4 rounded-magic font-bold shadow-lg transform active:scale-95 transition-all">İleri ➡️</button>
            </div>
          </div>
        )}

        {step === 3 && (
          <div className="flex-1 flex flex-col min-h-0">
            <h2 className="text-xl text-center mb-4 font-bold text-magic-600 dark:text-magic-400 shrink-0">Macera Nerede Geçiyor?</h2>
            <SelectionGrid 
                items={LOCATIONS} 
                selected={locationId} 
                onSelect={setLocationId} 
                customValue={customLocation}
                onCustomValueChange={setCustomLocation}
                customPlaceholder="Örn: Çikolata Şehri, Su Altı Köyü..."
                allowSelf={false}
            />
             <div className="flex gap-4 mt-4 px-4 pt-2 shrink-0">
              <button onClick={() => setStep(2)} className="flex-1 bg-white dark:bg-slate-900 border-2 border-magic-100 dark:border-slate-800 text-magic-600 py-4 rounded-magic font-bold transform active:scale-95 transition-all">⬅️ Geri</button>
              <button onClick={() => setStep(4)} className="flex-1 bg-gradient-to-r from-magic-500 to-sky-500 text-white py-4 rounded-magic font-bold shadow-lg transform active:scale-95 transition-all">İleri ➡️</button>
            </div>
          </div>
        )}

        {step === 4 && (
          <div className="flex-1 flex flex-col min-h-0">
            <h2 className="text-xl text-center mb-4 font-bold text-magic-600 dark:text-magic-400 shrink-0">Masalın Konusu Ne?</h2>
            <SelectionGrid 
                items={THEMES} 
                selected={themeId} 
                onSelect={setThemeId} 
                customValue={customTheme}
                onCustomValueChange={setCustomTheme}
                customPlaceholder="Örn: Sebze Yemeği Sevgisi, Yardımseverlik..."
                allowSelf={false}
            />
             <div className="flex gap-4 mt-4 px-4 pt-2 shrink-0">
              <button onClick={() => setStep(3)} className="flex-1 bg-white dark:bg-slate-900 border-2 border-magic-100 dark:border-slate-800 text-magic-600 py-4 rounded-magic font-bold transform active:scale-95 transition-all">⬅️ Geri</button>
              <button onClick={() => setStep(5)} className="flex-1 bg-gradient-to-r from-magic-500 to-sky-500 text-white py-4 rounded-magic font-bold shadow-lg transform active:scale-95 transition-all">İleri ➡️</button>
            </div>
          </div>
        )}

        {step === 5 && (
          <div className="flex-1 flex flex-col min-h-0">
            <h2 className="text-xl text-center mb-4 font-bold text-magic-600 dark:text-magic-400 shrink-0">Çizim Tarzı Nasıl Olsun?</h2>
            <SelectionGrid 
                items={VISUAL_STYLES} 
                selected={styleId} 
                onSelect={setStyleId} 
                allowSelf={false}
                allowOther={false}
            />
             <div className="flex gap-4 mt-4 px-4 pt-2 shrink-0">
              <button onClick={() => setStep(4)} className="flex-1 bg-white dark:bg-slate-900 border-2 border-magic-100 dark:border-slate-800 text-magic-600 py-4 rounded-magic font-bold transform active:scale-95 transition-all">⬅️ Geri</button>
              <button onClick={() => setStep(6)} className="flex-1 bg-gradient-to-r from-magic-500 to-sky-500 text-white py-4 rounded-magic font-bold shadow-lg transform active:scale-95 transition-all">İleri ➡️</button>
            </div>
          </div>
        )}

        {step === 6 && (
          <div className="flex-1 flex flex-col min-h-0">
            <h2 className="text-xl text-center mb-4 font-bold text-magic-600 dark:text-magic-400 shrink-0">Masalı Kim Anlatsın?</h2>
            <div className={`grid grid-cols-2 gap-4 mb-6 px-4 ${!settings.soundEnabled ? 'opacity-50 pointer-events-none' : ''}`}>
              <div 
                onClick={() => setVoice(VoiceType.Female)} 
                className={`p-8 rounded-magic border-2 text-center cursor-pointer transition-all duration-500 ${voice === VoiceType.Female ? 'bg-white dark:bg-slate-800 border-gold-400 shadow-lg scale-105' : 'bg-magic-50 dark:bg-slate-900 border-transparent shadow-sm'}`}
              >
                <div className={`text-6xl mb-3 ${voice === VoiceType.Female ? 'animate-float' : ''}`}>👩</div>
                <div className="font-bold text-magic-900 dark:text-slate-100 text-lg tracking-tight">Kadın Sesi</div>
              </div>
              <div 
                onClick={() => setVoice(VoiceType.Male)} 
                className={`p-8 rounded-magic border-2 text-center cursor-pointer transition-all duration-500 ${voice === VoiceType.Male ? 'bg-white dark:bg-slate-800 border-gold-400 shadow-lg scale-105' : 'bg-sky-50 dark:bg-slate-900 border-transparent shadow-sm'}`}
              >
                <div className={`text-6xl mb-3 ${voice === VoiceType.Male ? 'animate-float' : ''}`}>👨</div>
                <div className="font-bold text-magic-900 dark:text-slate-100 text-lg tracking-tight">Erkek Sesi</div>
              </div>
            </div>
            <div className="mx-4 bg-white/60 dark:bg-slate-900/60 backdrop-blur-sm border-2 border-magic-100 dark:border-slate-800 p-5 rounded-magic text-center mb-4 shadow-inner shrink-0">
              <p className="text-sm font-bold text-magic-800 dark:text-slate-300">
                Sihirli Anlatıcı: <span className={`${settings.soundEnabled ? 'text-green-600' : 'text-red-500'}`}>
                  {settings.soundEnabled ? 'HAZIR' : 'KAPALI'}
                </span>
              </p>
              {!settings.soundEnabled && (
                <p className="text-[10px] text-magic-400 mt-1 font-bold">Seslendirme özelliğini ayarlardan aktif edebilirsiniz.</p>
              )}
            </div>
            <div className="flex gap-4 mt-auto px-4 pt-2 shrink-0">
              <button onClick={() => setStep(5)} className="flex-1 bg-white dark:bg-slate-900 border-2 border-magic-100 dark:border-slate-800 text-magic-600 py-4 rounded-magic font-bold transform active:scale-95 transition-all">⬅️ Geri</button>
              <button onClick={() => setStep(7)} className="flex-1 bg-gradient-to-r from-magic-500 to-sky-500 text-white py-4 rounded-magic font-bold shadow-lg transform active:scale-95 transition-all">İleri ➡️</button>
            </div>
          </div>
        )}

         {step === 7 && (
          <div className="flex-1 flex flex-col min-h-0">
            <h2 className="text-xl text-center mb-6 font-bold text-magic-600 dark:text-magic-400 shrink-0">Masalın Dili Ne Olsun?</h2>
            <div className="grid grid-cols-2 gap-4 px-4 mb-6">
              <div 
                onClick={() => setLanguage('tr')} 
                className={`p-4 md:p-8 rounded-magic border-2 text-center cursor-pointer transition-all duration-500 ${language === 'tr' ? 'bg-white dark:bg-slate-800 border-gold-400 shadow-[0_0_20px_rgba(251,191,36,0.2)] scale-105 z-10' : 'bg-white/40 dark:bg-slate-900/40 border-transparent shadow-sm opacity-60'}`}
              >
                <div className={`w-28 h-20 md:w-40 md:h-28 mx-auto mb-4 rounded-xl overflow-hidden border-2 border-white/10 shadow-lg transition-transform duration-500 ${language === 'tr' ? 'scale-110 animate-flag-wave' : ''}`}>
                    <img src="https://flagcdn.com/tr.svg" className="w-full h-full object-cover" alt="Türkçe" />
                </div>
                <div className="font-bold text-[10px] md:text-xs uppercase tracking-[0.3em] text-magic-900 dark:text-white">Türkçe</div>
              </div>
              <div 
                onClick={() => setLanguage('en')} 
                className={`p-4 md:p-8 rounded-magic border-2 text-center cursor-pointer transition-all duration-500 ${language === 'en' ? 'bg-white dark:bg-slate-800 border-gold-400 shadow-[0_0_20px_rgba(251,191,36,0.2)] scale-105 z-10' : 'bg-white/40 dark:bg-slate-900/40 border-transparent shadow-sm opacity-60'}`}
              >
                <div className={`w-28 h-20 md:w-40 md:h-28 mx-auto mb-4 rounded-xl overflow-hidden border-2 border-white/10 shadow-lg transition-transform duration-500 ${language === 'en' ? 'scale-110 animate-flag-wave' : ''}`}>
                    <img src="https://flagcdn.com/gb.svg" className="w-full h-full object-cover" alt="English" />
                </div>
                <div className="font-bold text-[10px] md:text-xs uppercase tracking-[0.3em] text-magic-900 dark:text-white">ENGLISH</div>
              </div>
            </div>
            <div className="flex gap-4 mt-auto px-4 pt-2 pb-6 shrink-0">
              <button onClick={() => setStep(6)} className="flex-1 bg-white dark:bg-slate-900 border-2 border-magic-100 dark:border-slate-800 text-magic-600 py-4 rounded-magic font-bold transform active:scale-95 transition-all">⬅️ Geri</button>
              <button 
                onClick={handleFinish} 
                className="flex-[2] bg-gradient-to-r from-gold-400 via-orange-400 to-pink-500 text-white py-4 rounded-magic font-bold shadow-xl transform active:scale-95 transition-all text-xl"
              >
                Sihri Başlat! ✨
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
