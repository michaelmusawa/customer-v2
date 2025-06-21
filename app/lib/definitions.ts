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
  errors?: { [field: string]: string[] };
  state_error?: string | null;
  message?: string | null;
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
