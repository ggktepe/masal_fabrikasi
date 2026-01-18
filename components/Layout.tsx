
import React from 'react';
import { useApp } from '../context/AppContext';
import { BottomNav } from './BottomNav';

export const Layout: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { isSleepMode, userProfile, dismissSleepMode, settings } = useApp();

  return (
    <div className={`relative h-full w-full flex flex-col overflow-hidden transition-all duration-700 ${settings.darkMode ? 'dark bg-slate-950' : 'bg-sky-50'}`}>
      {/* Background Gradient Layer - Smooth fade between themes */}
      <div className={`fixed inset-0 z-0 transition-opacity duration-1000 ${settings.darkMode ? 'opacity-100 bg-gradient-to-br from-indigo-950 via-slate-950 to-purple-950' : 'opacity-100 bg-gradient-to-br from-sky-100 via-white to-magic-100'}`} />

      {/* Main Content Area with Safe Area Top Padding */}
      <main 
        className="flex-1 overflow-hidden relative z-10"
        style={{ paddingTop: 'env(safe-area-inset-top)' }}
      >
        <div className="h-full w-full relative">
          {children}
        </div>
      </main>

      {/* Navigation - Positioned at bottom with safe area padding inside */}
      {userProfile && <BottomNav />}

      {/* Sleep Mode Overlay - Immersive and Theme-Aware */}
      {isSleepMode && (
        <div className={`fixed inset-0 z-[100] backdrop-blur-3xl flex flex-col items-center justify-center text-center p-8 animate-fade-in transition-colors duration-500 ${settings.darkMode ? 'bg-magic-950/95 text-white' : 'bg-white/95 text-magic-950'}`}>
            {/* Pulsing Sleepy Emoji */}
            <div className="text-[12rem] mb-8 animate-float drop-shadow-[0_0_30px_rgba(0,0,0,0.1)]">
              😴
            </div>

            {/* Large Shh Text */}
            <h1 className={`text-6xl font-bold mb-6 tracking-tighter drop-shadow-sm ${settings.darkMode ? 'text-indigo-300' : 'text-magic-600'}`}>
              Şşşt...
            </h1>

            {/* Main Message - Significantly Larger */}
            <p className={`text-4xl md:text-5xl font-bold mb-8 leading-tight drop-shadow-lg px-4 ${settings.darkMode ? 'text-white' : 'text-magic-900'}`}>
              Artık uyku vakti, <span className="text-magic-500">{userProfile?.childName}</span>.
            </p>

            {/* Visual Divider */}
            <div className={`w-32 h-1.5 bg-gradient-to-r from-transparent via-magic-500 to-transparent rounded-full mb-8 opacity-60`}></div>
            
            {/* Sub Message - Now Darker in Light Mode for Visibility */}
            <p className={`text-xl md:text-2xl mb-12 italic max-w-sm font-bold leading-relaxed drop-shadow-sm transition-colors ${settings.darkMode ? 'text-indigo-200' : 'text-magic-700'}`}>
              Güzel rüyalar görmen için masal fabrikası da seninle birlikte dinleniyor. ✨
            </p>
            
            {/* Parent Unlock Button - More accessible but subtle */}
            <button 
                onClick={dismissSleepMode}
                className={`mt-auto mb-safe text-sm font-bold uppercase tracking-[0.2em] px-10 py-4 rounded-full transition-all active:scale-95 shadow-inner border-2 ${
                  settings.darkMode 
                  ? 'text-magic-400 border-magic-800/50 bg-magic-900/20 opacity-60 hover:opacity-100' 
                  : 'text-magic-600 border-magic-200 bg-magic-50 opacity-80 hover:opacity-100'
                }`}
            >
                EBEVEYN KİLİDİNİ AÇ 🔓
            </button>
        </div>
      )}
    </div>
  );
};
