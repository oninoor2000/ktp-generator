"use client";

import { useMutation } from "@tanstack/react-query";

import { generateCardData } from "~/server/generation";

export function useGenerateCardData() {
  return useMutation({
    mutationFn: generateCardData,
  });
}
