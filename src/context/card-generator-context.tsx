import { createContext } from "react";
import type { CardType } from "@/lib/types";
export const CardGeneratorContext = createContext<CardType | null>(null);
export const CardGeneratorDispatchContext = createContext<unknown>(null);
