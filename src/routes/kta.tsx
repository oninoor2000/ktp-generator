import { useState } from "react";

import { useImmerReducer } from "use-immer";
import { createFileRoute } from "@tanstack/react-router";

import type {
  GeneratorSettingsActionType,
  GeneratorSettingsType,
} from "@/lib/types";

import {
  saveKtaPositionConfig,
  loadKtaGeneratorSettings,
  saveKtaGeneratorSettings,
} from "@/service/kta-service";
import { generateKtaData } from "@/service/data-generation-service";
import {
  GeneratorSettingsContext,
  GeneratorSettingsDispatchContext,
} from "@/context/generator-settings-context";
import { GeneratorSettings } from "@/components/generator-settings";
import DataPreview from "@/components/data-preview";

export const Route = createFileRoute("/kta")({
  component: KTA,
});

function KTA() {
  const [isGenerating, setIsGenerating] = useState(false);

  // Async function to handle data generation
  const handleGenerateData = async (payload: GeneratorSettingsType) => {
    setIsGenerating(true);
    try {
      const data = await generateKtaData(payload);
      await new Promise((resolve) => setTimeout(resolve, 500));
      dispatch({ type: "SET_KTA_DATA", payload: data });
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
        saveKtaGeneratorSettings(draft);
        break;
      }
      case "CHANGE_KTA_POSITION_SETTINGS": {
        draft.KTAPositionConfig = action.payload;
        saveKtaPositionConfig(action.payload);
        break;
      }
      case "GENERATE_DATA": {
        handleGenerateData(action.payload as GeneratorSettingsType);
        break;
      }
      case "SET_KTA_DATA": {
        draft.KTAData = action.payload;
        break;
      }
    }
  }

  const [config, dispatch] = useImmerReducer(
    reducer,
    loadKtaGeneratorSettings(),
  );

  return (
    <main className="mx-auto">
      <div className="mx-auto max-w-6xl">
        <div className="grid grid-cols-12 gap-4 p-4 md:p-8 lg:p-8">
          <div className="col-span-12 md:col-span-6 lg:col-span-5">
            <GeneratorSettingsContext.Provider value={config}>
              <GeneratorSettingsDispatchContext.Provider value={dispatch}>
                <GeneratorSettings cardType="KTA" isGenerating={isGenerating} />
              </GeneratorSettingsDispatchContext.Provider>
            </GeneratorSettingsContext.Provider>
          </div>
          <div className="col-span-12 md:col-span-6 lg:col-span-7">
            <DataPreview
              data={config.KTAData ?? []}
              cardType="KTA"
              positionConfig={config.KTAPositionConfig}
            />
          </div>
        </div>
      </div>
    </main>
  );
}
