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
import { GeneratorSettings } from "@/components/generator-settings";

export const Route = createFileRoute("/kta")({
  component: KTA,
});

function KTA() {
  const [isGenerating, setIsGenerating] = useState(false);

  // Reducer
  function reducer(
    draft: GeneratorSettingsType,
    action: GeneratorSettingsActionType,
  ) {
    switch (action.type) {
      case "CHANGE_SETTINGS": {
        const data = {
          dataCount: action.payload?.dataCount,
          minAge: action.payload?.minAge,
          maxAge: action.payload?.maxAge,
          gender: action.payload?.gender,
          province: action.payload?.province,
        } as Omit<GeneratorSettingsType, "KTPData" | "KTPPositionConfig">;

        Object.assign(draft, data);
        saveKtpGeneratorSettings(data);
        break;
      }
      case "CHANGE_KTP_POSITION_SETTINGS": {
        draft.KTPPositionConfig = action.payload;
        saveKtpPositionConfig(action.payload);
        break;
      }
      case "GENERATE_DATA":
        // draft = action.payload as GeneratorSettingsType;

        setIsGenerating(true);
        setTimeout(() => {
          setIsGenerating(false);
        }, 1000);
        break;
    }
  }

  const [config, dispatch] = useImmerReducer(
    reducer,
    loadKtpGeneratorSettings(),
  );

  return (
    <main className="mx-auto py-8">
      <div className="mx-auto max-w-6xl">
        <div className="grid grid-cols-12 gap-4 p-4 md:p-8 lg:p-10">
          <div className="col-span-12 md:col-span-6 lg:col-span-5">
            <GeneratorSettingsContext.Provider value={config}>
              <GeneratorSettingsDispatchContext.Provider value={dispatch}>
                <GeneratorSettings cardType="KTA" isGenerating={isGenerating} />
              </GeneratorSettingsDispatchContext.Provider>
            </GeneratorSettingsContext.Provider>
          </div>
        </div>
      </div>
    </main>
  );
}
