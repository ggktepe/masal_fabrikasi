
import React, { createContext, useContext, useState, useEffect, ReactNode, useCallback, useMemo, useRef } from 'react';
import { UserProfile, AppSettings, Story, Gender } from '../types';
import { supabase } from '../supabaseClient';

interface LeaderboardEntry {
  child_name: string;
  stories_count: number;
  email: string;
  child_photo?: string;
  gender?: Gender;
}

interface AppContextType {
  userProfile: UserProfile | null;
  isLoading: boolean;
  isFirstLogin: boolean;
  completeOnboarding: () => void;
  login: (email: string, pass: string) => Promise<{ error?: string }>;
  loginWithGoogle: () => Promise<{ error?: string }>;
  register: (profile: UserProfile) => Promise<{ error?: string; success?: boolean }>;
  logout: () => Promise<void>;
  updateUserProfile: (updates: Partial<UserProfile>) => Promise<{ error?: string }>;
  settings: AppSettings;
  updateSettings: (newSettings: Partial<AppSettings>) => Promise<void>;
  stories: Story[];
  addStory: (story: Story) => Promise<void>;
  deleteStory: (id: string) => Promise<void>;
  currentTab: string;
  setCurrentTab: (tab: string) => void;
  isSleepMode: boolean;
  dismissSleepMode: () => void;
  getLeaderboard: () => Promise<LeaderboardEntry[]>;
  readingStory: Story | null;
  openStory: (story: Story) => void;
  closeStory: () => void;
  resumingStory: Story | null;
  resumeGeneration: (story: Story) => void;
  setResumingStory: (story: Story | null) => void;
  spendCredits: (amount: number) => Promise<{ success: boolean; error?: string }>;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

export const AppProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isFirstLogin, setIsFirstLogin] = useState(false);
  const isFetchingRef = useRef(false);
  const lastDismissedTimeRef = useRef<string | null>(null);
  
  const [settings, setSettingsState] = useState<AppSettings>((() => {
    try {
      const saved = { 
        sleepTime: localStorage.getItem('mf_sleep_time') || null, 
        soundEnabled: localStorage.getItem('mf_sound_enabled') === 'true',
        autoPageTransition: localStorage.getItem('mf_auto_page') !== 'false',
        darkMode: localStorage.getItem('mf_dark_mode') === 'true'
      };
      return saved;
    } catch {
      return { sleepTime: null, soundEnabled: false, autoPageTransition: true, darkMode: false };
    }
  })());

  const [stories, setStories] = useState<Story[]>([]);
  const [currentTab, setCurrentTab] = useState('home');
  const [isSleepMode, setIsSleepMode] = useState(false);
  const [readingStory, setReadingStory] = useState<Story | null>(null);
  const [resumingStory, setResumingStory] = useState<Story | null>(null);

  useEffect(() => {
    if (settings.darkMode) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [settings.darkMode]);

  useEffect(() => {
    if (!settings.sleepTime) {
      setIsSleepMode(false);
      return;
    }
    const interval = setInterval(() => {
      const now = new Date();
      const currentTime = now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: false });
      if (currentTime === settings.sleepTime && lastDismissedTimeRef.current !== currentTime) {
        setIsSleepMode(true);
      }
    }, 1000);
    return () => clearInterval(interval);
  }, [settings.sleepTime]);

  const dismissSleepMode = useCallback(() => {
    setIsSleepMode(false);
    lastDismissedTimeRef.current = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: false });
  }, []);

  const completeOnboarding = useCallback(() => {
    setIsFirstLogin(false);
    if (userProfile?.id) {
      localStorage.setItem(`mf_onboarding_${userProfile.id}`, 'done');
    }
  }, [userProfile?.id]);

  const fetchUserData = useCallback(async (userId: string, isSilent: boolean = false, userData?: any) => {
    if (isFetchingRef.current) return;
    try {
      isFetchingRef.current = true;
      if (!isSilent) setIsLoading(true);
      
      const { data: { user }, error: userError } = await supabase.auth.getUser();
      
      if (userError) {
        if (userError.message.includes('refresh_token') || userError.status === 400 || userError.status === 401) {
          await supabase.auth.signOut();
          setUserProfile(null);
          setIsLoading(false);
          isFetchingRef.current = false;
          return;
        }
        throw userError;
      }

      const activeUser = user || userData;
      if (!activeUser) { 
        setIsLoading(false); 
        isFetchingRef.current = false;
        return; 
      }

      // Check for first login status
      const onboardingDone = localStorage.getItem(`mf_onboarding_${userId}`);
      if (!onboardingDone) {
        setIsFirstLogin(true);
      }

      let profileRes = await supabase.from('profiles').select('*').eq('id', userId).maybeSingle();
      
      if (!profileRes.data) {
          const newProfile = {
              id: userId,
              email: activeUser.email,
              child_name: activeUser.user_metadata?.full_name || activeUser.email?.split('@')[0] || 'Kahraman',
              gender: activeUser.user_metadata?.gender || Gender.Boy,
              birth_date: activeUser.user_metadata?.birth_date || new Date().toISOString().split('T')[0],
              child_photo: activeUser.user_metadata?.child_photo || null,
              credits: 20,
              stories_count: 0,
              joined_at: new Date().toISOString()
          };
          const { data: createdProfile } = await supabase.from('profiles').upsert(newProfile, { onConflict: 'id' }).select().single();
          if (createdProfile) profileRes.data = createdProfile;
      }

      const { data: settingsData } = await supabase.from('settings').select('*').eq('user_id', userId).maybeSingle();
      if (settingsData) {
        setSettingsState({
            sleepTime: settingsData.sleep_time,
            soundEnabled: settingsData.sound_enabled ?? false,
            autoPageTransition: settingsData.auto_page_transition ?? true,
            darkMode: settingsData.dark_mode ?? false
        });
      }

      if (profileRes.data) {
        const p = profileRes.data;
        setUserProfile({
            id: userId,
            name: activeUser.email?.split('@')[0] || 'Ebeveyn',
            email: activeUser.email,
            childName: p.child_name,
            childPhoto: p.child_photo,
            birthDate: p.birth_date,
            gender: p.gender as Gender,
            joinedAt: p.joined_at,
            storiesCount: p.stories_count || 0,
            credits: p.credits ?? 0
        });
      }

      // Fix: Query stories by user_id, not by story id
      let { data: storiesData } = await supabase.from('stories').select('*').eq('user_id', userId).order('created_at', { ascending: false });
      if (storiesData) {
          setStories(storiesData.map((s: any) => ({
                id: s.id,
                title: s.title || 'Adsız Masal',
                coverImage: s.cover_image,
                createdAt: typeof s.created_at === 'string' ? new Date(s.created_at).getTime() : s.created_at,
                params: s.params || {},
                pages: s.pages || [],
                isComplete: (s.pages && s.pages.length > 0) ? (s.is_complete ?? true) : false,
                characterVisualDescription: s.character_visual_description || "",
                sideCharacterVisualDescription: s.side_character_visual_description || ""
          })));
      }
    } catch (error) { 
      console.error("fetchUserData Error:", error); 
    } finally { 
      setIsLoading(false); 
      isFetchingRef.current = false;
    }
  }, []);

  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      if (event === 'SIGNED_OUT') {
         setUserProfile(null);
         setStories([]);
         setIsLoading(false);
         setIsFirstLogin(false);
      } else if (session?.user) {
         fetchUserData(session.user.id, true, session.user);
      } else if (!session && event !== 'INITIAL_SESSION') {
         setIsLoading(false);
      } else if (event === 'INITIAL_SESSION' && !session) {
         setIsLoading(false);
      }
    });
    return () => subscription.unsubscribe();
  }, [fetchUserData]);

  const addStory = useCallback(async (story: Story) => {
    if (!userProfile?.id) return;
    
    setStories(prev => {
        const exists = prev.find(s => s.id === story.id);
        if (exists) return prev.map(s => s.id === story.id ? story : s);
        return [story, ...prev];
    });

    const storyPayload = {
        id: String(story.id),
        user_id: userProfile.id,
        title: story.title || 'Adsız Masal',
        cover_image: story.coverImage || null,
        params: story.params || {},
        pages: story.pages || [],
        created_at: story.createdAt || Date.now(),
        is_complete: !!story.isComplete,
        character_visual_description: story.characterVisualDescription || "",
        // Fix typo: property is sideCharacterVisualDescription in types.ts
        side_character_visual_description: story.sideCharacterVisualDescription || ""
    };

    try {
        const { error } = await supabase.from('stories').upsert(storyPayload, { onConflict: 'id' });
        if (error) throw error;

        if (story.isComplete) {
            const { count } = await supabase.from('stories').select('*', { count: 'exact', head: true }).eq('user_id', userProfile.id).eq('is_complete', true);
            const newCount = count || 0;
            await supabase.from('profiles').update({ stories_count: newCount }).eq('id', userProfile.id);
            setUserProfile(prev => prev ? { ...prev, storiesCount: newCount } : null);
        }
    } catch (err: any) {
        console.error("CRITICAL DB ERROR:", err);
    }
  }, [userProfile]);

  const register = useCallback(async (profile: UserProfile) => {
    const { data, error } = await supabase.auth.signUp({ 
        email: profile.email!, 
        password: profile.password!,
        options: { data: { full_name: profile.childName, birth_date: profile.birthDate, gender: profile.gender, child_photo: profile.childPhoto } }
    });
    if (error) return { error: error.message };
    if (data.user) {
        await supabase.from('profiles').upsert({
            id: data.user.id,
            email: profile.email,
            child_name: profile.childName,
            gender: profile.gender,
            birth_date: profile.birthDate,
            child_photo: profile.childPhoto,
            credits: 20,
            stories_count: 0,
            joined_at: new Date().toISOString()
        }, { onConflict: 'id' });
    }
    return { success: true };
  }, []);

  const login = useCallback(async (email: string, pass: string) => {
    const { error } = await supabase.auth.signInWithPassword({ email, password: pass });
    if (error) return { error: error.message };
    return {};
  }, []);

  const loginWithGoogle = useCallback(async () => {
    const { error } = await supabase.auth.signInWithOAuth({ 
        provider: 'google', 
        options: { redirectTo: window.location.origin, queryParams: { prompt: 'select_account' } } 
    });
    if (error) return { error: error.message };
    return {};
  }, []);

  const updateUserProfile = useCallback(async (updates: Partial<UserProfile>) => {
    if (!userProfile?.id) return { error: "Oturum bulunamadı." };
    setUserProfile(prev => prev ? { ...prev, ...updates } : null);
    const dbUpdates: any = {};
    if (updates.childName !== undefined) dbUpdates.child_name = updates.childName;
    if (updates.birthDate !== undefined) dbUpdates.birth_date = updates.birthDate;
    if (updates.gender !== undefined) dbUpdates.gender = updates.gender;
    if (updates.childPhoto !== undefined) dbUpdates.child_photo = updates.childPhoto;
    const { error } = await supabase.from('profiles').update(dbUpdates).eq('id', userProfile.id);
    if (error) return { error: error.message };
    return {};
  }, [userProfile]);

  const updateSettings = useCallback(async (newSettings: Partial<AppSettings>) => {
    setSettingsState(prev => {
        const updated = { ...prev, ...newSettings };
        if (newSettings.sleepTime !== undefined) localStorage.setItem('mf_sleep_time', newSettings.sleepTime || '');
        if (newSettings.soundEnabled !== undefined) localStorage.setItem('mf_sound_enabled', String(newSettings.soundEnabled));
        if (newSettings.autoPageTransition !== undefined) localStorage.setItem('mf_auto_page', String(newSettings.autoPageTransition));
        if (newSettings.darkMode !== undefined) localStorage.setItem('mf_dark_mode', String(newSettings.darkMode));
        return updated;
    });
    if (userProfile?.id) {
        const payload: any = {
            user_id: userProfile.id,
            sleep_time: newSettings.sleepTime !== undefined ? newSettings.sleepTime : settings.sleepTime,
            sound_enabled: newSettings.soundEnabled !== undefined ? newSettings.soundEnabled : settings.soundEnabled,
            auto_page_transition: newSettings.autoPageTransition !== undefined ? newSettings.autoPageTransition : settings.autoPageTransition,
            dark_mode: newSettings.darkMode !== undefined ? newSettings.darkMode : settings.darkMode
        };
        await supabase.from('settings').upsert(payload, { onConflict: 'user_id' });
    }
  }, [userProfile, settings]);

  const deleteStory = useCallback(async (id: string) => {
    if (!userProfile?.id) return;
    setStories(prev => prev.filter(s => s.id !== id));
    await supabase.from('stories').delete().eq('id', id);
    const { count } = await supabase.from('stories').select('*', { count: 'exact', head: true }).eq('user_id', userProfile.id).eq('is_complete', true);
    const newCount = count || 0;
    await supabase.from('profiles').update({ stories_count: newCount }).eq('id', userProfile.id);
    setUserProfile(prev => prev ? { ...prev, storiesCount: newCount } : null);
  }, [userProfile]);

  const spendCredits = useCallback(async (amount: number) => {
    if (!userProfile?.id) return { success: false, error: 'Oturum bulunamadı' };
    const currentCredits = userProfile.credits ?? 0;
    if (currentCredits < amount) return { success: false, error: 'Yetersiz kredi' };
    const newCredits = currentCredits - amount;
    setUserProfile(prev => prev ? { ...prev, credits: newCredits } : null);
    const { error } = await supabase.from('profiles').update({ credits: newCredits }).eq('id', userProfile.id);
    if (error) {
        setUserProfile(prev => prev ? { ...prev, credits: currentCredits } : null);
        return { success: false, error: "Kredi güncellenemedi." };
    }
    return { success: true };
  }, [userProfile]);

  const logout = useCallback(async () => { await supabase.auth.signOut(); }, []);
  const getLeaderboard = useCallback(async () => {
    const { data } = await supabase.from('profiles').select('child_name, stories_count, email, child_photo, gender').order('stories_count', { ascending: false }).limit(50);
    return data || [];
  }, []);

  const value = useMemo(() => ({
      userProfile, isLoading, isFirstLogin, completeOnboarding, login, loginWithGoogle, register,
      logout, updateUserProfile, settings, updateSettings, stories, addStory, deleteStory,
      currentTab, setCurrentTab, isSleepMode, dismissSleepMode, getLeaderboard,
      readingStory, openStory: setReadingStory, closeStory: () => setReadingStory(null),
      resumingStory, resumeGeneration: (s: Story) => { setResumingStory(s); setCurrentTab('create'); }, 
      setResumingStory, spendCredits
  }), [userProfile, isLoading, isFirstLogin, completeOnboarding, settings, stories, currentTab, isSleepMode, dismissSleepMode, getLeaderboard, readingStory, resumingStory, register, login, loginWithGoogle, logout, updateUserProfile, updateSettings, addStory, deleteStory, spendCredits]);

  return <AppContext.Provider value={value}>{children}</AppContext.Provider>;
};

export const useApp = () => {
  const context = useContext(AppContext);
  if (!context) throw new Error("useApp must be used within AppProvider");
  return context;
};
