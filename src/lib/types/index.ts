import type { KTPGeneratedData, KTPPositionConfig } from "./ktp-types";

/**
 * CardType is the type of card that the user is generating.
 */
export type CardType = "KTP" | "KTA";

/**
 * Text style configuration
 */
export type TextStyle = {
  fontSize: number;
  fontWeight: "normal" | "bold";
  fontFamily: string;
  color: string; // hex color
};

/**
 * Text position
 */
export interface TextPosition {
  x: number; // Relative X position (0-100%)
  y: number; // Relative Y position (0-100%)
  align: "left" | "center" | "right";
}

/**
 * FieldConfig is the type of configuration for a field.
 */
export interface FieldConfig {
  position: TextPosition;
  style: TextStyle;
  enabled: boolean;
}

/**
 * CardGeneratorActionType is the type of action that can be dispatched to the card generator context.
 */
export type CardGeneratorActionType = {
  type: "SET_CARD_TYPE";
  payload: CardType;
};

export type GeneratorSettingsActionType =
  | {
      type: "CHANGE_SETTINGS" | "GENERATE_DATA";
      payload: GeneratorSettingsType;
    }
  | {
      type: "CHANGE_KTP_POSITION_SETTINGS";
      payload: KTPPositionConfig;
    }
  | {
      type: "SET_KTP_DATA";
      payload: Array<KTPGeneratedData>;
    };

/**
 * GeneratorSettingsType is the type of settings that the user can set for the generator.
 */
export type GeneratorSettingsType = {
  dataCount: number;
  minAge: number;
  maxAge: number;
  gender: "MALE" | "FEMALE" | "BOTH";
  province: Array<string>;
  KTPData?: Array<KTPGeneratedData>;
  KTPPositionConfig?: KTPPositionConfig;
};
