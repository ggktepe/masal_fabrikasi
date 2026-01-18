
import React, { useEffect, useState } from 'react';
import { useApp } from '../context/AppContext';
import { Gender } from '../types';

interface LeaderEntry {
  child_name: string;
  stories_count: number;
  email?: string;
  child_photo?: string;
  gender?: Gender;
}

export const Leaderboard: React.FC = () => {
  const { getLeaderboard, userProfile, settings } = useApp();
  const [leaders, setLeaders] = useState<LeaderEntry[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchLeaders = async () => {
      setLoading(true);
      const data = await getLeaderboard();
      setLeaders(data);
      setLoading(false);
    };

    fetchLeaders();
  }, [getLeaderboard]);

  const maskName = (name: string, isMe: boolean) => {
    if (isMe) return name;
    if (!name) return 'Gizli Kahraman';
    const firstChar = name.charAt(0);
    const stars = '*'.repeat(Math.max(2, name.length - 1));
    return `${firstChar}${stars}`;
  };

  const myRankIndex = leaders.findIndex(l => l.email === userProfile?.email);
  const isUserInTop3 = myRankIndex >= 0 && myRankIndex < 3;
  
  const top3 = leaders.slice(0, 3);
  const podiumOrder = [
    { entry: top3[1], rank: 2, pos: 'left' },
    { entry: top3[0], rank: 1, pos: 'center' },
    { entry: top3[2], rank: 3, pos: 'right' }
  ];

  const getDefaultEmoji = (gender?: Gender) => {
      if (gender === Gender.Boy) return '👦';
      if (gender === Gender.Girl) return '👧';
      return '🐣';
  };

  if (loading) {
    return (
      <div className={`h-full flex items-center justify-center ${settings.darkMode ? 'bg-[#0a0f1e]' : 'bg-sky-50'}`}>
        <div className="w-12 h-12 border-4 border-magic-500 border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  return (
    <div className={`relative h-full w-full flex flex-col overflow-hidden transition-colors duration-500 ${settings.darkMode ? 'bg-[#0a0f1e]' : 'bg-sky-50'}`}>
      {/* 1. Background Image - Pale and Full Screen */}
      <div className="fixed inset-0 z-0">
        <img 
          src="https://qwmvqpbnxqxaoskieyyw.supabase.co/storage/v1/object/public/images/icon.png" 
          className="w-full h-full object-cover opacity-20 dark:opacity-10 scale-110 blur-[0.5px]" 
          alt="Magical Castle Background"
        />
        <div className={`absolute inset-0 transition-colors duration-500 ${settings.darkMode ? 'bg-gradient-to-b from-[#0a0f1e]/80 via-transparent to-[#0a0f1e]' : 'bg-gradient-to-b from-sky-100/80 via-transparent to-sky-50'}`}></div>
        <div className={`absolute inset-0 bg-radial-at-t transition-opacity duration-500 ${settings.darkMode ? 'from-magic-500/10' : 'from-magic-400/5'} via-transparent to-transparent`}></div>
      </div>

      {/* 2. Header Area */}
      <div className="relative z-10 pt-10 text-center shrink-0">
          <div className="inline-flex items-center gap-3 mb-1">
              <span className="text-2xl animate-pulse">✨</span>
              <h2 className={`text-3xl font-black tracking-tight drop-shadow-sm transition-colors duration-500 ${settings.darkMode ? 'text-white' : 'text-magic-700'}`}>
                Okuma Şampiyonları
              </h2>
              <span className="text-2xl animate-pulse">✨</span>
          </div>
          <p className="text-gold-500 font-black uppercase tracking-[0.4em] text-[9px] drop-shadow-md">
            Sihirli Fabrika Kürsüsü
          </p>
      </div>

      {/* 3. Podium Area */}
      <div className="relative z-10 flex-1 flex flex-col items-center justify-end px-4 pb-12">
        
        {/* Podium Row */}
        <div className="flex items-end justify-center w-full max-w-sm gap-3 mb-4">
          {podiumOrder.map((item, idx) => {
            const entry = item.entry;
            if (!entry) return <div key={idx} className="flex-1"></div>;
            
            const isMe = entry.email === userProfile?.email;
            const isFirst = item.rank === 1;
            const shouldShowPhoto = isMe && entry.child_photo;
            
            return (
              <div key={idx} className={`flex-1 flex flex-col items-center group ${isFirst ? 'z-20' : 'z-10'} animate-fade-in-up`} style={{ animationDelay: `${idx * 150}ms` }}>
                
                {/* Avatar with Magical Frame */}
                <div className={`relative mb-3 transition-all duration-700 ${isFirst ? 'scale-125 -translate-y-4' : 'scale-100 hover:scale-105'}`}>
                   {isFirst && (
                    <>
                      <div className="absolute -top-8 left-1/2 -translate-x-1/2 text-3xl animate-bounce drop-shadow-[0_0_15px_rgba(251,191,36,0.8)]">👑</div>
                      <div className="absolute inset-0 bg-magic-400/30 rounded-full blur-xl animate-pulse -z-10"></div>
                    </>
                   )}
                   
                   <div className={`w-14 h-14 rounded-full border-4 shadow-2xl overflow-hidden ${
                     isFirst ? 'border-gold-400 ring-4 ring-magic-500/30' : 
                     item.rank === 2 ? 'border-sky-400' : 
                     'border-orange-400'
                   } ${settings.darkMode ? 'bg-slate-900' : 'bg-white'}`}>
                        {shouldShowPhoto ? (
                            <img src={entry.child_photo} className="w-full h-full object-cover" alt="Hero" />
                        ) : (
                            <div className={`w-full h-full flex items-center justify-center text-3xl ${settings.darkMode ? 'bg-indigo-950' : 'bg-sky-100'}`}>
                                {getDefaultEmoji(entry.gender)}
                            </div>
                        )}
                   </div>
                   
                   {/* Rank Badge */}
                   <div className={`absolute -bottom-1 -right-1 w-7 h-7 rounded-full flex items-center justify-center text-[11px] font-black border-2 shadow-xl ${
                       isFirst ? 'bg-gradient-to-br from-gold-300 via-gold-500 to-magic-500 text-white border-gold-200' : 
                       item.rank === 2 ? 'bg-gradient-to-br from-sky-300 to-sky-600 text-white border-sky-100' : 
                       'bg-gradient-to-br from-orange-400 to-orange-700 text-white border-orange-200'
                   }`}>
                       {item.rank}
                   </div>
                </div>

                {/* Info Box */}
                <div className={`w-full backdrop-blur-xl border rounded-2xl p-2 mb-2 text-center shadow-2xl transform transition-transform group-hover:scale-105 ${
                  isFirst 
                  ? (settings.darkMode ? 'bg-magic-900/80 border-magic-400/50' : 'bg-magic-500 border-magic-300 shadow-magic-200/50') 
                  : (settings.darkMode ? 'bg-[#1e1b4b]/80 border-white/10' : 'bg-white/90 border-sky-200 shadow-sky-200/50')
                }`}>
                    <p className={`text-[10px] font-black truncate leading-none mb-1 ${isMe ? 'text-gold-400' : (isFirst && !settings.darkMode ? 'text-white' : (settings.darkMode ? 'text-slate-100' : 'text-magic-900'))}`}>
                        {maskName(entry.child_name, isMe)}
                    </p>
                    <div className="flex flex-col items-center">
                        <span className={`text-sm font-black leading-none drop-shadow-sm ${isFirst && !settings.darkMode ? 'text-white' : (settings.darkMode ? 'text-white' : 'text-magic-800')}`}>{entry.stories_count}</span>
                        <span className={`text-[7px] font-bold uppercase tracking-widest ${isFirst ? 'text-gold-300' : 'text-indigo-400'}`}>Masal</span>
                    </div>
                </div>

                {/* Podium Platform */}
                <div className={`w-full rounded-t-2xl border-t-4 shadow-[0_-10px_40px_rgba(0,0,0,0.5)] relative overflow-hidden flex items-center justify-center transition-all ${
                    isFirst ? 'h-36 bg-gradient-to-b from-magic-500 via-magic-700 to-indigo-950 border-gold-400' : 
                    item.rank === 2 ? 'h-28 bg-gradient-to-b from-sky-500 to-indigo-950 border-sky-300' : 
                    'h-20 bg-gradient-to-b from-orange-500 to-indigo-950 border-orange-400'
                }`}>
                    <span className="text-5xl font-black text-white/10 select-none">{item.rank}</span>
                    <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/carbon-fibre.png')] opacity-10"></div>
                </div>
              </div>
            );
          })}
        </div>

        {/* 4. Magical Glow Base (Replaced broken image with CSS Glow) */}
        <div className="w-full relative h-16 flex justify-center items-center pointer-events-none -mt-4 z-20">
             {/* Dynamic Glow Layer */}
             <div className={`absolute -top-4 w-64 h-32 rounded-full blur-[60px] animate-pulse transition-colors duration-1000 ${settings.darkMode ? 'bg-magic-500/20' : 'bg-gold-500/30'}`}></div>
             {/* Floating Particle Emojis for Magic Effect */}
             <div className="flex gap-12 opacity-40 text-xl">
                <span className="animate-float" style={{animationDelay: '0s'}}>✨</span>
                <span className="animate-float" style={{animationDelay: '1s'}}>🌟</span>
                <span className="animate-float" style={{animationDelay: '2s'}}>✨</span>
             </div>
        </div>
      </div>

      {/* 5. User Statistics Banner */}
      <div className="relative z-30 px-6 pb-28 shrink-0">
          {!isUserInTop3 && userProfile && (
             <div className="animate-fade-in-up">
                <div className="flex justify-center -mb-3 relative z-10">
                    <div className={`px-8 py-1.5 rounded-full shadow-2xl border-2 border-white/20 ${settings.darkMode ? 'bg-gradient-to-r from-magic-600 to-indigo-600' : 'bg-gradient-to-r from-magic-400 to-sky-400'}`}>
                        <p className="text-[10px] font-black text-white uppercase tracking-[0.2em]">
                            Siz {myRankIndex + 1}. Sıradasınız! 🌟
                        </p>
                    </div>
                </div>

                <div className={`backdrop-blur-3xl border rounded-[2.5rem] p-5 shadow-[0_30px_60px_rgba(0,0,0,0.3)] flex items-center gap-4 transition-colors duration-500 ${settings.darkMode ? 'bg-[#1e1b4b]/95 border-indigo-400/20' : 'bg-white/95 border-sky-100'}`}>
                    <div className="relative shrink-0">
                        <div className={`w-16 h-16 rounded-full border-4 border-gold-400 overflow-hidden shadow-2xl ring-4 ${settings.darkMode ? 'bg-indigo-950 ring-gold-500/5' : 'bg-sky-50 ring-magic-500/5'}`}>
                            {userProfile.childPhoto ? (
                                <img src={userProfile.childPhoto} className="w-full h-full object-cover" alt="Me" />
                            ) : (
                                <div className="w-full h-full flex items-center justify-center text-3xl">
                                    {getDefaultEmoji(userProfile.gender)}
                                </div>
                            )}
                        </div>
                        <div className="absolute -top-1 -left-1 w-8 h-8 bg-gradient-to-br from-gold-400 to-orange-600 text-white rounded-full flex items-center justify-center text-[12px] font-black shadow-lg border-2 border-white">
                            {myRankIndex + 1}
                        </div>
                    </div>

                    <div className="flex-1 min-w-0">
                        <h4 className={`text-2xl font-black truncate leading-none mb-1 transition-colors ${settings.darkMode ? 'text-white' : 'text-magic-800'}`}>
                            {userProfile.childName}
                        </h4>
                        <p className="text-[10px] font-bold text-magic-400 uppercase tracking-[0.3em]">
                            Genç Kaşif
                        </p>
                    </div>

                    <div className={`text-right p-3 rounded-2xl border transition-colors ${settings.darkMode ? 'bg-white/5 border-white/5' : 'bg-sky-50 border-sky-100'}`}>
                        <div className="flex flex-col items-center">
                            <span className={`text-3xl font-black leading-none transition-colors ${settings.darkMode ? 'text-white' : 'text-magic-700'}`}>
                                {userProfile.storiesCount || 0}
                            </span>
                            <span className="text-[8px] font-black text-magic-400 uppercase tracking-widest mt-1">
                                Masal
                            </span>
                        </div>
                    </div>
                </div>
             </div>
          )}
      </div>

      <div className="absolute inset-0 pointer-events-none z-0 overflow-hidden">
          <div className="absolute top-1/4 left-1/4 w-1 h-1 bg-white rounded-full animate-ping opacity-20"></div>
          <div className={`absolute top-1/2 right-1/3 w-1.5 h-1.5 rounded-full animate-float opacity-10 ${settings.darkMode ? 'bg-magic-400' : 'bg-gold-500'}`}></div>
          <div className="absolute bottom-1/3 left-1/2 w-1 h-1 bg-gold-400 rounded-full animate-pulse opacity-20"></div>
      </div>
    </div>
  );
};
