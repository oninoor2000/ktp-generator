import type { KTPPositionConfig, KTAPositionConfig } from "./types";

const BOLD = {
  fontSize: 14,
  fontWeight: "bold" as const,
  fontFamily: "Arial",
  color: "#000000",
};

const BOLD_LARGE = {
  fontSize: 18,
  fontWeight: "bold" as const,
  fontFamily: "Arial",
  color: "#000000",
};

const field = (x: number, y: number, align: "left" | "center" | "right" = "left") => ({
  position: { x, y, align },
  style: BOLD,
  enabled: true,
});

const headerField = (x: number, y: number) => ({
  position: { x, y, align: "center" as const },
  style: BOLD_LARGE,
  enabled: true,
});

export const DEFAULT_KTP_POSITION_CONFIG: KTPPositionConfig = {
  province: headerField(50, 6.167),
  city: headerField(50, 12.072),
  nik: { position: { x: 26.923, y: 24.87, align: "left" }, style: BOLD_LARGE, enabled: true },
  name: field(29.606, 30.491),
  birthDatePlace: field(29.677, 35.015),
  gender: field(29.677, 39.283),
  address: field(29.677, 43.795),
  rtRw: field(29.677, 48.185),
  village: field(29.677, 52.698),
  district: field(29.677, 56.844),
  religion: field(29.677, 61.112),
  maritalStatus: field(29.677, 65.503),
  occupation: field(29.677, 70.137),
  bloodType: field(63.46, 39.302),
  nationality: field(29.677, 74.284),
  validUntil: field(29.677, 78.552),
};

export const DEFAULT_KTA_POSITION_CONFIG: KTAPositionConfig = {
  province: headerField(50, 10.313),
  city: headerField(50, 15.976),
  nik: { position: { x: 33.386, y: 21.942, align: "left" }, style: BOLD_LARGE, enabled: true },
  name: field(33.451, 27.32),
  birthDatePlace: field(33.451, 32.443),
  gender: field(33.451, 37.078),
  familyCertificateNumber: field(33.451, 42.199),
  headFamilyName: field(33.451, 46.835),
  birthCertificateNumber: field(33.451, 51.712),
  religion: field(33.451, 56.592),
  nationality: field(33.451, 61.713),
  address: field(33.451, 66.347),
  rtRw: field(33.451, 71.227),
  village: field(33.451, 76),
  district: field(33.451, 80.744),
  validityPeriod: field(33.451, 86.841),
  bloodType: field(64.076, 37.106),
};
