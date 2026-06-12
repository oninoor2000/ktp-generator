"use client";

import * as React from "react";

import {
  KTA_DEFAULTS,
  KTP_DEFAULTS,
  STORAGE_KEYS,
} from "~/features/generator/domain/constants";
import { generatorSettingsSchema } from "~/features/generator/domain/schemas";
import type { CardType, GeneratorSettings } from "~/features/generator/domain/types";

type StorageLike = Pick<Storage, "getItem" | "setItem">;

export function getDefaultSettings(cardType: CardType): GeneratorSettings {
  const defaults = cardType === "KTP" ? KTP_DEFAULTS : KTA_DEFAULTS;
  return {
    cardType,
    dataCount: defaults.dataCount,
    minAge: defaults.minAge,
    maxAge: defaults.maxAge,
    gender: defaults.gender,
    provinceIds: [],
    honeypot: "",
    clientStartedAt: Date.now(),
  };
}

function storageKey(cardType: CardType): string {
  return cardType === "KTP" ? STORAGE_KEYS.ktpSettings : STORAGE_KEYS.ktaSettings;
}

export function readStoredSettings(
  cardType: CardType,
  storage: StorageLike | null,
): GeneratorSettings {
  const defaults = getDefaultSettings(cardType);

  if (!storage) {
    return defaults;
  }

  try {
    const raw = storage.getItem(storageKey(cardType));
    if (!raw) {
      return defaults;
    }

    const parsed = JSON.parse(raw) as Partial<GeneratorSettings>;
    const result = generatorSettingsSchema.safeParse({
      ...defaults,
      ...parsed,
      cardType,
      honeypot: "",
      clientStartedAt: Date.now(),
    });

    if (!result.success) {
      return defaults;
    }

    return {
      ...result.data,
      honeypot: "",
      clientStartedAt: Date.now(),
    };
  } catch {
    return defaults;
  }
}

export function writeStoredSettings(
  settings: GeneratorSettings,
  storage: StorageLike | null,
): void {
  if (!storage) {
    return;
  }

  const payload = {
    cardType: settings.cardType,
    dataCount: settings.dataCount,
    minAge: settings.minAge,
    maxAge: settings.maxAge,
    gender: settings.gender,
    provinceIds: settings.provinceIds,
  };

  storage.setItem(storageKey(settings.cardType), JSON.stringify(payload));
}

export function useGeneratorPreferences(cardType: CardType) {
  const canUseStorage = typeof window !== "undefined";
  const [settings, setSettings] = React.useState<GeneratorSettings>(() =>
    readStoredSettings(cardType, canUseStorage ? window.localStorage : null),
  );

  React.useEffect(() => {
    setSettings(readStoredSettings(cardType, window.localStorage));
  }, [cardType]);

  React.useEffect(() => {
    if (!canUseStorage) {
      return;
    }

    writeStoredSettings(settings, window.localStorage);
  }, [canUseStorage, settings]);

  const updateSettings = React.useCallback(
    (next: GeneratorSettings | ((current: GeneratorSettings) => GeneratorSettings)) => {
      setSettings((current) => {
        const value = typeof next === "function" ? next(current) : next;
        return { ...value, cardType };
      });
    },
    [cardType],
  );

  return {
    settings,
    setSettings: updateSettings,
  };
}
