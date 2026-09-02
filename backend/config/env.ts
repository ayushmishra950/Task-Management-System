import dotenv from "dotenv";
import path from "path";

dotenv.config({ path: path.resolve(process.cwd(), ".env") });

interface EnvConfig {
  MONGO_URI: string;
  PORT: number;
  NODE_ENV: "development" | "production" | "test";
  ACCESS_TOKEN_SECRET: string;
  REFRESH_TOKEN_SECRET: string;
  PRODUCTION_FRONTEND_URL: string;
  ACCESS_TOKEN_SECRET_EXPIRE: string;
  REFRESH_TOKEN_SECRET_EXPIRE: string;
  CLOUDINARY_CLOUD_NAME: string;
  CLOUDINARY_API_KEY: string;
  CLOUDINARY_API_SECRET: string;
}
const getSanitizedConfig = (): EnvConfig => {
  const {
    MONGO_URI,
    PORT,
    CLOUDINARY_CLOUD_NAME,
    CLOUDINARY_API_KEY,
    CLOUDINARY_API_SECRET,
    NODE_ENV,
    REFRESH_TOKEN_SECRET,
    ACCESS_TOKEN_SECRET_EXPIRE,
    REFRESH_TOKEN_SECRET_EXPIRE,
    ACCESS_TOKEN_SECRET,
    PRODUCTION_FRONTEND_URL,
  } = process.env;
  if (!MONGO_URI) {
    throw new Error("❌ Error: MONGO_URI is missing in your .env file!");
  }

  if (!ACCESS_TOKEN_SECRET) {
    throw new Error(
      "❌ Error: ACCESS_TOKEN_SECRET is missing in your .env file!",
    );
  }
  if (!REFRESH_TOKEN_SECRET) {
    throw new Error(
      "❌ Error: REFRESH_TOKEN_SECRET is missing in your .env file!",
    );
  }

  if (!ACCESS_TOKEN_SECRET_EXPIRE) {
    throw new Error(
      "❌ Error: ACCESS_TOKEN_SECRET_EXPIRE is missing in your .env file!",
    );
  }
  if (!REFRESH_TOKEN_SECRET_EXPIRE) {
    throw new Error(
      "❌ Error: REFRESH_TOKEN_SECRET_EXPIRE is missing in your .env file!",
    );
  }

  if (!PRODUCTION_FRONTEND_URL) {
    throw new Error(
      "❌ Error: PRODUCTION_FRONTEND_URL is missing in your .env file!",
    );
  }

  if (!CLOUDINARY_CLOUD_NAME) {
    throw new Error(
      "❌ Error: CLOUDINARY_CLOUD_NAME is missing in your .env file!",
    );
  }
  if (!CLOUDINARY_API_KEY) {
    throw new Error(
      "❌ Error: CLOUDINARY_API_KEY is missing in your .env file!",
    );
  }

  if (!CLOUDINARY_API_SECRET) {
    throw new Error(
      "❌ Error: CLOUDINARY_API_SECRET is missing in your .env file!",
    );
  }

  return {
    CLOUDINARY_CLOUD_NAME,
    CLOUDINARY_API_KEY,
    CLOUDINARY_API_SECRET,
    PRODUCTION_FRONTEND_URL,
    ACCESS_TOKEN_SECRET,
    REFRESH_TOKEN_SECRET,
    ACCESS_TOKEN_SECRET_EXPIRE,
    REFRESH_TOKEN_SECRET_EXPIRE,
    MONGO_URI,
    PORT: PORT ? Number(PORT) : 5000,
    NODE_ENV: (NODE_ENV as EnvConfig["NODE_ENV"]) || "development",
  };
};
const env = getSanitizedConfig();
export default env;
