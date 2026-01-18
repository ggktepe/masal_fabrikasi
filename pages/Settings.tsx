
import React, { useRef, useState, useEffect } from 'react';
import { useApp } from '../context/AppContext';
import { Gender } from '../types';
import { compressImage } from '../services/storageService';

const PolicyModal: React.FC<{ isOpen: boolean; title: string; content: React.ReactNode; onClose: () => void }> = ({ isOpen, title, content, onClose }) => {
  if (!isOpen) return null;
  return (
    <div className="fixed inset-0 z-[100] flex flex-col bg-white dark:bg-slate-950 animate-fade-in">
      <div className="flex items-center justify-between p-4 border-b border-sky-100 dark:border-slate-800 shrink-0">
        <h3 className="text-xl font-bold text-magic-600 dark:text-magic-400">{title}</h3>
        <button onClick={onClose} className="p-2 text-magic-400 hover:text-magic-600 text-xl font-bold">✖️</button>
      </div>
      <div className="flex-1 overflow-y-auto p-6 no-scrollbar">
        <div className="text-magic-900 dark:text-slate-200 space-y-6 font-medium leading-relaxed pb-32">
          {content}
        </div>
      </div>
    </div>
  );
};

export const Settings: React.FC = () => {
  const { userProfile, updateUserProfile, settings, updateSettings, logout } = useApp();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [localName, setLocalName] = useState(userProfile?.childName || '');
  const [isSaving, setIsSaving] = useState(false);
  const [isPhotoUploading, setIsPhotoUploading] = useState(false);
  
  const [modalType, setModalType] = useState<'privacy' | 'terms' | null>(null);

  useEffect(() => {
    if (userProfile?.childName) {
      setLocalName(userProfile.childName);
    }
  }, [userProfile?.childName]);

  const handlePhotoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (file && userProfile?.id) {
        if (file.size > 10 * 1024 * 1024) {
          alert("Bu fotoğraf biraz fazla büyük (Maksimum 10MB olabilir). Lütfen daha küçük bir tane seçer misin? ✨");
          return;
        }

        setIsPhotoUploading(true);
        try {
          const reader = new FileReader();
          reader.onloadend = async () => {
            const base64 = reader.result as string;
            const compressedBlob = await compressImage(base64, 0.7);
            const compressedReader = new FileReader();
            compressedReader.onloadend = async () => {
              const compressedBase64 = compressedReader.result as string;
              await updateUserProfile({ childPhoto: compressedBase64 });
              setIsPhotoUploading(false);
            };
            compressedReader.readAsDataURL(compressedBlob);
          };
          reader.readAsDataURL(file);
        } catch (err) {
          console.error("Fotoğraf güncellenirken hata:", err);
          alert("Fotoğraf işlenirken bir sorun oluştu.");
          setIsPhotoUploading(false);
        }
      }
    };

  const handleNameBlur = async () => {
    if (localName.trim() && localName !== userProfile?.childName) {
      setIsSaving(true);
      await updateUserProfile({ childName: localName.trim() });
      setIsSaving(false);
    }
  };

  const getDefaultEmoji = () => {
    if (!userProfile) return '🐣';
    if (userProfile.gender === Gender.Boy) return '👦';
    if (userProfile.gender === Gender.Girl) return '👧';
    return '🐣';
  };

  const privacyContent = (
    <div className="space-y-6">
      <p className="text-xs text-magic-400 font-bold uppercase tracking-widest">Son Güncelleme: 15 Ocak 2026</p>
      <p>Masal Fabrikası ("biz", "bizim" veya "Uygulama") olarak, gizliliğinize önem veriyoruz. Bu Gizlilik Politikası, web sitemizi ve hizmetlerimizi kullandığınızda kişisel verilerinizin nasıl toplandığını, kullanıldığını ve korunduğunu açıklar.</p>
      
      <section>
        <h4 className="text-lg font-bold text-magic-600 mb-2">1. Toplanan Bilgiler</h4>
        <p>Hizmetlerimizi sağlamak için aşağıdaki bilgileri toplayabiliriz:</p>
        <ul className="list-disc ml-5 space-y-1 mt-2">
          <li><strong>Hesap Bilgileri:</strong> Kayıt olurken kullandığınız e-posta adresi ve kullanıcı kimliği.</li>
          <li><strong>Kullanım Verileri:</strong> Oluşturduğunuz masal içerikleri, girdiğiniz komutlar (promptlar) ve tercih ettiğiniz karakter isimleri.</li>
          <li><strong>Ödeme Bilgileri:</strong> Ödeme işlemleri <strong>Lemon Squeezy</strong> tarafından yürütülmektedir. Biz kredi kartı bilgilerinizi <strong>saklamayız</strong>. Sadece işlemin başarılı olduğuna dair verileri ve sipariş geçmişini tutarız.</li>
        </ul>
      </section>

      <section>
        <h4 className="text-lg font-bold text-magic-600 mb-2">2. Bilgilerin Kullanımı</h4>
        <p>Topladığımız bilgileri şu amaçlarla kullanırız:</p>
        <ul className="list-disc ml-5 space-y-1 mt-2">
          <li>Size kişiselleştirilmiş masal oluşturma hizmeti sunmak.</li>
          <li>Hesabınızı yönetmek ve kredi bakiyenizi güncellemek.</li>
          <li>Hizmet kalitesini artırmak ve teknik sorunları gidermek.</li>
          <li>Yasal yükümlülükleri yerine getirmek.</li>
        </ul>
      </section>

      <section>
        <h4 className="text-lg font-bold text-magic-600 mb-2">3. Veri Paylaşımı ve Üçüncü Taraflar</h4>
        <p>Kişisel verilerinizi üçüncü taraflara satmayız. Ancak hizmeti sağlayabilmek için güvenilir altyapı sağlayıcıları ile çalışırız:</p>
        <ul className="list-disc ml-5 space-y-1 mt-2">
          <li><strong>Supabase:</strong> Veritabanı ve üyelik yönetimi için.</li>
          <li><strong>Lemon Squeezy:</strong> Ödeme işlemlerinin güvenli bir şekilde gerçekleştirilmesi ve vergilendirme (Merchant of Record) için.</li>
          <li><strong>Yapay Zeka Sağlayıcıları:</strong> Masalları oluşturmak için metin girdileriniz (promptlar) anonimleştirilmiş olarak AI servis sağlayıcılarına iletilebilir.</li>
        </ul>
      </section>

      <section>
        <h4 className="text-lg font-bold text-magic-600 mb-2">4. Çocukların Gizliliği</h4>
        <p>Masal Fabrikası, ebeveynlerin çocukları için içerik üretmesi amacıyla tasarlanmıştır. 18 yaşın altındaki bireylerin uygulamayı ebeveyn gözetimi olmadan kullanması ve ödeme yapması yasaktır. Bilerek 13 yaşın altındaki çocuklardan kişisel veri toplamıyoruz.</p>
      </section>

      <section className="bg-sky-50 dark:bg-slate-900 p-5 rounded-2xl border border-sky-100 dark:border-slate-800 shadow-sm">
        <h4 className="text-lg font-bold text-magic-600 mb-2">5. İletişim</h4>
        <p>Bu politika hakkında sorularınız varsa bizimle iletişime geçebilirsiniz:</p>
        <a 
          href="mailto:masalfabrikasiapp@gmail.com" 
          className="inline-block font-bold text-magic-500 hover:text-magic-600 mt-2 text-lg break-all"
        >
          📧 masalfabrikasiapp@gmail.com
        </a>
      </section>
    </div>
  );

  const termsContent = (
    <div className="space-y-6">
      <p className="text-xs text-magic-400 font-bold uppercase tracking-widest">Son Güncelleme: 15 Ocak 2026</p>
      <p>Lütfen Masal Fabrikası'nı kullanmadan önce bu koşulları dikkatlice okuyun. Hizmetlerimizi kullanarak bu koşulları kabul etmiş sayılırsınız.</p>

      <section>
        <h4 className="text-lg font-bold text-magic-600 mb-2">1. Hizmetin Tanımı</h4>
        <p>Masal Fabrikası, yapay zeka teknolojisi kullanarak kullanıcıların girdilerine dayalı kişiselleştirilmiş hikayeler/masallar üreten bir dijital platformdur.</p>
      </section>

      <section>
        <h4 className="text-lg font-bold text-magic-600 mb-2">2. Krediler ve Ödemeler</h4>
        <ul className="list-disc ml-5 space-y-1 mt-2">
          <li>Uygulama içerisindeki hizmetler "Kredi" sistemi ile çalışır.</li>
          <li>Kredi paketlerinin satışı ve ödeme işlemleri yetkili satıcımız <strong>Lemon Squeezy</strong> tarafından yürütülmektedir.</li>
          <li>Satın alınan krediler dijital bir değerdir, gerçek paraya çevrilemez ve devredilemez.</li>
          <li><strong>İade Politikası:</strong> Dijital içeriklerin doğası gereği, kullanılmış kredilerin iadesi yapılmamaktadır. Kullanılmamış krediler için iade talepleri, Lemon Squeezy'nin iade politikalarına ve takdirine bağlıdır.</li>
        </ul>
      </section>

      <section>
        <h4 className="text-lg font-bold text-magic-600 mb-2">3. Kullanıcı Sorumlulukları</h4>
        <ul className="list-disc ml-5 space-y-1 mt-2">
          <li>Platformu yasalara aykırı, zararlı veya kötü niyetli içerik üretmek için kullanamazsınız.</li>
          <li>Hesap güvenliğinizden siz sorumlusunuz.</li>
          <li>Üretilen içeriklerin yapay zeka tarafından oluşturulduğunu ve kurgusal olduğunu kabul edersiniz.</li>
        </ul>
      </section>

      <section>
        <h4 className="text-lg font-bold text-magic-600 mb-2">4. Fikri Mülkiyet</h4>
        <p>Uygulamanın tasarımı, logosu ve kaynak kodları Masal Fabrikası'na aittir. Kullanıcılar, oluşturdukları masalları kişisel amaçlarla kullanabilirler.</p>
      </section>

      <section>
        <h4 className="text-lg font-bold text-magic-600 mb-2">5. Değişiklikler</h4>
        <p>Bu koşulları zaman zaman güncelleyebiliriz. Değişiklikler web sitesinde yayınlandığı tarihte yürürlüğe girer.</p>
      </section>

      <section className="bg-sky-50 dark:bg-slate-900 p-5 rounded-2xl border border-sky-100 dark:border-slate-800 shadow-sm">
        <h4 className="text-lg font-bold text-magic-600 mb-2">6. İletişim</h4>
        <p>Her türlü soru ve sorunlarınız için:</p>
        <a 
          href="mailto:masalfabrikasiapp@gmail.com" 
          className="inline-block font-bold text-magic-500 hover:text-magic-600 mt-2 text-lg break-all"
        >
          📧 masalfabrikasiapp@gmail.com
        </a>
      </section>
    </div>
  );

  if (!userProfile) return null;

  return (
    <div className="p-4 pb-24 h-full overflow-y-auto no-scrollbar">
      <h2 className="text-2xl font-bold mb-6 text-magic-900 dark:text-white">Ayarlar ⚙️</h2>

      {/* Profile Section */}
      <div className="bg-white dark:bg-slate-900/80 dark:backdrop-blur-md rounded-2xl p-4 mb-6 border border-sky-100 dark:border-slate-800 shadow-md transition-colors relative">
        <h3 className="text-lg font-bold mb-4 text-magic-600 dark:text-magic-400">Çocuk Profili</h3>
        
        <div className="flex items-center gap-4 mb-4 relative">
           <div 
             onClick={() => !isPhotoUploading && fileInputRef.current?.click()}
             className={`relative w-20 h-20 rounded-full bg-sky-100 dark:bg-slate-800 overflow-hidden cursor-pointer border-2 border-white dark:border-slate-700 shadow-sm flex items-center justify-center shrink-0 ${isPhotoUploading ? 'opacity-50 cursor-wait' : ''}`}
           >
              {userProfile.childPhoto ? (
                <img src={userProfile.childPhoto} alt="Çocuk" className="w-full h-full object-cover" />
              ) : (
                <span className="text-4xl">{isPhotoUploading ? '⏳' : getDefaultEmoji()}</span>
              )}
              <div className="absolute inset-0 bg-black/10 flex items-center justify-center opacity-0 hover:opacity-100 transition-opacity">
                 <span className="text-white text-[10px] font-bold">{isPhotoUploading ? '⏳' : 'Değiştir'}</span>
              </div>
              <input type="file" ref={fileInputRef} className="hidden" accept="image/*" onChange={handlePhotoUpload} />
           </div>
           
           <div className="flex-1 min-w-0 relative">
             <div className="flex items-center gap-2 group relative">
                <input 
                    type="text"
                    value={localName}
                    onChange={(e) => setLocalName(e.target.value)}
                    onBlur={handleNameBlur}
                    placeholder="İsim Girin..."
                    className="bg-transparent border-none p-0 m-0 font-bold text-xl text-magic-900 dark:text-white focus:outline-none focus:ring-0 w-full"
                />
                <span className="text-sm animate-pulse text-magic-400">⬅️</span>
                {(isSaving || isPhotoUploading) && (
                  <div className="absolute -top-4 right-0 text-[10px] text-green-500 font-bold animate-pulse">
                    {isPhotoUploading ? 'Fotoğraf Küçültülüyor...' : 'Kaydediliyor...'}
                  </div>
                )}
             </div>
             <p className="text-xs text-magic-400 dark:text-slate-500 truncate">{userProfile.email}</p>
             
             <div className="flex flex-wrap gap-2 mt-2">
                 {userProfile.joinedAt && (
                     <span className="inline-flex items-center px-2 py-1 rounded-md bg-sky-50 dark:bg-slate-800 text-sky-600 dark:text-sky-400 text-[10px] font-bold border border-sky-100 dark:border-slate-700">
                         📅 {new Date(userProfile.joinedAt).toLocaleDateString('tr-TR')}
                     </span>
                 )}
                 <span className="inline-flex items-center px-2 py-1 rounded-md bg-orange-50 dark:bg-orange-950/30 text-orange-600 dark:text-orange-400 text-[10px] font-bold border border-orange-100 dark:border-orange-900/50">
                     📚 {userProfile.storiesCount || 0} Masal Yazarı
                 </span>
             </div>
           </div>
        </div>

        <div className="grid grid-cols-2 gap-3 mt-4 border-t border-sky-50 dark:border-slate-800 pt-4">
            <div className="relative">
                <div className="flex items-center gap-1 mb-1">
                    <label className="text-[10px] font-black text-magic-400 uppercase tracking-widest">Doğum Tarihi</label>
                    <span className="text-[10px] animate-bounce text-magic-300">⬇️</span>
                </div>
                <input 
                    type="date" 
                    value={userProfile.birthDate}
                    onChange={(e) => updateUserProfile({ birthDate: e.target.value })}
                    className="w-full bg-sky-50 dark:bg-slate-800 border border-sky-100 dark:border-slate-700 rounded-lg p-2 text-sm text-magic-800 dark:text-slate-200 focus:border-magic-400 outline-none"
                />
            </div>
            <div className="relative">
                <div className="flex items-center gap-1 mb-1">
                    <label className="text-[10px] font-black text-magic-400 uppercase tracking-widest">Cinsiyet</label>
                    <span className="text-[10px] animate-bounce text-magic-300">⬇️</span>
                </div>
                <select 
                    value={userProfile.gender}
                    onChange={(e) => updateUserProfile({ gender: e.target.value as Gender })}
                    className="w-full bg-sky-50 dark:bg-slate-800 border border-sky-100 dark:border-slate-700 rounded-lg p-2 text-sm text-magic-800 dark:text-slate-200 focus:border-magic-400 outline-none"
                >
                    <option value={Gender.Boy}>Erkek 👦</option>
                    <option value={Gender.Girl}>Kız 👧</option>
                    <option value={Gender.Other}>Diğer 🐣</option>
                </select>
            </div>
        </div>
      </div>

      {/* Credits Section */}
      <div className="bg-gradient-to-br from-gold-400 to-orange-500 rounded-2xl p-6 mb-6 shadow-xl relative overflow-hidden group">
          <div className="absolute -right-4 -top-4 text-7xl opacity-20 transform group-hover:rotate-12 transition-transform">🪙</div>
          <div className="relative z-10">
              <h3 className="text-white font-bold text-lg mb-1">Bakiyen</h3>
              <div className="flex items-baseline gap-2 mb-4">
                  <span className="text-4xl font-black text-white">{userProfile.credits ?? 0}</span>
                  <span className="text-white/80 font-bold uppercase tracking-widest text-xs">Kredi</span>
              </div>
              <button 
                onClick={() => alert("Kredi satın alma yakında eklenecek! ✨")}
                className="w-full bg-white text-orange-600 font-bold py-3 rounded-xl shadow-md hover:bg-orange-50 active:scale-95 transition-all"
              >
                Kredi Al ➕
              </button>
          </div>
          <div className="mt-3 space-y-1">
            <p className="text-[10px] text-white/90 font-black uppercase tracking-wider">• Seslendirmesiz Masal: 10 Kredi</p>
            <p className="text-[10px] text-white font-black uppercase tracking-wider">• Seslendirmeli Masal: 20 Kredi</p>
          </div>
      </div>

      {/* App Controls */}
      <div className="bg-white dark:bg-slate-900/80 dark:backdrop-blur-md rounded-2xl p-4 mb-6 border border-sky-100 dark:border-slate-800 shadow-md transition-colors">
        <h3 className="text-lg font-bold mb-4 text-magic-600 dark:text-magic-400">Görünüm & Ses</h3>
        
        {/* Dark Mode Toggle */}
        <div className="flex items-center justify-between py-2 mb-4">
          <div>
            <span className="block font-bold text-magic-900 dark:text-white">Gece Modu 🌙</span>
            <span className="text-xs text-magic-400 dark:text-slate-500">Gözleri yormayan koyu tema</span>
          </div>
          <button 
            onClick={() => updateSettings({ darkMode: !settings.darkMode })}
            className={`w-14 h-8 rounded-full p-1 transition-colors ${settings.darkMode ? 'bg-magic-400' : 'bg-gray-300'}`}
          >
            <div className={`w-6 h-6 bg-white rounded-full transition-transform shadow-sm ${settings.darkMode ? 'translate-x-6' : ''}`} />
          </button>
        </div>

        {/* Sleep Timer */}
        <div className="mb-6 border-t border-sky-50 dark:border-slate-800 pt-4">
          <label className="block text-sm text-magic-800 dark:text-slate-300 mb-2 font-bold">
            Uyku Zamanlayıcısı
          </label>
          <div className="flex items-center gap-2">
            <input 
              type="time" 
              value={settings.sleepTime || ''}
              onChange={(e) => updateSettings({ sleepTime: e.target.value })}
              className="bg-sky-50 dark:bg-slate-800 border border-sky-200 dark:border-slate-700 rounded-lg p-3 text-magic-900 dark:text-white text-lg w-full"
            />
            {settings.sleepTime && (
              <button 
                onClick={() => updateSettings({ sleepTime: null })}
                className="bg-red-50 dark:bg-red-950/30 text-red-500 p-3 rounded-lg text-sm whitespace-nowrap border border-red-100 dark:border-red-900/50"
              >
                Temizle
              </button>
            )}
          </div>
          <p className="text-xs text-magic-400 dark:text-slate-500 mt-2">
            Bu saatte, okumayı durdurmak için uykulu bir mesaj belirecek.
          </p>
        </div>

        {/* Sound Toggle */}
        <div className="flex items-center justify-between py-2 border-t border-sky-50 dark:border-slate-800 pt-4">
          <div>
            <span className="block font-bold text-magic-900 dark:text-white">Seslendirme</span>
            <span className="text-xs text-magic-400 dark:text-slate-500">Masalları otomatik seslendir</span>
          </div>
          <button 
            onClick={() => updateSettings({ soundEnabled: !settings.soundEnabled })}
            className={`w-14 h-8 rounded-full p-1 transition-colors ${settings.soundEnabled ? 'bg-magic-400' : 'bg-gray-300'}`}
          >
            <div className={`w-6 h-6 bg-white rounded-full transition-transform shadow-sm ${settings.soundEnabled ? 'translate-x-6' : ''}`} />
          </button>
        </div>

        {/* Auto Page Transition Toggle */}
        <div className="flex items-center justify-between py-2 border-t border-sky-50 dark:border-slate-800 mt-2 pt-4">
          <div>
            <span className="block font-bold text-magic-900 dark:text-white">Otomatik Sayfa Geçişi</span>
            <span className="text-xs text-magic-400 dark:text-slate-500">Ses bittiğinde diğer sayfaya geç</span>
          </div>
          <button 
            onClick={() => updateSettings({ autoPageTransition: !settings.autoPageTransition })}
            className={`w-14 h-8 rounded-full p-1 transition-colors ${settings.autoPageTransition ? 'bg-magic-400' : 'bg-gray-300'}`}
          >
            <div className={`w-6 h-6 bg-white rounded-full transition-transform shadow-sm ${settings.autoPageTransition ? 'translate-x-6' : ''}`} />
          </button>
        </div>
      </div>

       <div className="space-y-4 mt-8">
          <button 
            onClick={logout}
            className="w-full bg-white dark:bg-slate-900/50 hover:bg-gray-50 dark:hover:bg-slate-800 text-magic-600 dark:text-magic-400 font-bold py-4 rounded-xl shadow-md border border-magic-200 dark:border-slate-700 transition-colors"
          >
            Çıkış Yap 🚪
          </button>

          <div className="grid grid-cols-2 gap-4 px-1 pb-4">
            <button 
              onClick={() => setModalType('privacy')}
              className="text-xs font-bold text-magic-400 dark:text-slate-500 hover:text-magic-600 transition-colors uppercase tracking-widest text-center"
            >
              Gizlilik Politikası
            </button>
            <button 
              onClick={() => setModalType('terms')}
              className="text-xs font-bold text-magic-400 dark:text-slate-500 hover:text-magic-600 transition-colors uppercase tracking-widest text-center"
            >
              Kullanım Koşulları
            </button>
          </div>
       </div>

       {/* Policy Modals */}
       <PolicyModal 
          isOpen={modalType === 'privacy'} 
          title="Gizlilik Politikası" 
          content={privacyContent} 
          onClose={() => setModalType(null)} 
       />
       <PolicyModal 
          isOpen={modalType === 'terms'} 
          title="Kullanım Koşulları" 
          content={termsContent} 
          onClose={() => setModalType(null)} 
       />
    </div>
  );
};
