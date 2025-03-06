import * as dotenv from "dotenv";
import * as path from "path";
import { StackConfig, EnvironmentConfig } from "./types";

export class ConfigLoader {
  private static instance: ConfigLoader;
  private config: StackConfig;

  private constructor() {
    try {
      const envFile = process.env.ENV_FILE || ".env";
      const envPath = path.resolve(__dirname, "..", "..", envFile);
      const result = dotenv.config({ path: envPath });

      if (result.error) {
        throw new Error(
          `Error loading environment file: ${result.error.message}`
        );
      }

      this.validateEnvironmentVariables();
      this.config = this.loadConfig();
    } catch (error) {
      throw new Error(
        `Configuration initialization failed: ${
          error instanceof Error ? error.message : "Unknown error"
        }`
      );
    }
  }

  public static getInstance(): ConfigLoader {
    if (!ConfigLoader.instance) {
      ConfigLoader.instance = new ConfigLoader();
    }
    return ConfigLoader.instance;
  }

  private validateEnvironmentVariables(): void {
    const requiredVars = [
      "GITHUB_OWNER",
      "GITHUB_REPO",
      "GITHUB_BRANCH",
      "GITHUB_TOKEN",
      "APP_NAME",
      "ENVIRONMENT",
      "APPRUNNER_GITHUBCONNECTION_ARN",
    ];

    const missingVars = requiredVars.filter((varName) => !process.env[varName]);
    if (missingVars.length > 0) {
      throw new Error(
        `Missing required environment variables: ${missingVars.join(", ")}`
      );
    }
  }

  private loadConfig(): StackConfig {
    const env: EnvironmentConfig = {
      GITHUB_OWNER: process.env.GITHUB_OWNER!,
      GITHUB_REPO: process.env.GITHUB_REPO!,
      GITHUB_BRANCH: process.env.GITHUB_BRANCH!,
      GITHUB_TOKEN: process.env.GITHUB_TOKEN!,
      APP_NAME: process.env.APP_NAME!,
      ENVIRONMENT:
        (process.env.ENVIRONMENT as "development" | "production") ||
        "development",
      APPRUNNER_GITHUBCONNECTION_ARN:
        process.env.APPRUNNER_GITHUBCONNECTION_ARN!,
    };

    return {
      env,
      appRunner: {
        cpu: 1024,
        memory: 2048,
        minSize: 1,
        maxSize: 10,
        port: 8000,
      },
      pipeline: {
        name: `${env.APP_NAME}-${env.ENVIRONMENT}-pipeline`,
        sourceArtifact: "SourceOutput",
        buildArtifact: "BuildOutput",
      },
    };
  }

  public getConfig(): StackConfig {
    return this.config;
  }
}
