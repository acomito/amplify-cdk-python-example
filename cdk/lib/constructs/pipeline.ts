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
                "cd ..",
              ],
            },
            post_build: {
              commands: [
                "docker push ${ECR_REPO_URI}:${IMAGE_TAG}",
                'printf \'{"ImageURI":"%s"}\' "${ECR_REPO_URI}:${IMAGE_TAG}" > imageDetail.json',
                "cat imageDetail.json",
              ],
            },
          },
          artifacts: {
            files: ["imageDetail.json"],
            "base-directory": ".",
            "discard-paths": false,
          },
        }),
        environment: {
          buildImage: codebuild.LinuxBuildImage.STANDARD_5_0,
          privileged: true,
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
                commands: ["npm run build"],
              },
            },
            artifacts: {
              files: ["frontend/dist/**/*"],
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
              pre_build: {
                commands: [
                  "aws --version",
                  'curl "https://awscli.amazonaws.com/awscli-exe-linux-x86_64.zip" -o "awscliv2.zip"',
                  "unzip awscliv2.zip",
                  "sudo ./aws/install --update",
                  "aws --version",
                ],
              },
              build: {
                commands: [
                  "set -e",
                  "IMAGE_URI=$(cat imageDetail.json | jq -r .ImageURI)",
                  'echo "Deploying image: ${IMAGE_URI}"',
                  "MAX_RETRIES=5",
                  "RETRY_COUNT=0",
                  'while [ "$RETRY_COUNT" -lt "$MAX_RETRIES" ]; do',
                  '  SERVICE_STATUS=$(aws apprunner describe-service --service-arn ${props.appRunner.service.serviceArn} --query "Service.Status" --output text)',
                  '  if [ "$SERVICE_STATUS" = "RUNNING" ]; then',
                  `    aws apprunner update-service --service-arn ${props.appRunner.service.serviceArn} --source-configuration "ImageRepository={ImageIdentifier=\${IMAGE_URI},ImageRepositoryType=ECR,ImageConfiguration={Port=${props.config.appRunner.port}}}"`,
                  "    break",
                  "  else",
                  '    echo "Service is in $SERVICE_STATUS state. Waiting before retry..."',
                  "    sleep 30",
                  "    RETRY_COUNT=$((RETRY_COUNT+1))",
                  "  fi",
                  "done",
                  'if [ "$RETRY_COUNT" -eq "$MAX_RETRIES" ]; then',
                  '  echo "Failed to update service after $MAX_RETRIES attempts"',
                  "  exit 1",
                  "fi",
                ],
              },
            },
          }),
          environment: {
            buildImage: codebuild.LinuxBuildImage.STANDARD_5_0,
            privileged: true,
          },
        }
      );

      // Grant App Runner deployment permissions
      appRunnerDeploy.addToRolePolicy(
        new iam.PolicyStatement({
          actions: [
            "apprunner:UpdateService",
            "apprunner:StartDeployment",
            "apprunner:DescribeService",
          ],
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
          (() => {
            // Create the Amplify deploy project with a stored reference
            const amplifyDeployProject = new codebuild.PipelineProject(
              this,
              "AmplifyDeploy",
              {
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
              }
            );

            // Add Amplify deployment permissions
            amplifyDeployProject.addToRolePolicy(
              new iam.PolicyStatement({
                effect: iam.Effect.ALLOW,
                actions: ["amplify:StartJob"],
                resources: [
                  `${props.amplifyApp.app.attrArn}/branches/${props.amplifyApp.branch.branchName}/jobs/*`,
                ],
              })
            );

            return new codepipeline_actions.CodeBuildAction({
              actionName: "Deploy_Frontend",
              project: amplifyDeployProject,
              input: frontendBuildOutput,
            });
          })(),
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
