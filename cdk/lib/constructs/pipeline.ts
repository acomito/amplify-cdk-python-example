import * as cdk from "aws-cdk-lib";
import * as codepipeline from "aws-cdk-lib/aws-codepipeline";
import * as codepipeline_actions from "aws-cdk-lib/aws-codepipeline-actions";
import * as codebuild from "aws-cdk-lib/aws-codebuild";
import * as ecr from "aws-cdk-lib/aws-ecr";
import * as iam from "aws-cdk-lib/aws-iam";
import { Construct } from "constructs";
import { StackConfig } from "../config/types";
import { AmplifyApp } from "./amplify";
import { AppRunnerService } from "./app-runner";

export interface PipelineStackProps {
  config: StackConfig;
  amplifyApp: AmplifyApp;
  appRunner: AppRunnerService;
}

export class Pipeline extends Construct {
  public readonly ecrRepository: ecr.Repository;

  constructor(scope: Construct, id: string, props: PipelineStackProps) {
    super(scope, id);

    try {
      // Create ECR Repository
      this.ecrRepository = new ecr.Repository(this, "BackendRepository", {
        repositoryName: `${props.config.env.APP_NAME}-${props.config.env.ENVIRONMENT}-backend`,
        removalPolicy: cdk.RemovalPolicy.DESTROY,
        lifecycleRules: [
          {
            maxImageCount: 3,
            description: "Keep only the last 3 images",
          },
        ],
      });

      // Create artifacts
      const sourceOutput = new codepipeline.Artifact(
        props.config.pipeline.sourceArtifact
      );
      const backendBuildOutput = new codepipeline.Artifact(
        "BackendBuildOutput"
      );
      const frontendBuildOutput = new codepipeline.Artifact(
        "FrontendBuildOutput"
      );

      // Create the pipeline
      const pipeline = new codepipeline.Pipeline(this, "Pipeline", {
        pipelineName: props.config.pipeline.name,
        crossAccountKeys: false,
      });

      // Add source stage
      pipeline.addStage({
        stageName: "Source",
        actions: [
          new codepipeline_actions.GitHubSourceAction({
            actionName: "GitHub_Source",
            owner: props.config.env.GITHUB_OWNER,
            repo: props.config.env.GITHUB_REPO,
            branch: props.config.env.GITHUB_BRANCH,
            oauthToken: cdk.SecretValue.plainText(
              props.config.env.GITHUB_TOKEN
            ),
            output: sourceOutput,
            trigger: codepipeline_actions.GitHubTrigger.WEBHOOK,
          }),
        ],
      });

      // Create backend build project with Docker support
      const backendBuild = new codebuild.PipelineProject(this, "BackendBuild", {
        buildSpec: codebuild.BuildSpec.fromObject({
          version: "0.2",
          phases: {
            pre_build: {
              commands: [
                "aws ecr get-login-password --region ${AWS_DEFAULT_REGION} | docker login --username AWS --password-stdin ${ECR_REPO_URI}",
                "IMAGE_TAG=${CODEBUILD_RESOLVED_SOURCE_VERSION:-latest}",
              ],
            },
            build: {
              commands: [
                "cd backend",
                "docker build -t ${ECR_REPO_URI}:${IMAGE_TAG} .",
              ],
            },
            post_build: {
              commands: [
                "docker push ${ECR_REPO_URI}:${IMAGE_TAG}",
                "echo '{\"ImageURI\":\"'${ECR_REPO_URI}:${IMAGE_TAG}'\"}' > imageDetail.json",
              ],
            },
          },
          artifacts: {
            files: ["imageDetail.json"],
          },
        }),
        environment: {
          buildImage: codebuild.LinuxBuildImage.STANDARD_5_0,
          privileged: true, // Required for Docker builds
        },
        environmentVariables: {
          ECR_REPO_URI: {
            value: this.ecrRepository.repositoryUri,
          },
        },
      });

      // Grant ECR permissions to backend build
      this.ecrRepository.grantPullPush(backendBuild);

      // Create frontend build project
      const frontendBuild = new codebuild.PipelineProject(
        this,
        "FrontendBuild",
        {
          buildSpec: codebuild.BuildSpec.fromObject({
            version: "0.2",
            phases: {
              install: {
                "runtime-versions": {
                  nodejs: "18",
                },
                commands: ["cd frontend", "npm ci"],
              },
              build: {
                commands: ["npm run build", "npm run test"],
              },
            },
            artifacts: {
              files: ["frontend/build/**/*"],
              "base-directory": ".",
            },
          }),
          environment: {
            buildImage: codebuild.LinuxBuildImage.STANDARD_5_0,
          },
        }
      );

      // Create App Runner deployment project
      const appRunnerDeploy = new codebuild.PipelineProject(
        this,
        "AppRunnerDeploy",
        {
          buildSpec: codebuild.BuildSpec.fromObject({
            version: "0.2",
            phases: {
              build: {
                commands: [
                  "IMAGE_URI=$(cat imageDetail.json | jq -r .ImageURI)",
                  `aws apprunner start-deployment --service-arn ${props.appRunner.service.serviceArn} --source-configuration "ImageRepository={ImageIdentifier=\${IMAGE_URI},ImageRepositoryType=ECR,ImageConfiguration={Port=${props.config.appRunner.port}}}"`,
                ],
              },
            },
          }),
        }
      );

      // Grant App Runner deployment permissions
      appRunnerDeploy.addToRolePolicy(
        new iam.PolicyStatement({
          actions: ["apprunner:StartDeployment"],
          resources: [props.appRunner.service.serviceArn],
        })
      );

      // Add build stage
      pipeline.addStage({
        stageName: "Build",
        actions: [
          new codepipeline_actions.CodeBuildAction({
            actionName: "Backend_Build",
            project: backendBuild,
            input: sourceOutput,
            outputs: [backendBuildOutput],
          }),
          new codepipeline_actions.CodeBuildAction({
            actionName: "Frontend_Build",
            project: frontendBuild,
            input: sourceOutput,
            outputs: [frontendBuildOutput],
          }),
        ],
      });

      // Add deploy stage
      pipeline.addStage({
        stageName: "Deploy",
        actions: [
          new codepipeline_actions.CodeBuildAction({
            actionName: "Deploy_Backend",
            project: appRunnerDeploy,
            input: backendBuildOutput,
          }),
          new codepipeline_actions.CodeBuildAction({
            actionName: "Deploy_Frontend",
            project: new codebuild.PipelineProject(this, "AmplifyDeploy", {
              buildSpec: codebuild.BuildSpec.fromObject({
                version: "0.2",
                phases: {
                  build: {
                    commands: [
                      `aws amplify start-job --app-id ${props.amplifyApp.app.attrAppId} --branch-name ${props.amplifyApp.branch.branchName} --job-type RELEASE`,
                    ],
                  },
                },
              }),
            }),
            input: frontendBuildOutput,
          }),
        ],
      });

      // Add tags
      cdk.Tags.of(this).add("Environment", props.config.env.ENVIRONMENT);
      cdk.Tags.of(this).add("Application", props.config.env.APP_NAME);
    } catch (error) {
      throw new Error(
        `Failed to create pipeline: ${
          error instanceof Error ? error.message : "Unknown error"
        }`
      );
    }
  }
}
