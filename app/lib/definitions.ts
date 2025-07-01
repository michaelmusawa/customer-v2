import { RecordInput } from "./schemas";

export interface User {
  id: number;
  name?: string | null;
  email: string;
  password?: string | null;
  role?: string | null;
  status?: string | null;
  image?: string | null;
  counter?: string | null;
  shift?: string | null;
  station?: string | null;
  createdAt: Date;
  updatedAt: Date;
}

// app/lib/types/userActionState.ts
export type UserActionState = {
  errors?: {
    userId?: string[];
    name?: string[];
    email?: string[];
    station?: string[];
    shift?: string[];
    counter?: string[];
    role?: string[];
  };
  state_error?: string | null;
  message?: string | null;
};

export type ResetPasswordActionState = {
  errors?: {
    token?: string[];
    password?: string[];
    confirmPassword?: string[];
  };
  state_error?: string | null;
  message?: string | null;
};

export type ForgotPasswordActionState = {
  errors?: {
    email?: string[];
  };
  state_error?: string | null;
  message?: string | null;
};

// Shared action‑state

export type SettingActionState = {
  errors?: Partial<Record<string, string[]>>;
  state_error?: string | null;
  message?: string | null;
};

export const initialSettingState: SettingActionState = {
  errors: {},
  state_error: null,
  message: null,
};

export type RecordActionState = {
  errors?: Partial<Record<keyof RecordInput, string[]>>;
  state_error?: string | null;
  message?: string | null;
};

// app/lib/types/profileActionState.ts
export type ProfileActionState = {
  errors?: {
    name?: string[];
    image?: string[];
    password?: string[];
    confirmPassword?: string[];
  };
  state_error?: string | null;
  message?: string | null;
};

// app/lib/definitions.ts
export interface ArchiveActionState {
  /** form-level errors, keyed by field */
  errors?: Partial<Record<string, string[]>>;
  /** a top-level error not tied to a field */
  state_error?: string | null;
  /** a success message */
  message?: string | null;
}

// initial state helper
export const initialUserActionState: ArchiveActionState = {
  errors: {},
  state_error: null,
  message: null,
};
