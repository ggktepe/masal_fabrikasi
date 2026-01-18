
import React from 'react';
import { useApp } from '../context/AppContext';

export const BottomNav: React.FC = () => {
  const { currentTab, setCurrentTab, settings } = useApp();

  const navItems = [
    { id: 'home', label: 'Ana Sayfa', icon: '🏠' },
    { id: 'library', label: 'Kütüphane', icon: '📚' },
    { id: 'create', label: 'Oluştur', icon: '✨' },
    { id: 'leaderboard', label: 'Yıldızlar', icon: '🏆' },
    { id: 'settings', label: 'Ayarlar', icon: '⚙️' },
  ];

  return (
    <nav className="fixed bottom-0 left-0 right-0 bg-white/90 dark:bg-slate-950/90 backdrop-blur-lg border-t border-sky-100 dark:border-slate-800 z-50 shadow-[0_-4px_20px_rgba(0,0,0,0.05)] transition-colors">
      {/* Safe Area Padding for Mobile Notches */}
      <div 
        className="flex justify-around items-end max-w-lg mx-auto h-20 px-2"
        style={{ paddingBottom: 'calc(env(safe-area-inset-bottom) + 8px)' }}
      >
        {navItems.map((item) => {
            const isActive = currentTab === item.id;
            return (
                <button
                key={item.id}
                onClick={() => {
                  if ('vibrate' in navigator) navigator.vibrate(10);
                  setCurrentTab(item.id);
                }}
                className="flex flex-col items-center justify-center flex-1 py-1 group outline-none"
                >
                <div className="relative mb-1">
                    {/* Flutter Material 3 Pill Indicator */}
                    <div className={`absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-16 h-8 rounded-full transition-all duration-300 ease-out ${
                        isActive ? (settings.darkMode ? 'bg-indigo-900/50 scale-100' : 'bg-magic-100 scale-100') : 'bg-transparent opacity-0 scale-50'
                    }`} />
                    
                    <div className={`relative text-2xl transition-all duration-300 ${
                        isActive ? (settings.darkMode ? 'text-indigo-400 scale-110' : 'text-magic-600 scale-110') : (settings.darkMode ? 'text-slate-600 grayscale opacity-40' : 'text-magic-300 grayscale opacity-60')
                    }`}>
                        {item.icon}
                    </div>
                </div>
                <span className={`text-[10px] font-bold tracking-tight transition-colors duration-300 ${
                    isActive ? (settings.darkMode ? 'text-indigo-400' : 'text-magic-600') : (settings.darkMode ? 'text-slate-600' : 'text-magic-300')
                }`}>
                    {item.label}
                </span>
                </button>
            );
        })}
      </div>
    </nav>
  );
};
