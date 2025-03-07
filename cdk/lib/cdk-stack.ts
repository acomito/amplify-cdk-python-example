import * as cdk from "aws-cdk-lib";
import { Construct } from "constructs";
import { ConfigLoader } from "./config/config-loader";
import { AmplifyApp } from "./constructs/amplify";
import { AppRunnerService } from "./constructs/app-runner";
import { Pipeline } from "./constructs/pipeline";
import { CognitoAuth } from "./constructs/cognito";
import * as ecr_assets from "aws-cdk-lib/aws-ecr-assets";
import * as path from "path";

export class CdkStack extends cdk.Stack {
  constructor(scope: Construct, id: string, props?: cdk.StackProps) {
    super(scope, id, props);

    try {
      // Load configuration
      const config = ConfigLoader.getInstance().getConfig();

      // Create Cognito authentication
      const cognitoAuth = new CognitoAuth(this, "Authentication", {
        config,
      });

      // Build Docker image using CDK assets
      const dockerImage = new ecr_assets.DockerImageAsset(
        this,
        "BackendImage",
        {
          directory: path.join(__dirname, "../../backend"),
          platform: ecr_assets.Platform.LINUX_AMD64,
        }
      );

      // Create App Runner service for backend
      const appRunner = new AppRunnerService(this, "BackendService", {
        config,
        ecrRepository: dockerImage.repository,
        imageTag: dockerImage.imageTag,
        environmentVariables: {
          COGNITO_USER_POOL_ID: cognitoAuth.userPool.userPoolId,
          COGNITO_CLIENT_ID: cognitoAuth.userPoolClient.userPoolClientId,
          COGNITO_REGION: this.region,
        },
      });

      // Create Amplify app for frontend
      const amplifyApp = new AmplifyApp(this, "FrontendApp", {
        config,
        appRunnerUrl: appRunner.service.serviceUrl,
        environmentVariables: {
          VITE_COGNITO_USER_POOL_ID: cognitoAuth.userPool.userPoolId,
          VITE_COGNITO_CLIENT_ID: cognitoAuth.userPoolClient.userPoolClientId,
          VITE_COGNITO_REGION: this.region,
          VITE_COGNITO_DOMAIN: `${config.env.APP_NAME}-${config.env.ENVIRONMENT}.auth.${this.region}.amazoncognito.com`,
        },
      });

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
