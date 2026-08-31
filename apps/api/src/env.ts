import { config } from "dotenv";
import { resolve } from "node:path";

config({ path: resolve(__dirname, "../../.env") });
config({ path: resolve(__dirname, "../.env") });

export type Env = {
  NODE_ENV: string;
  PORT: number;
  WEB_ORIGIN: string;
  DATABASE_URL: string;
  REDIS_URL: string;
  SESSION_SECRET: string;
  OTP_MOCK_CODE: string;
  OTP_EXPIRY_SECONDS: number;
  OTP_MAX_ATTEMPTS: number;
};

export function loadEnv(): Env {
  const PORT = Number(process.env.PORT ?? 3001);
  const DATABASE_URL = process.env.DATABASE_URL;
  if (!DATABASE_URL) {
    throw new Error("DATABASE_URL manquant");
  }
  return {
    NODE_ENV: process.env.NODE_ENV ?? "development",
    PORT,
    WEB_ORIGIN: process.env.WEB_ORIGIN ?? "http://localhost:3000",
    DATABASE_URL,
    REDIS_URL: process.env.REDIS_URL ?? "redis://127.0.0.1:6379",
    SESSION_SECRET: process.env.SESSION_SECRET ?? "dev-only-secret",
    OTP_MOCK_CODE: process.env.OTP_MOCK_CODE ?? "1234",
    OTP_EXPIRY_SECONDS: Number(process.env.OTP_EXPIRY_SECONDS ?? 90),
    OTP_MAX_ATTEMPTS: Number(process.env.OTP_MAX_ATTEMPTS ?? 5),
  };
}
