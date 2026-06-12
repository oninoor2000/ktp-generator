import { z } from "zod";

export const cardTypeSchema = z.enum(["KTP", "KTA"]);
export const genderInputSchema = z.enum(["MALE", "FEMALE", "BOTH"]);
export const generatedGenderSchema = z.enum(["LAKI-LAKI", "PEREMPUAN"]);

const provinceIdSchema = z
  .string()
  .regex(/^\d{2}$/, "Province id must be a 2-digit code");

export const generatorSettingsSchema = z
  .object({
    cardType: cardTypeSchema,
    dataCount: z.number().int().min(1).max(1000),
    minAge: z.number().int().min(1).max(100),
    maxAge: z.number().int().min(1).max(100),
    gender: genderInputSchema,
    provinceIds: z.array(provinceIdSchema).min(1),
    honeypot: z.string().max(0).optional().or(z.literal("")),
    clientStartedAt: z.number().int().positive().optional(),
    turnstileToken: z.string().min(1).max(4096).optional(),
  })
  .superRefine((value, ctx) => {
    if (value.maxAge < value.minAge) {
      ctx.addIssue({
        code: "custom",
        path: ["maxAge"],
        message: "Maximum age must be greater than or equal to minimum age",
      });
    }
    if (value.cardType === "KTP" && value.minAge < 17) {
      ctx.addIssue({
        code: "custom",
        path: ["minAge"],
        message: "KTP minimum age is 17",
      });
    }
    if (value.cardType === "KTA" && value.maxAge > 16) {
      ctx.addIssue({
        code: "custom",
        path: ["maxAge"],
        message: "KTA maximum age is 16",
      });
    }
    if (value.clientStartedAt !== undefined) {
      const ageMs = Date.now() - value.clientStartedAt;
      if (ageMs > 60 * 60 * 1000) {
        ctx.addIssue({
          code: "custom",
          path: ["clientStartedAt"],
          message: "Client session started too long ago",
        });
      }
    }
  });

export type GeneratorSettingsInput = z.infer<typeof generatorSettingsSchema>;

const provinceNameSchema = z.string().min(1);
const idSchema = z.string().regex(/^\d{2,}$/);

export const regionalDataSchema = z.object({
  province: z.object({ id: idSchema, name: provinceNameSchema }),
  regency: z.object({ id: idSchema, name: provinceNameSchema }),
  district: z.object({ id: idSchema, name: provinceNameSchema }),
  village: z.object({ id: idSchema, name: provinceNameSchema }),
});

export const ktpGeneratedDataSchema = z.object({
  nik: z.string().regex(/^\d{16}$/, "NIK must be 16 digits"),
  name: z.string().min(1),
  birthPlace: z.string().min(1),
  birthDate: z.string().regex(/^\d{2}-\d{2}-\d{4}$/),
  birthDatePlace: z.string().min(1),
  gender: generatedGenderSchema,
  address: z.string().min(1),
  rt: z.string(),
  rw: z.string(),
  rtRw: z.string(),
  village: z.string().min(1),
  district: z.string().min(1),
  city: z.string().min(1),
  province: z.string().min(1),
  religion: z.string().min(1),
  maritalStatus: z.string().min(1),
  occupation: z.string().min(1),
  bloodType: z.string().min(1),
  nationality: z.literal("WNI"),
  validityPeriod: z.literal("SEUMUR HIDUP"),
});

export const ktaGeneratedDataSchema = z.object({
  nik: z.string().regex(/^\d{16}$/, "NIK must be 16 digits"),
  name: z.string().min(1),
  birthPlace: z.string().min(1),
  birthDate: z.string().regex(/^\d{2}-\d{2}-\d{4}$/),
  birthDatePlace: z.string().min(1),
  gender: generatedGenderSchema,
  address: z.string().min(1),
  rt: z.string(),
  rw: z.string(),
  rtRw: z.string(),
  village: z.string().min(1),
  district: z.string().min(1),
  city: z.string().min(1),
  province: z.string().min(1),
  religion: z.string().min(1),
  bloodType: z.string().min(1),
  nationality: z.literal("WNI"),
  validityPeriod: z.string().min(1),
  familyCertificateNumber: z.string().min(1),
  headFamilyName: z.string().min(1),
  birthCertificateNumber: z.string().min(1),
});

export const generatedRowSchema = z.union([
  ktpGeneratedDataSchema,
  ktaGeneratedDataSchema,
]);
