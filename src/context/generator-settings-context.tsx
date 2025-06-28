import { createContext } from "react";
import type { GeneratorSettingsType } from "@/lib/types";

export const GeneratorSettingsContext =
  createContext<GeneratorSettingsType | null>(null);
export const GeneratorSettingsDispatchContext = createContext<unknown>(null);
