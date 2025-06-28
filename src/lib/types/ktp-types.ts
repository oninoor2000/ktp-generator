import type { FieldConfig } from ".";

/**
 * KTP Generated Data
 */
export type KTPGeneratedData = {
  nik: string;
  name: string;
  birthPlace: string;
  birthDate: string;
  birthDatePlace: string;
  gender: string;
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
  nationality?: string;
  validityPeriod?: string;
};

/**
 * KTP Positon Configuration
 */
export interface KTPPositionConfig {
  // Header fields (center aligned)
  province: FieldConfig;
  city: FieldConfig;

  // Main data fields (left aligned)
  nik: FieldConfig;
  name: FieldConfig;
  birthDatePlace: FieldConfig; // Combined field
  gender: FieldConfig;
  address: FieldConfig;
  rtRw: FieldConfig; // Combined field
  village: FieldConfig;
  district: FieldConfig;
  religion: FieldConfig;
  maritalStatus: FieldConfig;
  occupation: FieldConfig;
  bloodType: FieldConfig;

  // Additional fields
  nationality: FieldConfig;
  validUntil: FieldConfig;
}
