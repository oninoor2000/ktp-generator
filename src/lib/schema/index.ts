import { z } from "zod";

export const generatorFormSchema = z
  .object({
    dataCount: z
      .number()
      .min(1, { message: "Data count must be at least 1" })
      .max(1000, { message: "Data count must be less than 1000" }),
    minAge: z
      .number()
      .min(1, { message: "Minimum age must be at least 1" })
      .max(100, { message: "Minimum age must be less than 100" }),
    maxAge: z.number().min(1, { message: "Maximum age must be at least 1" }),
    gender: z.enum(["MALE", "FEMALE", "BOTH"], {
      message: "Gender must be either MALE, FEMALE, or BOTH",
    }),
    province: z.array(z.string(), { message: "Province must be selected" }),
  })
  .refine((data) => data.maxAge >= data.minAge, {
    message: "Maximum age must be greater than or equal to minimum age",
    path: ["maxAge"],
  });

export type GeneratorFormSchemaType = z.infer<typeof generatorFormSchema>;
