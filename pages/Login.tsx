
import React, { useState } from 'react';
import { useApp } from '../context/AppContext';

interface Props {
  onSwitchToRegister: () => void;
}

export const Login: React.FC<Props> = ({ onSwitchToRegister }) => {
  const { login, loginWithGoogle } = useApp();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    
    const result = await login(email, password);
    
    if (result.error) {
        let errorMessage = result.error;
        if (errorMessage.includes('Invalid login credentials')) {
            errorMessage = "Hatalı e-posta veya şifre girdiniz. ❌";
        } else if (errorMessage.includes('Email not confirmed')) {
            errorMessage = "E-posta adresiniz henüz doğrulanmamış. 📧";
        } else if (errorMessage.toLowerCase().includes('network')) {
            errorMessage = "Bağlantı hatası oluştu. Lütfen internetini kontrol et. 🌐";
        } else {
            errorMessage = "Giriş yapılırken bir hata oluştu. Lütfen tekrar dene. ✨";
        }
        setError(errorMessage);
        setLoading(false);
    }
  };

  const handleGoogleLogin = async () => {
      setError('');
      const result = await loginWithGoogle();
      if (result.error) {
          let msg = result.error;
          if (msg.includes('popup_closed_by_user')) msg = "Giriş penceresi kapatıldı.";
          setError(msg);
      }
  };

  return (
    <div className="flex flex-col items-center min-h-screen p-6 bg-gradient-to-br from-sky-200 via-white to-magic-200 overflow-y-auto">
      <div className="w-full max-w-md bg-white/90 backdrop-blur-2xl p-8 my-8 rounded-[2.5rem] border-4 border-white shadow-2xl animate-fade-in relative overflow-visible text-center">
        {/* Decorative Background Elements */}
        <div className="absolute -top-10 -right-10 w-32 h-32 bg-gold-200/20 rounded-full blur-3xl pointer-events-none"></div>
        <div className="absolute -bottom-10 -left-10 w-32 h-32 bg-magic-200/20 rounded-full blur-3xl pointer-events-none"></div>

        <div className="text-center mb-8 relative z-10">
            <div className="relative inline-block mb-2">
              <div className="absolute inset-0 bg-gradient-to-tr from-gold-400/30 to-magic-400/30 rounded-full blur-3xl animate-pulse"></div>
              <img 
                src="https://qwmvqpbnxqxaoskieyyw.supabase.co/storage/v1/object/public/images/icon.png" 
                alt="Masal Fabrikası" 
                className="w-48 h-48 object-contain mx-auto relative z-10 animate-float drop-shadow-[0_10px_15px_rgba(0,0,0,0.1)]"
                onError={(e) => {
                  (e.target as HTMLImageElement).src = "icon.png";
                }}
              />
            </div>
            <h1 className="text-4xl font-black text-magic-700 tracking-tighter mb-1 mt-2">Masal Fabrikası</h1>
            <div className="flex items-center justify-center gap-2">
                <span className="h-px w-6 bg-gold-400"></span>
                <p className="text-gold-600 font-bold uppercase tracking-[0.2em] text-[10px]">Hayallerini İnşa Et</p>
                <span className="h-px w-6 bg-gold-400"></span>
            </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4 relative z-10 text-left">
          <div className="space-y-1">
            <label className="block text-xs font-bold text-magic-800 uppercase ml-2 tracking-widest">E-posta</label>
            <input 
              type="email" 
              value={email}
              onChange={e => setEmail(e.target.value)}
              className="w-full bg-white/50 border-2 border-magic-50 rounded-2xl p-4 text-magic-900 focus:outline-none focus:border-gold-400 focus:ring-4 focus:ring-gold-50 transition-all placeholder:text-magic-200 font-medium"
              placeholder="ebeveyn@ornek.com"
              required
            />
          </div>

          <div className="space-y-1">
            <label className="block text-xs font-bold text-magic-800 uppercase ml-2 tracking-widest">Şifre</label>
            <div className="relative">
              <input 
                type={showPassword ? "text" : "password"} 
                value={password}
                onChange={e => setPassword(e.target.value)}
                className="w-full bg-white/50 border-2 border-magic-50 rounded-2xl p-4 pr-14 text-magic-900 focus:outline-none focus:border-gold-400 focus:ring-4 focus:ring-gold-50 transition-all placeholder:text-magic-200 font-medium"
                placeholder="••••••"
                required
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-4 top-1/2 transform -translate-y-1/2 text-2xl opacity-40 hover:opacity-100 transition-opacity focus:outline-none"
              >
                {showPassword ? '🙈' : '👁️'}
              </button>
            </div>
          </div>

          {error && (
            <div className="bg-red-50 border-2 border-red-100 text-red-600 text-sm font-bold p-4 rounded-2xl text-center animate-shake">
              {error}
            </div>
          )}

          <button 
            type="submit"
            disabled={loading}
            className="w-full bg-gradient-to-r from-gold-500 via-orange-500 to-magic-500 hover:from-gold-600 hover:via-orange-600 hover:to-magic-600 text-white font-black py-5 rounded-[1.5rem] shadow-xl transform active:scale-95 transition-all text-xl disabled:opacity-50 mt-2"
          >
            {loading ? 'Sihir Hazırlanıyor...' : 'Giriş Yap'}
          </button>
        </form>
        
        <div className="flex items-center gap-4 my-6 relative z-10">
            <div className="h-[2px] bg-magic-50 flex-1"></div>
            <span className="text-magic-300 text-xs font-bold uppercase tracking-widest">veya</span>
            <div className="h-[2px] bg-magic-50 flex-1"></div>
        </div>

        <button 
            type="button"
            onClick={handleGoogleLogin}
            className="w-full bg-gradient-to-r from-gold-500 via-orange-500 to-magic-500 hover:from-gold-600 hover:via-orange-600 hover:to-magic-600 text-white font-black py-4 rounded-[1.5rem] shadow-xl transform active:scale-95 transition-all flex items-center justify-center gap-3 relative z-10 mb-6"
        >
            <div className="bg-white p-1 rounded-full shadow-sm">
                <img src="https://www.svgrepo.com/show/475656/google-color.svg" className="w-5 h-5" alt="Google" />
            </div>
            Google ile Giriş Yap
        </button>

        <div className="mt-4 text-center relative z-10 pb-4">
            <p className="text-magic-400 text-sm font-medium">Hesabın yok mu?</p>
            <button 
                onClick={onSwitchToRegister}
                className="text-gold-600 font-black text-lg hover:text-gold-700 mt-1 transition-colors"
            >
                Hemen Ücretsiz Kayıt Ol
            </button>
        </div>
      </div>
      <div className="h-10 w-full shrink-0"></div>
    </div>
  );
};
