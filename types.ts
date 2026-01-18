
export enum Gender {
  Boy = 'Boy',
  Girl = 'Girl',
  Other = 'Other'
}

export enum VoiceType {
  Male = 'Male',
  Female = 'Female'
}

export interface UserProfile {
  id?: string;
  name: string;
  email?: string;
  password?: string;
  childName: string;
  childPhoto?: string;
  birthDate: string;
  gender: Gender;
  joinedAt?: string;
  storiesCount?: number;
  credits?: number;
}

export interface AppSettings {
  sleepTime: string | null;
  soundEnabled: boolean;
  autoPageTransition: boolean;
  darkMode: boolean;
}

export interface CharacterOption {
  id: string;
  name: string;
  description: string;
  emoji: string;
  type: 'Main' | 'Side';
}

export interface SelectionOption {
  id: string;
  name: string;
  emoji: string;
  prompt?: string;
}

export interface StoryParams {
  mainCharacterId: string;
  mainCharacterName: string;
  sideCharacterId: string;
  sideCharacterName: string;
  sideCharacterType?: string;
  location: string;
  theme: string;
  styleId: string;
  voice: VoiceType;
  childAge?: number; 
  language: 'tr' | 'en';
}

export interface StoryPage {
  pageNumber: number;
  text: string;
  imagePrompt: string;
  imageUrl?: string;
  audioData?: string;
  audioUrl?: string;
}

export interface Story {
  id: string;
  title: string;
  coverImage?: string;
  createdAt: number;
  params: StoryParams;
  pages: StoryPage[];
  isComplete?: boolean;
  characterVisualDescription?: string;
  sideCharacterVisualDescription?: string;
}
