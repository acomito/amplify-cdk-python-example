#!/usr/bin/env node
import * as cdk from "aws-cdk-lib";
import { CdkStack } from "../lib/cdk-stack";
import * as dotenv from "dotenv";
import * as path from "path";

// Load environment variables
const envFile = process.env.ENV_FILE || ".env.development";
const envPath = path.resolve(__dirname, "..", envFile);

try {
  dotenv.config({ path: envPath });

  if (!process.env.APP_NAME || !process.env.ENVIRONMENT) {
    throw new Error(
      "Required environment variables APP_NAME and ENVIRONMENT must be set"
    );
  }

  const app = new cdk.App();
  new CdkStack(
    app,
    `${process.env.APP_NAME}-${process.env.ENVIRONMENT}-stack`,
    {
      env: {
        account: process.env.AWS_ACCOUNT,
        region: process.env.AWS_REGION,
      },
    }
  );
} catch (error) {
  console.error("Error initializing CDK app:", error);
  process.exit(1);
}
