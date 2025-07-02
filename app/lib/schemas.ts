// app/lib/schemas/resetPasswordSchema.ts
import { z } from "zod";

export const ResetPasswordSchema = z
  .object({
    token: z.string().min(1, "Missing token"),
    password: z.string().min(8, "Password must be at least 8 characters"),
    confirmPassword: z.string().min(1, "Please confirm your password"),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "Passwords do not match",
    path: ["confirmPassword"],
  });

// (optional) export the inferred type for convenience
export type ResetPasswordInput = z.infer<typeof ResetPasswordSchema>;

export const ForgotPasswordSchema = z.object({
  email: z.string().email("Please enter a valid email address"),
});

export type ForgotPasswordInput = z.infer<typeof ForgotPasswordSchema>;

// Extended schema to include services
export const AddSettingSchema = z.discriminatedUnion("type", [
  z.object({
    type: z.enum(["shifts", "counters", "stations"]),
    value: z.string().min(1, "Value is required"),
  }),
  z.object({
    type: z.literal("services"),
    name: z.string().min(1, "Service name required"),
    subservices: z
      .array(z.string().min(1, "Sub‑service name required"))
      .min(1, "At least one sub‑service"),
  }),
]);

export const RecordSchema = z.object({
  ticket: z.string().min(1, "Ticket is required"),
  recordType: z.string().optional(),
  name: z.string().min(1, "Name is required"),
  service: z.string().min(1, "Service is required"),
  subService: z.string().optional(),
  recordNumber: z.string().optional(),
  value: z.coerce.number().int().nonnegative("Value must be ≥ 0"),
});

export type RecordInput = z.infer<typeof RecordSchema>;

// Zod schema with confirmPassword check
export const UpdateSchema = z
  .object({
    name: z.string().min(1, "Name is required"),
    image: z
      .any()
      .refine(
        (v) => v === undefined || v instanceof File,
        "Invalid file upload"
      )
      .optional(),
    password: z
      .string()
      .min(8, "Password must be at least 8 characters")
      .optional()
      .or(z.literal("")),
    confirmPassword: z.string().optional().or(z.literal("")),
  })
  .superRefine((data, ctx) => {
    if (data.password) {
      if (!data.confirmPassword) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: "Please confirm your new password",
          path: ["confirmPassword"],
        });
      } else if (data.password !== data.confirmPassword) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: "Passwords do not match",
          path: ["confirmPassword"],
        });
      }
    }
  });

export const UpdateSettingSchema = z.object({
  type: z.enum(["services", "shifts", "counters", "stations"]),
  id: z.preprocess((v) => Number(v), z.number().int().positive()),
  newName: z.string().min(1, "Name is required"),
});

export const DeleteSettingSchema = z.object({
  type: z.enum(["services", "shifts", "counters", "stations"]),
  id: z.preprocess((v) => Number(v), z.number().int().positive()),
});

export const UpdateSubserviceSchema = z.object({
  serviceId: z.preprocess((v) => Number(v), z.number().int().positive()),
  oldName: z.string().min(1),
  newName: z.string().min(1, "Sub-service name is required"),
});

export const DeleteSubserviceSchema = z.object({
  serviceId: z.preprocess((v) => Number(v), z.number().int().positive()),
  name: z.string().min(1),
});

export const AddSubserviceSchema = z.object({
  type: z.literal("subservice"), // discriminator
  serviceName: z.string().min(1),
  subservice: z.string().min(1, "Required"),
});
export type AddSubserviceInput = z.infer<typeof AddSubserviceSchema>;

export const ArchiveUserSchema = z.object({
  userId: z.coerce.number().int().positive(),
});

// 1. Schema for external POST payload (no `token` here)
export const ExternalRecordSchema = z.preprocess(
  (raw) => {
    // Only objects can have subservice keys
    if (raw !== null && typeof raw === "object") {
      const obj = raw as Record<string, unknown>;

      // If legacy `subservice` exists but no `subService` yet, copy it over
      if ("subservice" in obj && !("subService" in obj)) {
        obj.subService = obj.subservice;
      }

      return obj;
    }

    return raw;
  },
  z.object({
    ticket: z.string().nonempty(),
    recordType: z.string().optional(),
    name: z.string().nonempty(),
    service: z.string().nonempty(),
    subService: z.string().optional(),
    recordNumber: z.string().optional(),
    value: z.preprocess(
      (val) =>
        typeof val === "string" ? parseFloat(val.replace(/,/g, "")) : val,
      z.number().int().nonnegative()
    ),
  })
);
