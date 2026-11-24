import { en, type TranslationKey } from './en';
import { th } from './th';

export type Lang = 'th' | 'en';
export type { TranslationKey };
export { en, th };

export const dictionaries: Record<Lang, Record<TranslationKey, string>> = { en, th };

export function translate(lang: Lang, key: TranslationKey): string {
  return dictionaries[lang][key] ?? dictionaries.en[key] ?? key;
}

export const LANGUAGE_STORAGE_KEY = 'mythos_language';
