"use client";

import { create } from "zustand";
import type { AppLocale } from "@/i18n/translations";

export const PREFERENCES_STORAGE_KEY = "telegram-bot-visual-builder:preferences:v1";

type PreferencesState = {
  locale: AppLocale;
  hydrated: boolean;
  hydratePreferences(): void;
  setLocale(locale: AppLocale): void;
};

function browserDefaultLocale(): AppLocale {
  if (typeof navigator !== "undefined" && navigator.language.toLowerCase().startsWith("ru")) return "ru";
  return "en";
}

export const usePreferencesStore = create<PreferencesState>((set) => ({
  locale: "en",
  hydrated: false,
  hydratePreferences() {
    if (typeof window === "undefined") return;
    let locale = browserDefaultLocale();
    try {
      const raw = window.localStorage.getItem(PREFERENCES_STORAGE_KEY);
      if (raw) {
        const parsed = JSON.parse(raw) as { locale?: unknown };
        if (parsed.locale === "ru" || parsed.locale === "en") locale = parsed.locale;
      }
    } catch {
      // Invalid preference data is safe to ignore; project data is stored separately.
    }
    set({ locale, hydrated: true });
  },
  setLocale(locale) {
    if (typeof window !== "undefined") window.localStorage.setItem(PREFERENCES_STORAGE_KEY, JSON.stringify({ locale }));
    set({ locale, hydrated: true });
  },
}));
