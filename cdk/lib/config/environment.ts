import * as dotenv from "dotenv";
import * as path from "path";

export interface EnvironmentConfig {
  githubOwner: string;
  githubRepo: string;
  githubBranch: string;
  githubToken: string;
  appName: string;
  environment: string;
}

export function loadEnvironmentConfig(): EnvironmentConfig {
  const envFile = process.env.ENV_FILE || ".env";
  const envPath = path.resolve(process.cwd(), envFile);

  try {
    dotenv.config({ path: envPath });
  } catch (error) {
    throw new Error(`Failed to load environment file ${envPath}: ${error}`);
  }

  const requiredEnvVars = [
    "GITHUB_OWNER",
    "GITHUB_REPO",
    "GITHUB_BRANCH",
    "GITHUB_TOKEN",
    "APP_NAME",
    "ENVIRONMENT",
  ];

  const missingVars = requiredEnvVars.filter(
    (varName) => !process.env[varName]
  );
  if (missingVars.length > 0) {
    throw new Error(
      `Missing required environment variables: ${missingVars.join(", ")}`
    );
  }

  return {
    githubOwner: process.env.GITHUB_OWNER!,
    githubRepo: process.env.GITHUB_REPO!,
    githubBranch: process.env.GITHUB_BRANCH!,
    githubToken: process.env.GITHUB_TOKEN!,
    appName: process.env.APP_NAME!,
    environment: process.env.ENVIRONMENT!,
  };
}
