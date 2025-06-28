import { useState } from "react";

import { useImmerReducer } from "use-immer";
import { createFileRoute } from "@tanstack/react-router";

import type {
  GeneratorSettingsActionType,
  GeneratorSettingsType,
} from "@/lib/types";

import {
  saveKtpPositionConfig,
  loadKtpGeneratorSettings,
  saveKtpGeneratorSettings,
} from "@/service/ktp-service";
import {
  GeneratorSettingsContext,
  GeneratorSettingsDispatchContext,
} from "@/context/generator-settings-context";
import { generateKtpData } from "@/service/data-generator";
import { GeneratorSettings } from "@/components/generator-settings";
import { DEFAULT_KTP_POSITION_CONFIG } from "@/lib/constant/ktp-position-constant";

import DataPreview from "@/components/data-preview";

export const Route = createFileRoute("/")({
  component: Index,
});

function Index() {
  const [isGenerating, setIsGenerating] = useState(false);

  // Async function to handle data generation
  const handleGenerateData = async (payload: GeneratorSettingsType) => {
    setIsGenerating(true);
    try {
      const data = generateKtpData(payload);
      await new Promise((resolve) => setTimeout(resolve, 500));
      dispatch({ type: "SET_KTP_DATA", payload: data });
      setIsGenerating(false);
    } catch (error) {
      console.error(error);
      setIsGenerating(false);
    }
  };

  // Reducer
  function reducer(
    draft: GeneratorSettingsType,
    action: GeneratorSettingsActionType,
  ) {
    switch (action.type) {
      case "CHANGE_SETTINGS": {
        Object.assign(draft, action.payload);
        saveKtpGeneratorSettings(action.payload);
        break;
      }
      case "CHANGE_KTP_POSITION_SETTINGS": {
        draft.KTPPositionConfig = action.payload;
        saveKtpPositionConfig(action.payload ?? DEFAULT_KTP_POSITION_CONFIG);
        break;
      }
      case "GENERATE_DATA": {
        handleGenerateData(action.payload as GeneratorSettingsType);
        break;
      }
      case "SET_KTP_DATA": {
        draft.KTPData = action.payload;
        break;
      }
    }
  }

  const [config, dispatch] = useImmerReducer(
    reducer,
    loadKtpGeneratorSettings(),
  );

  return (
    <main className="mx-auto">
      <div className="mx-auto max-w-6xl">
        <div className="grid grid-cols-12 gap-4 p-4 md:p-8 lg:p-8">
          <div className="col-span-12 md:col-span-6 lg:col-span-5">
            <GeneratorSettingsContext.Provider value={config}>
              <GeneratorSettingsDispatchContext.Provider value={dispatch}>
                <GeneratorSettings cardType="KTP" isGenerating={isGenerating} />
              </GeneratorSettingsDispatchContext.Provider>
            </GeneratorSettingsContext.Provider>
          </div>
          <div className="col-span-12 md:col-span-6 lg:col-span-7">
            <DataPreview
              data={config.KTPData ?? []}
              cardType="KTP"
              positionConfig={config.KTPPositionConfig}
            />
          </div>
        </div>
      </div>
    </main>
  );
}
