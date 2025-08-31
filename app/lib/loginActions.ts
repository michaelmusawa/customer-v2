// app/lib/loginActions.ts
"use server";

import { signIn } from "@/auth";
import { AuthError } from "next-auth";
import { redirect } from "next/navigation";
import bcrypt from "bcryptjs";
import { safeQuery, DatabaseError } from "./db";
import {
  ForgotPasswordActionState,
  ResetPasswordActionState,
} from "./definitions";
import { ForgotPasswordSchema, ResetPasswordSchema } from "./schemas";
import { randomBytes } from "crypto";
import nodemailer from "nodemailer";

export interface User {
  id: number;
  email: string;
  password: string;
  role?: string;
  station?: string;
  stationId?: number;
  counter?: string;
  counterId?: number;
  shift: string;
  shiftId: number;
  image?: string;
  name?: string;
  createdAt?: Date;
  status?: string;
}

export async function getUser(email: string): Promise<User | undefined> {
  try {
    const sql = `
      SELECT TOP 1
        u.id,
        u.name,
        u.email,
        u.password,
        u.role,
        u.stationId,
        u.shiftId,
        u.counterId,
        u.image,
        u.createdAt,
        u.status,
        st.name AS station,
        sh.name AS shift,
        c.name AS counter
      FROM [User] u
      LEFT JOIN stations st ON u.stationId = st.id
      LEFT JOIN shifts sh ON u.shiftId = sh.id
      LEFT JOIN counters c ON u.counterId = c.id
      WHERE u.email = @p1`;

    const { rows } = await safeQuery<User>(sql, [email]);
    return rows[0];
  } catch (error) {
    if (error instanceof DatabaseError) throw error;
    console.error("Failed to fetch user:", error);
    throw error;
  }
}

export async function authenticate(_state: unknown, formData: FormData) {
  try {
    const email = String(formData.get("email"));
    const password = String(formData.get("password"));

    let user;
    try {
      user = await getUser(email);
    } catch (err) {
      if (err instanceof DatabaseError) {
        return "Our authentication service is temporarily unavailable. Please try again later.";
      }
      throw err;
    }

    if (!user) return "Invalid credentials.";

    if (!user.password) {
      return "Your account is not fully set up. Please check your email for the activation link or contact your supervisor.";
    }

    const match = await bcrypt.compare(password, user.password);
    if (!match) return "Invalid credentials.";
    if (user.status === "archived") {
      return "Your account is disabled! Contact your supervisor for activation.";
    }

    // To be fixed later

    // Upto here

    const res = await signIn("credentials", {
      email,
      password,
      redirect: false,
    });
    if (!res.error) redirect("/dashboard");
  } catch (error) {
    if (error instanceof AuthError) {
      return error.type === "CredentialsSignin"
        ? "Invalid credentials."
        : "Something went wrong.";
    }
    throw error;
  }
}

export async function forgetPassword(
  _prev: ForgotPasswordActionState,
  formData: FormData
): Promise<ForgotPasswordActionState> {
  const parsed = ForgotPasswordSchema.safeParse({
    email: formData.get("email"),
  });

  if (!parsed.success) {
    return {
      errors: parsed.error.flatten().fieldErrors,
      message: "Please fix the errors below.",
    };
  }

  const { email } = parsed.data;

  try {
    // Look up user
    const sqlLookup = `SELECT TOP 1 id FROM [User] WHERE email = @p1`;
    const { rows } = await safeQuery<{ id: number }>(sqlLookup, [email]);

    if (rows.length === 0) {
      return {
        message: "If that email is registered, you’ll receive a reset link.",
      };
    }

    const token = randomBytes(32).toString("hex");
    const expires = new Date(Date.now() + 24 * 3600 * 1000);

    // Store reset token + expiry
    const sqlStore = `
      UPDATE [User]
      SET password_reset_token = @p1,
          password_reset_expires = @p2
      WHERE id = @p3`;
    await safeQuery(sqlStore, [token, expires, rows[0].id]);

    // Send email
    const resetUrl = `${process.env.NEXT_PUBLIC_BASE_URL}/reset-password?token=${token}`;
    await sendMail(resetUrl, email);

    return {
      message: "If that email is registered, you’ll receive a reset link.",
    };
  } catch (err) {
    console.error("Error in forgetPassword:", err);
    return { state_error: "Something went wrong. Please try again later." };
  }
}

export default async function resetPasswordHandler(
  _prev: ResetPasswordActionState,
  formData: FormData
): Promise<ResetPasswordActionState> {
  const parsed = ResetPasswordSchema.safeParse({
    token: formData.get("token"),
    password: formData.get("password"),
    confirmPassword: formData.get("confirmPassword"),
  });

  if (!parsed.success) {
    return {
      errors: parsed.error.flatten().fieldErrors,
      message: "Please fix the errors below.",
    };
  }

  const { token, password } = parsed.data;

  // Lookup user by reset token
  const sqlLookup = `
    SELECT TOP 1 id, password_reset_expires AS expires
    FROM [User]
    WHERE password_reset_token = @p1`;

  const { rows } = await safeQuery<{ id: number; expires: Date }>(sqlLookup, [
    token,
  ]);
  const user = rows[0];

  if (!user || new Date(user.expires) < new Date()) {
    return { state_error: "Reset link is invalid or has expired." };
  }

  // Hash and update password
  const hash = await bcrypt.hash(password, 12);
  const sqlUpdate = `
    UPDATE [User]
    SET password = @p1,
        password_reset_token = NULL,
        password_reset_expires = NULL
    WHERE id = @p2`;

  await safeQuery(sqlUpdate, [hash, user.id]);

  return { message: "Your password has been set! You can now log in." };
}

export async function sendMail(resetUrl: string, email: string, name?: string) {
  const transporter = nodemailer.createTransport({
    service: "gmail",
    host: process.env.SMTP_SERVER_HOST,
    port: 587,
    secure: true,
    auth: {
      user: process.env.SMTP_SERVER_USERNAME,
      pass: process.env.SMTP_SERVER_PASSWORD,
    },
  });

  const mailOptions = {
    from: `"Customer Service App" <no-reply@customerservice.go.ke>`,
    to: email,
    subject: name ? "Activate your account" : "Reset your password",
    html: name
      ? `<p>Hi ${name},</p><p>Please <a href="${resetUrl}">click here</a> to set your password and activate your account. This link expires in 24 hours.</p>`
      : `<p>Hello,</p><p>Please <a href="${resetUrl}">click here</a> to reset your password. This link expires in 24 hours.</p>`,
  };

  try {
    await transporter.sendMail(mailOptions);
    console.log("Email sent.");
  } catch (error) {
    console.error("Failed to send email:", error);
    return "Failed";
  }
}
