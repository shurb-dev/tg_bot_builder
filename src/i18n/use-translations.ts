"use client";

import { usePreferencesStore } from "@/store/preferences-store";
import { getTranslations } from "./translations";

export function useTranslations() {
  const locale = usePreferencesStore((state) => state.locale);
  return getTranslations(locale);
}
