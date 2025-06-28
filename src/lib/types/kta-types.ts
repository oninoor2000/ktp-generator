import type { FieldConfig } from ".";

/**
 * KTA Generated Data
 */
export type KTAGeneratedData = {
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
  bloodType: string;
  nationality?: string;
  validityPeriod: string;

  // Additional data for KTA that differ from KTP
  familyCertificateNumber: string;
  headFamilyName: string;
  birthCertificateNumber: string;
};

/**
 * KTA Position Configuration
 */
export type KTAPositionConfig = {
  nik: FieldConfig;
  name: FieldConfig;
  birthDatePlace: FieldConfig;
  gender: FieldConfig;
  address: FieldConfig;
  rtRw: FieldConfig;
  village: FieldConfig;
  district: FieldConfig;
  city: FieldConfig;
  province: FieldConfig;
  religion: FieldConfig;
  bloodType: FieldConfig;
  nationality?: FieldConfig;
  validityPeriod: FieldConfig;

  // Additional data for KTA that differ from KTP
  familyCertificateNumber: FieldConfig;
  headFamilyName: FieldConfig;
  birthCertificateNumber: FieldConfig;
};
