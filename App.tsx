
import React, { useState } from 'react';
import { AppProvider, useApp } from './context/AppContext';
import { Layout } from './components/Layout';
import { Registration } from './pages/Registration';
import { Login } from './pages/Login';
import { CreateStory } from './pages/CreateStory';
import { Library } from './pages/Library';
import { Settings } from './pages/Settings';
import { Leaderboard } from './pages/Leaderboard';
import { StoryReader } from './pages/StoryReader';
import { Story, Gender } from './types';

const OnboardingModal: React.FC = () => {
    const { userProfile, updateUserProfile, completeOnboarding } = useApp();
    const [onboardingStep, setOnboardingStep] = useState(1); // 1: Welcome, 2: Profile, 3: Interests
    const [selectedInterests, setSelectedInterests] = useState<string[]>([]);
    
    const interests = [
        { id: 'space', name: 'Uzay', emoji: '🚀' },
        { id: 'animals', name: 'Hayvanlar', emoji: '🦁' },
        { id: 'nature', name: 'Doğa', emoji: '🌲' },
        { id: 'tech', name: 'Robotlar', emoji: '🤖' },
        { id: 'magic', name: 'Sihir', emoji: '✨' },
        { id: 'sports', name: 'Spor', emoji: '⚽' },
    ];

    const toggleInterest = (id: string) => {
        setSelectedInterests(prev => 
            prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]
        );
    };

    const renderStep = () => {
        switch(onboardingStep) {
            case 1:
                return (
                    <div className="animate-fade-in flex flex-col items-center">
                        <div className="text-8xl mb-6 animate-float">✨</div>
                        <h2 className="text-4xl font-black text-white mb-4 tracking-tight">Sihirli Fabrikaya Hoş Geldin!</h2>
                        <p className="text-magic-200 text-lg font-medium mb-10 leading-relaxed max-w-sm">
                            Burada her çocuk kendi masalının kahramanı olur. Maceraya başlamadan önce seni biraz tanıyalım mı?
                        </p>
                        <button 
                            onClick={() => setOnboardingStep(2)}
                            className="w-full bg-white text-magic-600 font-black py-5 rounded-2xl shadow-2xl transform active:scale-95 transition-all text-xl"
                        >
                            Hadi Tanışalım! 😊
                        </button>
                    </div>
                );
            case 2:
                return (
                    <div className="animate-fade-in w-full max-w-sm">
                        <div className="text-5xl mb-6 animate-bounce">🖋️</div>
                        <h2 className="text-2xl font-black text-white mb-6">Profilini Oluşturalım</h2>
                        
                        <div className="space-y-6 text-left relative">
                            {/* Visual Guidance Arrows for UX */}
                            <div className="absolute -left-8 top-8 text-magic-400 animate-pulse hidden md:block">➡️</div>
                            
                            <div className="bg-white/10 backdrop-blur-md p-6 rounded-3xl border border-white/20 relative">
                                <div className="space-y-4">
                                    <div>
                                        <label className="text-[10px] font-black text-magic-300 uppercase tracking-widest block mb-1">Kahraman Adı</label>
                                        <div className="flex items-center gap-2">
                                            <input 
                                                type="text" 
                                                value={userProfile?.childName || ''} 
                                                onChange={(e) => updateUserProfile({ childName: e.target.value })}
                                                placeholder="İsmin nedir?"
                                                className="w-full bg-white/10 border-none p-0 text-xl font-bold text-white focus:ring-0 placeholder:text-white/20"
                                            />
                                            <span className="text-xl">✍️</span>
                                        </div>
                                    </div>
                                    <div className="h-px bg-white/10"></div>
                                    <div className="flex gap-4">
                                        <div className="flex-1">
                                            <label className="text-[10px] font-black text-magic-300 uppercase tracking-widest block mb-1">Doğum Günü</label>
                                            <input 
                                                type="date" 
                                                value={userProfile?.birthDate || ''} 
                                                onChange={(e) => updateUserProfile({ birthDate: e.target.value })}
                                                className="w-full bg-transparent border-none p-0 text-sm font-bold text-white focus:ring-0"
                                            />
                                        </div>
                                        <div className="flex-1">
                                            <label className="text-[10px] font-black text-magic-300 uppercase tracking-widest block mb-1">Cinsiyet</label>
                                            <select 
                                                value={userProfile?.gender} 
                                                onChange={(e) => updateUserProfile({ gender: e.target.value as Gender })}
                                                className="w-full bg-transparent border-none p-0 text-sm font-bold text-white focus:ring-0"
                                            >
                                                <option value={Gender.Boy} className="text-black">Erkek 👦</option>
                                                <option value={Gender.Girl} className="text-black">Kız 👧</option>
                                            </select>
                                        </div>
                                    </div>
                                </div>
                            </div>
                            
                            <p className="text-magic-300 text-xs font-bold italic text-center px-4 leading-relaxed">
                                "Seni daha iyi tanımam, masalları tamamen sana özel ve eğlenceli hale getirmemi sağlar! ✨"
                            </p>
                        </div>

                        <button 
                            onClick={() => setOnboardingStep(3)}
                            className="w-full bg-gradient-to-r from-sky-400 to-magic-500 text-white font-black py-5 rounded-2xl shadow-2xl transform active:scale-95 transition-all text-xl mt-8"
                        >
                            Harika! Devam Et 🚀
                        </button>
                    </div>
                );
            case 3:
                return (
                    <div className="animate-fade-in w-full max-w-sm">
                        <div className="text-5xl mb-6 animate-float">🍭</div>
                        <h2 className="text-2xl font-black text-white mb-2">Nelerden Hoşlanırsın?</h2>
                        <p className="text-magic-200 text-sm font-medium mb-8">Sana özel temalar hazırlamam için birkaç tane seçebilirsin!</p>

                        <div className="grid grid-cols-2 gap-3 mb-10">
                            {interests.map(item => (
                                <button
                                    key={item.id}
                                    onClick={() => toggleInterest(item.id)}
                                    className={`p-4 rounded-2xl border-2 transition-all flex flex-col items-center gap-2 group active:scale-95 ${
                                        selectedInterests.includes(item.id)
                                        ? 'bg-white border-gold-400 shadow-[0_0_20px_rgba(251,191,36,0.3)]'
                                        : 'bg-white/5 border-white/10 hover:bg-white/10'
                                    }`}
                                >
                                    <span className={`text-3xl transition-transform ${selectedInterests.includes(item.id) ? 'scale-110' : 'grayscale opacity-60'}`}>
                                        {item.emoji}
                                    </span>
                                    <span className={`text-[10px] font-black uppercase tracking-widest ${selectedInterests.includes(item.id) ? 'text-magic-900' : 'text-white/40'}`}>
                                        {item.name}
                                    </span>
                                </button>
                            ))}
                        </div>

                        <button 
                            onClick={completeOnboarding}
                            className="w-full bg-gradient-to-r from-gold-400 via-orange-400 to-pink-500 text-white font-black py-5 rounded-2xl shadow-2xl transform active:scale-95 transition-all text-xl"
                        >
                            Maceraya Başla! 🌈
                        </button>
                    </div>
                );
        }
    };

    return (
        <div className="fixed inset-0 z-[200] bg-magic-950/95 backdrop-blur-3xl flex flex-col items-center justify-center p-8 animate-fade-in text-center overflow-y-auto">
            <div className="absolute top-0 left-0 w-full h-full pointer-events-none overflow-hidden opacity-20">
                <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-magic-400 rounded-full blur-[120px] animate-pulse"></div>
                <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-sky-400 rounded-full blur-[120px] animate-pulse" style={{animationDelay: '1s'}}></div>
            </div>

            <div className="relative z-10 w-full flex flex-col items-center">
                {renderStep()}
                
                {onboardingStep > 1 && (
                    <button 
                        onClick={() => setOnboardingStep(onboardingStep - 1)}
                        className="mt-6 text-white/40 font-bold uppercase tracking-widest text-[10px] hover:text-white"
                    >
                        ⬅️ Geri Dön
                    </button>
                )}
            </div>
        </div>
    );
};

const HomeView: React.FC<{ 
    userProfile: any, 
    setCurrentTab: (tab: string) => void, 
    stories: Story[],
    onStoryClick: (story: Story) => void
}> = ({ userProfile, setCurrentTab, stories, onStoryClick }) => {

    const getDefaultEmoji = () => {
        if (userProfile.gender === Gender.Boy) return '👦';
        if (userProfile.gender === Gender.Girl) return '👧';
        return '🐣';
    };

    return (
        <div className="flex flex-col h-full pt-6 pb-24 px-6 overflow-hidden">
            <div className="flex flex-col items-center text-center shrink-0 mb-6">
                <div 
                    onClick={() => setCurrentTab('settings')}
                    className="w-24 h-24 rounded-full overflow-hidden border-4 border-white dark:border-slate-800 shadow-xl mb-3 bg-sky-100 dark:bg-slate-800 cursor-pointer hover:scale-105 transition-transform relative group active:scale-95"
                >
                    {userProfile.childPhoto ? (
                        <img src={userProfile.childPhoto} className="w-full h-full object-cover" alt="Profile" />
                    ) : (
                        <span className="flex items-center justify-center h-full text-5xl">{getDefaultEmoji()}</span>
                    )}
                </div>
                <h1 className="text-2xl font-bold mb-0.5 text-magic-900 dark:text-white tracking-tight">Merhaba, {userProfile.childName}!</h1>
                <p className="text-magic-500 dark:text-magic-400 font-medium text-sm">Yeni bir maceraya hazır mısın?</p>
            </div>
            
            <div className="shrink-0 mb-8">
                <button 
                    onClick={() => setCurrentTab('create')}
                    className="w-full bg-gradient-to-r from-magic-500 to-sky-500 dark:from-magic-700 dark:to-indigo-800 p-5 rounded-2xl shadow-lg flex items-center justify-center gap-4 active:scale-95 transition-all text-white group"
                >
                    <div className="bg-white/20 p-2 rounded-xl backdrop-blur-md">
                      <span className="text-3xl filter drop-shadow group-hover:animate-bounce">✨</span>
                    </div>
                    <div className="text-left">
                        <span className="block text-xl font-bold">Masal Oluştur</span>
                        <span className="text-[10px] text-white/80 font-bold uppercase tracking-wider">Kendi dünyanı yarat</span>
                    </div>
                </button>
            </div>

            <div className="flex-1 flex flex-col min-h-0">
                <div className="flex items-center justify-between mb-4 px-1">
                    <h3 className="text-lg font-bold text-magic-800 dark:text-slate-200">Son 3 Maceran 📜</h3>
                    {stories.length > 0 && (
                        <button onClick={() => setCurrentTab('library')} className="text-xs text-magic-500 dark:text-magic-400 font-bold uppercase tracking-widest hover:text-magic-600 active:opacity-50">
                            Tümü
                        </button>
                    )}
                </div>

                <div className="flex-1 overflow-y-auto no-scrollbar space-y-3 pb-8">
                    {stories.length === 0 ? (
                        <div className="bg-white/40 dark:bg-slate-900/40 border border-dashed border-magic-200 dark:border-slate-800 rounded-2xl p-8 text-center text-magic-400">
                            <div className="text-5xl mb-3 opacity-30 grayscale">🧚‍♀️</div>
                            <p className="font-bold text-magic-500/50 dark:text-slate-600">Henüz hiç masalın yok.</p>
                            <p className="text-xs mt-1">Sihirli butona bas ve başla!</p>
                        </div>
                    ) : (
                        stories.slice(0, 3).map(story => (
                            <div 
                                key={story.id} 
                                onClick={() => story.isComplete && onStoryClick(story)}
                                className={`bg-white/70 dark:bg-slate-900/60 backdrop-blur-sm p-3 rounded-2xl border border-sky-50 dark:border-slate-800 shadow-sm flex gap-3 items-center cursor-pointer active:bg-sky-100 dark:active:bg-slate-800 transition-all transform active:scale-[0.98] ${!story.isComplete ? 'opacity-50' : ''}`}
                            >
                                <div className="w-14 h-14 bg-gray-100 dark:bg-slate-800 rounded-xl overflow-hidden shrink-0 border border-white dark:border-slate-700 shadow-sm">
                                    {story.coverImage ? (
                                        <img src={story.coverImage} className="w-full h-full object-cover" alt="Cover" />
                                    ) : (
                                        <span className="text-xl flex items-center justify-center h-full">📖</span>
                                    )}
                                </div>
                                <div className="min-w-0 flex-1 text-left">
                                    <h4 className="font-bold text-magic-900 dark:text-slate-100 truncate leading-tight">{story.title}</h4>
                                    <div className="flex items-center gap-2 text-[10px] font-bold text-magic-300 dark:text-slate-500 mt-1 uppercase tracking-tighter">
                                        <span>📅 {new Date(story.createdAt).toLocaleDateString()}</span>
                                        <span className="opacity-30">•</span>
                                        <span className="truncate">{story.isComplete ? story.params.location : 'Yarım Kaldı'}</span>
                                    </div>
                                </div>
                                <div className="text-magic-200 dark:text-slate-600 pr-1 text-sm">
                                    {story.isComplete ? '▶️' : '⏳'}
                                </div>
                            </div>
                        ))
                    )}
                </div>
            </div>
        </div>
    );
};

const AppContent: React.FC = () => {
  const { userProfile, currentTab, setCurrentTab, isLoading, isFirstLogin, stories, readingStory, openStory, closeStory, resumingStory } = useApp();
  const [showRegister, setShowRegister] = useState(false);

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen bg-sky-50 dark:bg-slate-950 overflow-hidden text-center p-6">
        <div className="relative mb-8">
           <img 
            src="https://qwmvqpbnxqxaoskieyyw.supabase.co/storage/v1/object/public/images/icon.png" 
            alt="Logo" 
            className="w-56 h-56 object-contain drop-shadow-2xl animate-float filter animate-glow"
            onError={(e) => {
              (e.target as HTMLImageElement).src = "icon.png";
            }}
           />
           <div className="absolute -bottom-8 left-1/2 -translate-x-1/2 w-32 h-4 bg-black/10 dark:bg-white/5 rounded-[100%] blur-xl animate-pulse"></div>
        </div>
        <h1 className="text-4xl font-black text-magic-600 tracking-tighter animate-pulse">Masal Fabrikası</h1>
        <div className="mt-10 flex items-center justify-center gap-3">
           <div className="w-3 h-3 bg-gold-400 rounded-full animate-bounce" style={{animationDelay: '0ms'}}></div>
           <div className="w-3 h-3 bg-magic-400 rounded-full animate-bounce" style={{animationDelay: '200ms'}}></div>
           <div className="w-3 h-3 bg-sky-400 rounded-full animate-bounce" style={{animationDelay: '400ms'}}></div>
        </div>
      </div>
    );
  }

  if (!userProfile) {
    if (showRegister) {
      return <Registration onSwitchToLogin={() => setShowRegister(false)} />;
    }
    return <Login onSwitchToRegister={() => setShowRegister(true)} />;
  }

  if (isFirstLogin) {
    return <OnboardingModal />;
  }

  if (readingStory) {
    return <StoryReader story={readingStory} onClose={closeStory} />;
  }

  const renderTab = () => {
    switch (currentTab) {
      case 'home': return <HomeView userProfile={userProfile} setCurrentTab={setCurrentTab} stories={stories} onStoryClick={openStory} />;
      case 'library': return <Library />;
      case 'create': return <CreateStory resumeStory={resumingStory} />;
      case 'settings': return <Settings />;
      case 'leaderboard': return <Leaderboard />;
      default: return null;
    }
  };

  return (
    <Layout>
        <div key={currentTab} className="h-full w-full animate-fade-in">
           {renderTab()}
        </div>
    </Layout>
  );
};

const App: React.FC = () => {
  return (
    <AppProvider>
      <AppContent />
    </AppProvider>
  );
};

export default App;
