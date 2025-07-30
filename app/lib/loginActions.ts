"use server";

import { signIn } from "@/auth";
import { AuthError } from "next-auth";

import { redirect } from "next/navigation";
import bcrypt from "bcryptjs";
import pool, { DatabaseError, safeQuery } from "./db";
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
    const user = await safeQuery<User>(
      `SELECT
       u.id,
       u.name,
       u.email,
       u.password,
       u.role,
       u."stationId",
       u."shiftId",
       u."counterId",
       u.image,
       u."createdAt",
       u.status,
       st.name AS station,
       sh.name AS shift,
        c.name AS counter
     FROM "User" u
     LEFT JOIN stations st
       ON u."stationId" = st.id
      LEFT JOIN shifts sh
       ON u."shiftId" = sh.id
     LEFT JOIN counters c
       ON u."counterId" = c.id
     WHERE u.email = $1
     LIMIT 1`,
      [email]
    );
    return user.rows[0];
  } catch (error) {
    if (error instanceof DatabaseError) {
      // re‑throw so the caller knows “DB is down”
      throw error;
    }
    console.error("Failed to fetch user:", error);
    throw error; // rethrow unexpected errors
  }
}

export async function authenticate(_currentState: unknown, formData: FormData) {
  try {
    const email = formData.get("email") as string;
    const password = formData.get("password") as string;

    // 1) Try to fetch the user
    let user;
    try {
      user = await getUser(email);
    } catch (err) {
      if (err instanceof DatabaseError) {
        // Surface this to the UI as errorMessage
        return "Our authentication service is temporarily unavailable. Please try again later.";
      }
      throw err;
    }

    // 2) If user not found, or password mismatch, fall through to credentials‑fail
    if (!user) {
      return "Invalid credentials.";
    }

    const match = await bcrypt.compare(password, user.password);
    if (match) {
      return "Invalid credentials.";
    } else if (user.status === "archived") {
      return "Your account is disabled! Contact you supervisor for activation";
    }

    // 3) Success!
    const res = await signIn("credentials", {
      email,
      password,
      redirect: false,
    });
    if (!res.error) {
      redirect("/dashboard");
    }
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
  prevState: ForgotPasswordActionState,
  formData: FormData
): Promise<ForgotPasswordActionState> {
  // 1. Validate input
  const parsed = ForgotPasswordSchema.safeParse({
    email: formData.get("email"),
  });

  if (!parsed.success) {
    const fieldErrors = parsed.error.flatten().fieldErrors;
    return {
      errors: fieldErrors,
      message: "Please fix the errors below.",
    };
  }

  const { email } = parsed.data;

  try {
    // 2. Look up the user
    const { rows } = await pool.query<{ id: number }>(
      `SELECT id FROM "User" WHERE email = $1`,
      [email]
    );
    if (rows.length === 0) {
      // always return OK to avoid leaking
      return {
        message: "If that email is registered, you’ll receive a reset link.",
      };
    }

    // 3. Generate token & expiry
    const token = randomBytes(32).toString("hex");
    const expires = new Date(Date.now() + 24 * 3600 * 1000);

    // 4. Store on the user record
    await pool.query(
      `UPDATE "User"
         SET "password_reset_token" = $1,
             "password_reset_expires" = $2
       WHERE id = $3`,
      [token, expires, rows[0].id]
    );

    // 5. Send reset link email
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
  prevState: ResetPasswordActionState,
  formData: FormData
): Promise<ResetPasswordActionState> {
  // 1. Parse + validate
  const parsed = ResetPasswordSchema.safeParse({
    token: formData.get("token"),
    password: formData.get("password"),
    confirmPassword: formData.get("confirmPassword"),
  });

  if (!parsed.success) {
    const fieldErrors = parsed.error.flatten().fieldErrors;
    return {
      errors: fieldErrors,
      message: "Please fix the errors below.",
    };
  }

  const { token, password } = parsed.data;

  // 2. Lookup user by token
  const { rows } = await pool.query<{
    id: number;
    resetExpires: Date;
  }>(
    `SELECT id, "password_reset_expires"
     FROM "User" 
     WHERE "password_reset_token" = $1`,
    [token]
  );
  const user = rows[0];
  if (!user || new Date(user.resetExpires) < new Date()) {
    return {
      state_error: "Invitation link is invalid or has expired.",
    };
  }

  // 3. Hash + save new password, clear token fields
  const hash = await bcrypt.hash(password, 12);
  await pool.query(
    `UPDATE "User"
       SET password = $1,
           "password_reset_token" = NULL,
           "password_reset_expires" = NULL
       WHERE id = $2`,
    [hash, user.id]
  );

  // 4. Optionally revalidate a protected page or redirect
  // revalidatePath("/login");

  return {
    message: "Your password has been set! You can now log in.",
  };
}

export async function sendMail(resetUrl: string, email: string, name?: string) {
  const SMTP_SERVER_HOST = process.env.SMTP_SERVER_HOST;
  const SMTP_SERVER_USERNAME = process.env.SMTP_SERVER_USERNAME;
  const SMTP_SERVER_PASSWORD = process.env.SMTP_SERVER_PASSWORD;
  // const SITE_MAIL_RECIEVER = process.env.SITE_MAIL_RECIEVER;

  const transporter = nodemailer.createTransport({
    service: "gmail",
    host: SMTP_SERVER_HOST,
    port: 587,
    secure: true,
    auth: {
      user: SMTP_SERVER_USERNAME,
      pass: SMTP_SERVER_PASSWORD,
    },
  });

  // Build the email options
  const mailOptions = {
    from: `"Customer Service App" <no-reply@customerservice.go.ke>`,
    to: email,
    subject: name ? "Activate your account" : "Reset your password",
    html: name
      ? `<p>Hi ${name},</p>
         <p>Please <a href="${resetUrl}">click here</a> to set your password and activate your account. This link expires in 24 hours.</p>`
      : `<p>Hello,</p>
         <p>Please <a href="${resetUrl}">click here</a> to reset your password. This link expires in 24 hours.</p>`,
  };

  // Send mail with defined transport object
  try {
    await transporter.sendMail(mailOptions);
    console.log("Email sent.");
  } catch (error) {
    console.error("Failed to send email:", error);
    return "Failed";
  }
}
