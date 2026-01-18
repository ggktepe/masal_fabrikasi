
import React, { useState, useRef } from 'react';
import { useApp } from '../context/AppContext';
import { Gender, UserProfile } from '../types';
import { compressImage } from '../services/storageService';

interface Props {
  onSwitchToLogin: () => void;
}

export const Registration: React.FC<Props> = ({ onSwitchToLogin }) => {
  const { register, loginWithGoogle } = useApp();
  
  // Registration Form State
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [childName, setChildName] = useState('');
  const [birthDate, setBirthDate] = useState('');
  const [gender, setGender] = useState<Gender>(Gender.Boy);
  const [photo, setPhoto] = useState<string | undefined>(undefined);
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  // UI State
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handlePhotoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 10 * 1024 * 1024) {
        alert("Bu fotoğraf biraz fazla büyük (Maksimum 10MB olabilir). Lütfen daha küçük bir tane seçer misin? ✨");
        return;
      }

      setLoading(true);
      try {
        const reader = new FileReader();
        reader.onloadend = async () => {
          const base64 = reader.result as string;
          const compressedBlob = await compressImage(base64, 0.7);
          const compressedReader = new FileReader();
          compressedReader.onloadend = () => {
            setPhoto(compressedReader.result as string);
            setLoading(false);
          };
          compressedReader.readAsDataURL(compressedBlob);
        };
        reader.readAsDataURL(file);
      } catch (err) {
        console.error("Fotoğraf işlenirken hata:", err);
        setLoading(false);
      }
    }
  };

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!childName || !birthDate || !email || !password) return;

    setLoading(true);
    setError('');

    const profile: UserProfile = {
      name: email.split('@')[0], 
      email,
      password,
      childName,
      birthDate,
      gender,
      childPhoto: photo
    };
    
    const result = await register(profile);
    setLoading(false);
    
    if (result.error) {
        setError(result.error);
    }
  };

  const handleGoogleSignup = async () => {
      setError('');
      const result = await loginWithGoogle();
      if (result.error) setError(result.error);
  };

  return (
    <div className="flex flex-col items-center justify-center min-h-screen p-6 bg-gradient-to-br from-sky-200 via-white to-magic-200 overflow-y-auto">
      <div className="w-full max-w-md bg-white/80 backdrop-blur-xl p-8 rounded-3xl border border-white shadow-xl">
        <h1 className="text-3xl font-bold text-center mb-2 text-magic-600">Kayıt Ol 📝</h1>
        <p className="text-center text-magic-800 mb-8">Çocuğun için sihirli bir fabrika.</p>

        <form onSubmit={handleRegister} className="space-y-6">
          <div className="flex justify-center">
            <div 
              onClick={() => !loading && fileInputRef.current?.click()}
              className={`relative w-28 h-28 rounded-full bg-sky-100 border-4 border-white shadow-md flex items-center justify-center overflow-hidden cursor-pointer hover:border-magic-200 transition-colors ${loading ? 'opacity-50 cursor-wait' : ''}`}
            >
              {photo ? (
                <img src={photo} alt="Profil" className="w-full h-full object-cover" />
              ) : (
                <span className="text-4xl">{loading ? '⏳' : '📸'}</span>
              )}
              <input 
                ref={fileInputRef}
                type="file" 
                accept="image/*" 
                className="hidden" 
                onChange={handlePhotoUpload}
              />
              <div className="absolute bottom-0 w-full bg-black/30 text-white text-[10px] text-center py-1">
                {loading ? 'Küçültülüyor...' : 'Ekle'}
              </div>
            </div>
          </div>

          <div>
            <label className="block text-sm font-bold text-magic-800 mb-1">Ebeveyn E-postası</label>
            <input 
              type="email" 
              value={email}
              onChange={e => setEmail(e.target.value)}
              className="w-full bg-white border border-magic-200 rounded-xl p-3 text-magic-900 focus:outline-none focus:border-magic-500 focus:ring-2 focus:ring-magic-200"
              placeholder="ebeveyn@ornek.com"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-bold text-magic-800 mb-1">Şifre Oluştur</label>
            <input 
              type="password" 
              value={password}
              onChange={e => setPassword(e.target.value)}
              className="w-full bg-white border border-magic-200 rounded-xl p-3 text-magic-900 focus:outline-none focus:border-magic-500 focus:ring-2 focus:ring-magic-200"
              placeholder="••••••"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-bold text-magic-800 mb-1">Çocuğun Adı</label>
            <input 
              type="text" 
              value={childName}
              onChange={e => setChildName(e.target.value)}
              className="w-full bg-white border border-magic-200 rounded-xl p-3 text-magic-900 focus:outline-none focus:border-magic-500 focus:ring-2 focus:ring-magic-200"
              placeholder="ör. Can"
              required
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-bold text-magic-800 mb-1">Doğum Tarihi</label>
              <input 
                type="date" 
                value={birthDate}
                onChange={e => setBirthDate(e.target.value)}
                className="w-full bg-white border border-magic-200 rounded-xl p-3 text-magic-900 focus:outline-none focus:border-magic-500 focus:ring-2 focus:ring-magic-200"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-bold text-magic-800 mb-1">Cinsiyet</label>
              <select 
                value={gender}
                onChange={e => setGender(e.target.value as Gender)}
                className="w-full bg-white border border-magic-200 rounded-xl p-3 text-magic-900 focus:outline-none focus:border-magic-500 focus:ring-2 focus:ring-magic-200"
              >
                <option value={Gender.Boy}>Erkek</option>
                <option value={Gender.Girl}>Kız</option>
              </select>
            </div>
          </div>

          {error && <p className="text-red-500 text-sm text-center bg-red-50 p-2 rounded">{error}</p>}

          <button 
            type="submit"
            disabled={loading}
            className="w-full bg-gradient-to-r from-magic-500 to-sky-500 hover:from-magic-600 hover:to-sky-600 text-white font-bold py-4 rounded-xl shadow-lg transform active:scale-95 transition-all text-lg disabled:opacity-50"
          >
            {loading ? 'Lütfen Bekle... 📨' : 'Kayıt Ol ve Başla 🚀'}
          </button>
        </form>

        <div className="flex items-center gap-4 my-6">
            <div className="h-px bg-gray-300 flex-1"></div>
            <span className="text-gray-400 text-sm">veya</span>
            <div className="h-px bg-gray-300 flex-1"></div>
        </div>

        <button 
            type="button"
            onClick={handleGoogleSignup}
            className="w-full bg-white border border-gray-200 text-gray-700 font-bold py-3 rounded-xl shadow-sm hover:bg-gray-50 hover:shadow-md transition-all flex items-center justify-center gap-3"
        >
            <img src="https://www.svgrepo.com/show/475656/google-color.svg" className="w-6 h-6" alt="Google" />
            Google ile Devam Et
        </button>

        <div className="mt-6 text-center">
            <p className="text-magic-800 text-sm">Zaten hesabın var mı?</p>
            <button 
                onClick={onSwitchToLogin}
                className="text-magic-600 font-bold hover:underline mt-1"
            >
                Giriş Yap
            </button>
        </div>
      </div>
    </div>
  );
};
