export type CardType = "KTP" | "KTA";
export type GenderInput = "MALE" | "FEMALE" | "BOTH";
export type GeneratedGender = "LAKI-LAKI" | "PEREMPUAN";

export type TextAlign = "left" | "center" | "right";

export interface TextPosition {
  /** Relative X position in 0-100% of template width. */
  x: number;
  /** Relative Y position in 0-100% of template height. */
  y: number;
  align: TextAlign;
}

export interface TextStyle {
  fontSize: number;
  fontWeight: "normal" | "bold";
  fontFamily: string;
  color: string;
}

export interface FieldConfig {
  position: TextPosition;
  style: TextStyle;
  enabled: boolean;
}

export interface GeneratorSettings {
  cardType: CardType;
  dataCount: number;
  minAge: number;
  maxAge: number;
  gender: GenderInput;
  provinceIds: string[];
  honeypot?: string;
  clientStartedAt?: number;
  turnstileToken?: string;
}

export interface RegionalData {
  province: { id: string; name: string };
  regency: { id: string; name: string };
  district: { id: string; name: string };
  village: { id: string; name: string };
}

export interface KTPGeneratedData {
  nik: string;
  name: string;
  birthPlace: string;
  birthDate: string;
  birthDatePlace: string;
  gender: GeneratedGender;
  address: string;
  rt: string;
  rw: string;
  rtRw: string;
  village: string;
  district: string;
  city: string;
  province: string;
  religion: string;
  maritalStatus: string;
  occupation: string;
  bloodType: string;
  nationality: "WNI";
  validityPeriod: "SEUMUR HIDUP";
}

export interface KTAGeneratedData
  extends Omit<
    KTPGeneratedData,
    "maritalStatus" | "occupation" | "validityPeriod"
  > {
  validityPeriod: string;
  familyCertificateNumber: string;
  headFamilyName: string;
  birthCertificateNumber: string;
}

export type GeneratedRow = KTPGeneratedData | KTAGeneratedData;

export interface KTPPositionConfig {
  province: FieldConfig;
  city: FieldConfig;
  nik: FieldConfig;
  name: FieldConfig;
  birthDatePlace: FieldConfig;
  gender: FieldConfig;
  address: FieldConfig;
  rtRw: FieldConfig;
  village: FieldConfig;
  district: FieldConfig;
  religion: FieldConfig;
  maritalStatus: FieldConfig;
  occupation: FieldConfig;
  bloodType: FieldConfig;
  nationality: FieldConfig;
  validUntil: FieldConfig;
}

export interface KTAPositionConfig {
  province: FieldConfig;
  city: FieldConfig;
  nik: FieldConfig;
  name: FieldConfig;
  birthDatePlace: FieldConfig;
  gender: FieldConfig;
  address: FieldConfig;
  rtRw: FieldConfig;
  village: FieldConfig;
  district: FieldConfig;
  religion: FieldConfig;
  bloodType: FieldConfig;
  nationality: FieldConfig;
  validityPeriod: FieldConfig;
  familyCertificateNumber: FieldConfig;
  headFamilyName: FieldConfig;
  birthCertificateNumber: FieldConfig;
}
