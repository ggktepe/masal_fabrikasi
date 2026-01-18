
import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Story, StoryPage } from '../types';
import { useApp } from '../context/AppContext';
import { generateNarration } from '../services/geminiService';
import { supabase } from '../supabaseClient';

interface Props {
  story: Story;
  onClose: () => void;
}

function decodeBase64(base64: string) {
  const binaryString = atob(base64);
  const len = binaryString.length;
  const bytes = new Uint8Array(len);
  for (let i = 0; i < len; i++) {
    bytes[i] = binaryString.charCodeAt(i);
  }
  return bytes;
}

async function decodeAudioData(
  data: Uint8Array,
  ctx: AudioContext,
  sampleRate: number = 24000,
  numChannels: number = 1
): Promise<AudioBuffer> {
  const dataInt16 = new Int16Array(data.buffer);
  const frameCount = dataInt16.length / numChannels;
  const buffer = ctx.createBuffer(numChannels, frameCount, sampleRate);

  for (let channel = 0; channel < numChannels; channel++) {
    const channelData = buffer.getChannelData(channel);
    for (let i = 0; i < frameCount; i++) {
      channelData[i] = dataInt16[i * numChannels + channel] / 32768.0;
    }
  }
  return buffer;
}

export const StoryReader: React.FC<Props> = ({ story, onClose }) => {
  const { settings, resumeGeneration } = useApp();
  const [currentPageIndex, setCurrentPageIndex] = useState(-1); // -1 is Cover
  const [pages, setPages] = useState<StoryPage[]>(story.pages || []);
  const [isPlaying, setIsPlaying] = useState(false);
  const [loadingAudio, setLoadingAudio] = useState(false);
  const [isListeningMode, setIsListeningMode] = useState(false); 
  
  const [isPagesLoading, setIsPagesLoading] = useState(false);
  const [fetchError, setFetchError] = useState<string | null>(null);
  
  const audioContextRef = useRef<AudioContext | null>(null);
  const audioSourceRef = useRef<AudioBufferSourceNode | null>(null);
  const audioElemRef = useRef<HTMLAudioElement | null>(null);

  const textContainerRef = useRef<HTMLDivElement>(null);

  const handleNext = useCallback(() => {
    if (currentPageIndex < pages.length - 1) {
      setCurrentPageIndex(prev => prev + 1);
    } else {
        onClose();
    }
  }, [currentPageIndex, pages.length, onClose]);

  const goToPrev = () => {
    if (currentPageIndex > -1) {
      setCurrentPageIndex(prev => prev - 1);
    }
  };

  const loadFullStory = useCallback(async () => {
      setFetchError(null);
      if (story.pages && story.pages.length > 0) {
          const hasContent = story.pages.some(p => p.text || p.imageUrl);
          if (hasContent) {
            setPages(story.pages);
            return;
          }
      }

      setIsPagesLoading(true);
      try {
          const { data, error } = await supabase
              .from('stories')
              .select('pages')
              .eq('id', story.id)
              .single();
          
          if (error) throw error;
          
          if (data && data.pages && data.pages.length > 0) {
              setPages(data.pages);
          } else {
              throw new Error("Masal içeriği henüz hazır değil veya boş kaydedilmiş. Lütfen kütüphaneden 'Devam Et' butonunu deneyin.");
          }
      } catch (error: any) {
          console.error("Error loading story pages:", error);
          setFetchError(error?.message || "Hikaye yüklenirken bir hata oluştu.");
      } finally {
          setIsPagesLoading(false);
      }
  }, [story.id, story.pages]);

  useEffect(() => {
      loadFullStory();
  }, [loadFullStory]);

  useEffect(() => {
    const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
    audioContextRef.current = new AudioContextClass({ sampleRate: 24000 });
    
    const audio = new Audio();
    audio.preload = "auto";
    
    audio.onplaying = () => { setIsPlaying(true); setLoadingAudio(false); };
    audio.onpause = () => setIsPlaying(false);
    audio.onerror = (e) => { 
        console.error("Audio Element Error:", e);
        setIsPlaying(false); 
        setLoadingAudio(false); 
    };
    
    audioElemRef.current = audio;

    return () => {
      stopAudio();
      audioContextRef.current?.close();
    };
  }, []);

  const stopAudio = useCallback(() => {
      if (audioSourceRef.current) {
          try { audioSourceRef.current.stop(); } catch(e) {}
          audioSourceRef.current.disconnect();
          audioSourceRef.current = null;
      }
      
      if (audioElemRef.current) {
          audioElemRef.current.pause();
          audioElemRef.current.currentTime = 0;
          audioElemRef.current.removeAttribute('src'); 
          audioElemRef.current.load(); 
      }

      setIsPlaying(false);
      setLoadingAudio(false);
  }, []);

  const onAudioEnded = useCallback(() => {
    setIsPlaying(false);
    if (settings.autoPageTransition) {
        setTimeout(() => {
            handleNext();
        }, 1200);
    } else {
        setIsListeningMode(false); 
    }
  }, [settings.autoPageTransition, handleNext]);

  const startAudio = useCallback(async (index: number) => {
    if (index === -1) return;
    const page = pages[index];
    if (!page) return;

    if (audioContextRef.current && audioContextRef.current.state === 'suspended') {
        try { await audioContextRef.current.resume(); } catch(e) { console.error(e); }
    }

    setLoadingAudio(true);
    try {
        if (page.audioUrl) {
             if (audioElemRef.current) {
                 audioElemRef.current.onended = onAudioEnded;
                 audioElemRef.current.src = page.audioUrl;
                 await audioElemRef.current.play();
                 setIsPlaying(true);
                 setLoadingAudio(false);
             }
             return;
        }

        let audioData = page.audioData;
        if (!audioData) {
            const generatedAudio = await generateNarration(page.text, story.params.voice);
            if (generatedAudio) {
                audioData = generatedAudio;
                const updatedPages = [...pages];
                updatedPages[index] = { ...updatedPages[index], audioData };
                setPages(updatedPages);
                
                supabase.from('stories').select('pages').eq('id', story.id).single().then(({data}) => {
                    if (data && data.pages) {
                        const dbPages = data.pages;
                        dbPages[index].audioData = generatedAudio;
                        supabase.from('stories').update({ pages: dbPages }).eq('id', story.id);
                    }
                });
            } else {
                alert("Ses üretilemedi.");
                setLoadingAudio(false);
                setIsListeningMode(false);
                return;
            }
        }

        if (audioData && audioContextRef.current) {
            const bytes = decodeBase64(audioData);
            const buffer = await decodeAudioData(bytes, audioContextRef.current);
            const source = audioContextRef.current.createBufferSource();
            source.buffer = buffer;
            source.connect(audioContextRef.current.destination);
            source.onended = onAudioEnded;
            audioSourceRef.current = source;
            source.start(0);
            setIsPlaying(true);
            setLoadingAudio(false);
        }
    } catch (e: any) {
        console.error("Audio playback error:", e);
        setLoadingAudio(false);
        setIsListeningMode(false);
    }
  }, [pages, story.id, story.params.voice, onAudioEnded]);

  useEffect(() => {
      stopAudio();
      if (textContainerRef.current) {
          textContainerRef.current.scrollTop = 0;
      }
      if (isListeningMode && currentPageIndex >= 0) {
          startAudio(currentPageIndex);
      }
  }, [currentPageIndex, isListeningMode, stopAudio, startAudio]);

  const toggleAudio = async () => {
    if (currentPageIndex === -1) return;
    if (isPlaying) {
        setIsListeningMode(false);
        stopAudio();
    } else {
        setIsListeningMode(true);
    }
  };

  const handleRescue = () => {
      onClose();
      resumeGeneration(story);
  };

  if (currentPageIndex === -1) {
    return (
      <div className="fixed inset-0 z-50 bg-sky-50 dark:bg-slate-950 flex flex-col h-[100dvh] transition-colors duration-500">
        <div className="absolute top-4 right-4 z-50">
             <button onClick={onClose} className="bg-white/80 dark:bg-slate-800/80 backdrop-blur text-black/50 dark:text-white/50 rounded-full w-10 h-10 flex items-center justify-center hover:bg-white dark:hover:bg-slate-700 shadow-md">✖️</button>
        </div>
        <div className="flex-1 flex flex-col items-center justify-center p-6 pb-24 overflow-y-auto">
            <div className="bg-white dark:bg-slate-900 p-3 rounded-xl shadow-2xl rotate-1 mb-8 max-w-sm w-full border border-gray-100 dark:border-slate-800 transform transition-transform hover:scale-105 duration-500 max-h-[50vh] flex items-center justify-center overflow-hidden shrink-0">
                <img src={story.coverImage || "https://picsum.photos/400/400"} className="w-full h-full object-cover rounded-lg aspect-square" alt="Cover" />
            </div>
            <h1 className="text-2xl md:text-3xl font-bold text-center text-magic-600 dark:text-magic-400 mb-2 font-sans drop-shadow-sm px-4">{story.title}</h1>
            <p className="text-magic-400 dark:text-slate-500 text-sm">{new Date(story.createdAt).toLocaleDateString()}</p>
        </div>
        <div className="p-6 bg-white dark:bg-slate-900 border-t border-sky-100 dark:border-slate-800 shadow-[0_-5px_20px_rgba(0,0,0,0.1)] mt-auto z-40 shrink-0">
            {fetchError ? (
                <div className="text-center">
                    <p className="text-red-500 mb-4 font-bold text-sm bg-red-50 dark:bg-red-950/20 p-3 rounded-2xl">{fetchError}</p>
                    <div className="flex gap-4">
                        <button onClick={loadFullStory} className="flex-1 font-bold py-3 rounded-xl bg-sky-100 dark:bg-slate-800 text-magic-700 dark:text-magic-300">Yenile 🔄</button>
                        <button onClick={handleRescue} className="flex-1 font-bold py-3 rounded-xl bg-magic-500 text-white shadow-md">Kurtarmayı Dene ✨</button>
                    </div>
                </div>
            ) : (
                <button 
                onClick={handleNext}
                className={`w-full font-bold text-xl py-4 rounded-xl shadow-xl transform transition-all ${
                    isPagesLoading ? 'bg-gradient-to-r from-gray-200 to-gray-300 dark:from-slate-700 dark:to-slate-800 text-white cursor-wait' : 'bg-gradient-to-r from-gold-400 to-orange-400 hover:from-gold-500 hover:to-orange-500 text-white hover:scale-105 animate-bounce-subtle'
                }`}
                >
                {isPagesLoading ? 'Hazırlanıyor... ✨' : 'Kitabı Aç 📖'}
                </button>
            )}
        </div>
      </div>
    );
  }

  const currentPage = pages[currentPageIndex];

  return (
    <div className="fixed inset-0 z-50 bg-sky-50 dark:bg-slate-950 flex flex-col h-[100dvh] transition-colors duration-500">
      <div className="flex justify-between items-center p-4 bg-white dark:bg-slate-900 shadow-sm z-10 shrink-0 transition-colors">
        <button onClick={() => { setIsListeningMode(false); onClose(); }} className="text-magic-600 dark:text-magic-400 font-bold px-3 py-1 rounded-lg hover:bg-sky-50 dark:hover:bg-slate-800 transition-colors">Çıkış</button>
        <span className="text-magic-400 dark:text-slate-500 font-bold bg-sky-50 dark:bg-slate-800 px-3 py-1 rounded-full text-xs">
            Sayfa {currentPageIndex + 1} / {pages.length}
        </span>
        <div className="w-8"></div>
      </div>

      <div className="flex-1 flex flex-col md:flex-row landscape:flex-row items-center justify-center p-4 gap-4 md:gap-8 overflow-hidden relative">
        <div className="w-full md:w-auto landscape:w-auto shrink-0 h-auto md:h-full landscape:h-full max-h-[45vh] md:max-h-[75vh] landscape:max-h-[75vh] aspect-square bg-white dark:bg-slate-900 rounded-2xl shadow-lg border-4 border-white dark:border-slate-800 flex items-center justify-center overflow-hidden relative">
             {currentPage?.imageUrl ? (
                 <img src={currentPage.imageUrl} alt="Page" className="w-full h-full object-cover" />
             ) : (
                 <div className="text-magic-300 dark:text-slate-700 text-6xl">🖼️</div>
             )}
        </div>

        <div ref={textContainerRef} className="flex-1 w-full md:w-auto landscape:w-auto md:h-full landscape:h-full md:max-h-[75vh] landscape:max-h-[75vh] overflow-y-auto no-scrollbar bg-white/60 dark:bg-slate-900/40 backdrop-blur-sm rounded-2xl border border-sky-100 dark:border-slate-800 shadow-inner flex flex-col items-center p-4 transition-colors">
            <div className="w-full">
              <p className="text-lg md:text-xl leading-relaxed text-center font-sans font-medium text-magic-900 dark:text-slate-100">
                {currentPage?.text}
              </p>
            </div>
        </div>
      </div>

      <div className="p-4 bg-white dark:bg-slate-900 border-t border-sky-100 dark:border-slate-800 flex justify-between items-center gap-3 shadow-[0_-5px_15px_rgba(0,0,0,0.05)] shrink-0 pb-safe transition-colors">
        <button onClick={goToPrev} className="flex-1 bg-sky-100 dark:bg-slate-800 text-magic-700 dark:text-magic-300 py-4 rounded-xl font-bold hover:bg-sky-200 dark:hover:bg-slate-700 transition-colors">⬅️ Geri</button>
        
        <button 
            onClick={toggleAudio}
            disabled={loadingAudio}
            className={`shrink-0 flex items-center justify-center w-14 h-14 rounded-full font-bold shadow-md transition-all ${
                isPlaying 
                ? 'bg-red-500 text-white animate-pulse' 
                : 'bg-green-500 text-white hover:scale-110 active:scale-95'
            } ${loadingAudio ? 'opacity-50 cursor-wait' : ''}`}
            aria-label={isPlaying ? 'Durdur' : 'Dinle'}
        >
            {loadingAudio ? <span className="text-xs">⏳</span> : isPlaying ? <span className="text-xl">⏸️</span> : <span className="text-xl">🔊</span>}
        </button>

        <button 
            onClick={handleNext}
            className={`flex-1 py-4 rounded-xl font-bold transition-colors ${
                currentPageIndex === pages.length - 1 ? 'bg-gradient-to-r from-red-400 to-pink-500 text-white shadow-lg' : 'bg-magic-500 dark:bg-magic-700 text-white hover:bg-magic-600 dark:hover:bg-magic-600 shadow-md'
            }`}
        >
            {currentPageIndex === pages.length - 1 ? 'Bitir 🏁' : 'İleri ➡️'}
        </button>
      </div>
    </div>
  );
};
