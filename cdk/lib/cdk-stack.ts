import * as cdk from "aws-cdk-lib";
import { Construct } from "constructs";
import { ConfigLoader } from "./config/config-loader";
import { AmplifyApp } from "./constructs/amplify";
import { AppRunnerService } from "./constructs/app-runner";
import { Pipeline } from "./constructs/pipeline";
// import * as sqs from 'aws-cdk-lib/aws-sqs';

export class CdkStack extends cdk.Stack {
  constructor(scope: Construct, id: string, props?: cdk.StackProps) {
    super(scope, id, props);

    try {
      // Load configuration
      const config = ConfigLoader.getInstance().getConfig();

      // Create App Runner service for backend
      const appRunner = new AppRunnerService(this, "BackendService", {
        config,
      });

      // Create Amplify app for frontend
      const amplifyApp = new AmplifyApp(this, "FrontendApp", {
        config,
        appRunnerUrl: appRunner.service.serviceUrl,
      });

      // Create CI/CD pipeline
      new Pipeline(this, "CICDPipeline", {
        config,
        amplifyApp,
        appRunner,
      });

      // Add stack tags
      cdk.Tags.of(this).add("Environment", config.env.ENVIRONMENT);
      cdk.Tags.of(this).add("Application", config.env.APP_NAME);
    } catch (error) {
      throw new Error(
        `Failed to create stack: ${
          error instanceof Error ? error.message : "Unknown error"
        }`
      );
    }
  }
}
