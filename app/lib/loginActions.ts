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

export type TokenCheckResult =
  | { valid: true; reason: "" }
  | { valid: false; reason: "no_token" }
  | { valid: false; reason: "not_found" }
  | { valid: false; reason: "expired"; expiredAt: Date };

export async function checkResetToken(
  token?: string
): Promise<TokenCheckResult> {
  if (!token) {
    return { valid: false, reason: "no_token" };
  }

  const { rows } = await safeQuery<{
    password_reset_expires: Date | null;
  }>(
    `
    SELECT [password_reset_expires]
    FROM [User]
    WHERE [password_reset_token] = $1
    `,
    [token]
  );

  if (rows.length === 0) {
    return { valid: false, reason: "not_found" };
  }

  const expires = rows[0].password_reset_expires;
  if (!expires || new Date(expires).getTime() < Date.now()) {
    return { valid: false, reason: "expired", expiredAt: expires! };
  }

  return { valid: true, reason: "" };
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
  const { rows } = await safeQuery<{
    id: number;
    password_reset_expires: Date;
  }>(
    `
    SELECT [id], [password_reset_expires]
    FROM [User]
    WHERE [password_reset_token] = $1
    `,
    [token]
  );

  const user = rows[0];
  if (!user || new Date(user.password_reset_expires) < new Date()) {
    return {
      state_error: "Invitation link is invalid or has expired.",
    };
  }

  // 3. Hash + save new password, clear token fields
  const hash = await bcrypt.hash(password, 12);

  await safeQuery(
    `
    UPDATE [User]
    SET [password] = $1,
        [password_reset_token] = NULL,
        [password_reset_expires] = NULL
    WHERE [id] = $2
    `,
    [hash, user.id]
  );

  // 4. Optionally revalidate or redirect
  // revalidatePath("/login");

  return {
    message: "Your password has been set! You can now log in.",
  };
}

export interface MailResult {
  success: boolean;
  message: string;
}

export async function sendMail(
  resetUrl: string,
  email: string,
  name?: string
): Promise<MailResult> {
  const { SMTP_SERVER_HOST, SMTP_SERVER_USERNAME, SMTP_SERVER_PASSWORD } =
    process.env;

  if (!SMTP_SERVER_HOST || !SMTP_SERVER_USERNAME || !SMTP_SERVER_PASSWORD) {
    return {
      success: false,
      message:
        "Mail configuration is incomplete. Please check SMTP_SERVER_HOST, SMTP_SERVER_USERNAME, and SMTP_SERVER_PASSWORD.",
    };
  }

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

  // Common styles for the button
  const buttonStyles =
    "display: inline-block; padding: 12px 24px; font-size: 16px; color: #fff; background-color: #28a745; text-decoration: none; border-radius: 4px;";

  // Build the email HTML
  const html = `
  <table width="100%" cellpadding="0" cellspacing="0" style="font-family: Arial, sans-serif; background-color: #f4f4f4; padding: 20px;">
    <tr>
      <td align="center">
        <table width="600" cellpadding="0" cellspacing="0" style="background-color: #ffffff; border-radius: 8px; overflow: hidden;">
          <!-- Header / Logo -->
          <tr>
            <td align="center" style="background-color: #006400; padding: 20px;">
              <img src="https://yourdomain.com/logo.png" alt="Customer Service App" width="120" style="display: block;" />
            </td>
          </tr>

          <!-- Body -->
          <tr>
            <td style="padding: 30px; color: #333333; line-height: 1.5;">
              <h2 style="margin-top: 0; color: #006400;">
                ${name ? `Welcome, ${name}!` : "Hello!"}
              </h2>
              <p style="margin: 16px 0;">
                ${
                  name
                    ? "Thank you for registering with Customer Service App. Please set your password to activate your account."
                    : "We received a request to reset your password for your Customer Service App account."
                }
              </p>

              <!-- Call-to-Action Button -->
              <p style="text-align: center; margin: 30px 0;">
                <a href="${resetUrl}" style="${buttonStyles}">
                  ${name ? "Set Password & Activate" : "Reset Your Password"}
                </a>
              </p>

              <p style="font-size: 12px; color: #555555; margin: 16px 0;">
                This link will expire in <strong>24 hours</strong>. If you didn’t ${
                  name ? "register" : "request a password reset"
                }, you can safely ignore this email.
              </p>
            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td style="background-color: #f4f4f4; padding: 20px; text-align: center; font-size: 12px; color: #777777;">
              <p style="margin: 0;">Customer Service App</p>
              <p style="margin: 4px 0;">3075 CityHall Way, Nairobi, Kenya</p>
              <p style="margin: 4px 0;">&copy; ${new Date().getFullYear()} Smart Nairobi</p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
  `;

  const mailOptions = {
    from: `"Customer Service App" <no-reply@customerservice.go.ke>`,
    to: email,
    subject: name
      ? "Activate your Customer Service App account"
      : "Reset your password",
    html,
  };

  try {
    await transporter.sendMail(mailOptions);
    return {
      success: true,
      message: "Email sent successfully.",
    };
  } catch (error) {
    console.error("Failed to send email:", error);
    const errMsg =
      error instanceof Error ? error.message : "Unknown error sending email.";
    return {
      success: false,
      message: `Failed to send email: ${errMsg}`,
    };
  }
}
