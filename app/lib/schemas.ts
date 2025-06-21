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
    image: z.string().url("Invalid URL").optional().or(z.literal("")),
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
