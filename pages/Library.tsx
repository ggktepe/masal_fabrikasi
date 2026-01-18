
import React from 'react';
import { useApp } from '../context/AppContext';
import { Story } from '../types';

export const Library: React.FC = () => {
  const { stories, deleteStory, userProfile, openStory, resumeGeneration } = useApp();

  const handleDelete = async (e: React.MouseEvent, id: string) => {
    e.stopPropagation();
    if(confirm("Bu masalı silmek istiyor musun?")) {
        await deleteStory(id);
    }
  };

  const getDynamicTitle = () => {
    if (!userProfile?.childName) return "Masal Kütüphanesi";
    const name = userProfile.childName.trim();
    const vowels = "aıeiouöüAEIİOÖUÜ";
    const lastChar = name.slice(-1);
    let lastVowel = 'e'; 
    for (let i = name.length - 1; i >= 0; i--) {
        if (vowels.includes(name[i])) { lastVowel = name[i].toLowerCase(); break; }
    }
    const endsWithVowel = vowels.includes(lastChar);
    let suffix = "in";
    if (['a', 'ı'].includes(lastVowel)) suffix = "ın";
    else if (['e', 'i', 'İ'].includes(lastVowel)) suffix = "in";
    else if (['o', 'u'].includes(lastVowel)) suffix = "un";
    else if (['ö', 'ü'].includes(lastVowel)) suffix = "ün";
    if (endsWithVowel) return `${name}'n${suffix} Kütüphanesi`;
    return `${name}'${suffix} Kütüphanesi`;
  };

  const handleResume = (e: React.MouseEvent, story: Story) => {
    e.stopPropagation();
    resumeGeneration(story);
  };

  return (
    <div className="p-4 pb-24 h-full overflow-y-auto">
      <h2 className="text-2xl font-bold mb-6 text-magic-900 dark:text-white">{getDynamicTitle()} 📚</h2>

      {stories.length === 0 ? (
        <div className="text-center mt-20 opacity-50 text-magic-400">
          <div className="text-6xl mb-4 grayscale opacity-50">🏰</div>
          <p>Henüz hiç masal yok!</p>
          <p>Bir tane yapmak için 'Oluştur'a git.</p>
        </div>
      ) : (
        <div className="grid grid-cols-2 gap-4">
          {stories.map(story => (
            <div key={story.id} className="relative group">
              <div 
                onClick={() => story.isComplete && openStory(story)}
                className={`bg-white dark:bg-slate-900 rounded-xl overflow-hidden shadow-lg hover:shadow-xl cursor-pointer transform transition-all hover:-translate-y-1 border dark:border-slate-800 ${!story.isComplete ? 'ring-2 ring-magic-300' : ''}`}
              >
                <div className="aspect-square bg-gray-200 dark:bg-slate-800 relative">
                   {story.coverImage ? (
                       <img src={story.coverImage} className="w-full h-full object-cover" alt={story.title} />
                   ) : (
                       <div className="w-full h-full bg-magic-100 dark:bg-slate-900 flex items-center justify-center text-4xl">📖</div>
                   )}
                   
                   {!story.isComplete && (
                       <div className="absolute inset-0 bg-black/50 backdrop-blur-[2px] flex flex-col items-center justify-center p-2 text-center">
                           <div className="w-8 h-8 border-2 border-white/30 border-t-white rounded-full animate-spin mb-2"></div>
                           <span className="text-[10px] text-white font-bold uppercase tracking-widest">Yarım Kaldı</span>
                           <button 
                             onClick={(e) => handleResume(e, story)}
                             className="mt-2 bg-magic-500 text-white text-[10px] font-bold py-1 px-3 rounded-full hover:bg-magic-600 active:scale-95 transition-all"
                           >
                             Devam Et ✨
                           </button>
                       </div>
                   )}
                </div>
                <div className="p-3 bg-white dark:bg-slate-900">
                  <h3 className="text-magic-900 dark:text-slate-100 font-bold truncate text-sm">{story.title}</h3>
                  <p className="text-magic-400 dark:text-slate-500 text-xs">{new Date(story.createdAt).toLocaleDateString()}</p>
                </div>
              </div>
              <button 
                onClick={(e) => handleDelete(e, story.id)}
                className="absolute top-2 right-2 bg-red-500 text-white w-6 h-6 rounded-full text-xs flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity shadow-md z-20"
              >
                X
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
