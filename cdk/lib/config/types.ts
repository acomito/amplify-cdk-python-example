export interface EnvironmentConfig {
  GITHUB_OWNER: string;
  GITHUB_REPO: string;
  GITHUB_BRANCH: string;
  GITHUB_TOKEN: string;
  APP_NAME: string;
  ENVIRONMENT: "development" | "production";
  APPRUNNER_GITHUBCONNECTION_ARN: string;
  DOCKERHUB_USERNAME?: string;
}

export interface AppRunnerConfig {
  cpu: number;
  memory: number;
  minSize: number;
  maxSize: number;
  port: number;
}

export interface PipelineConfig {
  name: string;
  sourceArtifact: string;
  buildArtifact: string;
}

export interface StackConfig {
  env: EnvironmentConfig;
  appRunner: AppRunnerConfig;
  pipeline: PipelineConfig;
}
