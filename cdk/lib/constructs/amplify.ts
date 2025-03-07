import * as cdk from "aws-cdk-lib";
import * as amplify from "aws-cdk-lib/aws-amplify";
import { Construct } from "constructs";
import { StackConfig } from "../config/types";

export interface AmplifyAppProps {
  config: StackConfig;
  appRunnerUrl: string;
  environmentVariables?: { [key: string]: string };
}

export class AmplifyApp extends Construct {
  public readonly app: amplify.CfnApp;
  public readonly branch: amplify.CfnBranch;

  constructor(scope: Construct, id: string, props: AmplifyAppProps) {
    super(scope, id);

    try {
      // Create the Amplify application
      this.app = new amplify.CfnApp(this, "Frontend", {
        name: `${props.config.env.APP_NAME}-${props.config.env.ENVIRONMENT}-frontend`,
        repository: `https://github.com/${props.config.env.GITHUB_OWNER}/${props.config.env.GITHUB_REPO}`,
        accessToken: props.config.env.GITHUB_TOKEN,
        buildSpec: "amplify.yml",
        customRules: [
          {
            source:
              "</^[^.]+$|\\.(?!(css|gif|ico|jpg|js|png|txt|svg|woff|woff2|ttf|map|json)$)([^.]+$)/>",
            target: "/index.html",
            status: "200",
          },
        ],
        environmentVariables: [
          {
            name: "ENVIRONMENT",
            value: props.config.env.ENVIRONMENT,
          },
          {
            name: "VITE_API_URL",
            value: props.appRunnerUrl,
          },
          {
            name: "_LIVE_UPDATES",
            value: JSON.stringify([
              {
                pkg: "node",
                type: "nvm",
                version: "18",
              },
            ]),
          },
          ...(props.environmentVariables
            ? Object.entries(props.environmentVariables).map(
                ([name, value]) => ({
                  name,
                  value,
                })
              )
            : []),
        ],
      });

      // Create the branch configuration
      this.branch = new amplify.CfnBranch(this, "MainBranch", {
        appId: this.app.attrAppId,
        branchName: props.config.env.GITHUB_BRANCH,
        enableAutoBuild: false,
        environmentVariables: [
          {
            name: "ENVIRONMENT",
            value: props.config.env.ENVIRONMENT,
          },
          ...(props.environmentVariables
            ? Object.entries(props.environmentVariables).map(
                ([name, value]) => ({
                  name,
                  value,
                })
              )
            : []),
        ],
      });

      // Add tags
      cdk.Tags.of(this).add("Environment", props.config.env.ENVIRONMENT);
      cdk.Tags.of(this).add("Application", props.config.env.APP_NAME);
    } catch (error) {
      throw new Error(
        `Failed to create Amplify application: ${
          error instanceof Error ? error.message : "Unknown error"
        }`
      );
    }
  }
}
