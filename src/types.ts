/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

export interface MedicineAnalysis {
  name: string;
  composition: string;
  purpose: string;
  howItWorks: string;
  componentRoles: string;
  diseases: string[];
  symptoms: string[];
  extraUseCases: string[];
  dosageInfo: string;
  warnings: string;
  sideEffects: string;
  simpleUnderstanding: string;
}

export type Language = 'en' | 'hi' | 'mr' | 'gu' | 'ta' | 'te' | 'kn' | 'ml' | 'bn' | 'pa';

export const LANGUAGES: Record<Language, string> = {
  en: 'English',
  hi: 'Hindi (हिन्दी)',
  mr: 'Marathi (मराठी)',
  gu: 'Gujarati (ગુજરાતી)',
  ta: 'Tamil (தமிழ்)',
  te: 'Telugu (తెలుగు)',
  kn: 'Kannada (ಕನ್ನಡ)',
  ml: 'Malayalam (മലയാളം)',
  bn: 'Bengali (বাংলা)',
  pa: 'Punjabi (ਪੰਜਾਬੀ)',
};

export interface HistoryItem {
  id: string;
  _id?: string;
  timestamp: number;
  type: 'scan' | 'search';
  query?: string;
  image?: string;
  result: MedicineAnalysis;
  language: Language;
}
