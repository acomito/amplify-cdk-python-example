import * as cdk from "aws-cdk-lib";
import * as apprunner from "@aws-cdk/aws-apprunner-alpha";
import * as iam from "aws-cdk-lib/aws-iam";
import * as ecr from "aws-cdk-lib/aws-ecr";
import { Construct } from "constructs";
import { StackConfig } from "../config/types";

export interface AppRunnerServiceProps {
  config: StackConfig;
  ecrRepository: ecr.IRepository;
  imageTag?: string;
  environmentVariables?: { [key: string]: string };
}

export class AppRunnerService extends Construct {
  public readonly service: apprunner.Service;

  constructor(scope: Construct, id: string, props: AppRunnerServiceProps) {
    super(scope, id);

    try {
      // Create IAM role for App Runner
      const serviceRole = new iam.Role(this, "AppRunnerServiceRole", {
        assumedBy: new iam.ServicePrincipal("tasks.apprunner.amazonaws.com"),
      });

      serviceRole.addManagedPolicy(
        iam.ManagedPolicy.fromAwsManagedPolicyName(
          "service-role/AWSAppRunnerServicePolicyForECRAccess"
        )
      );

      // Create ECR access role
      const accessRole = new iam.Role(this, "AppRunnerECRAccessRole", {
        assumedBy: new iam.ServicePrincipal("build.apprunner.amazonaws.com"),
      });

      accessRole.addManagedPolicy(
        iam.ManagedPolicy.fromAwsManagedPolicyName(
          "service-role/AWSAppRunnerServicePolicyForECRAccess"
        )
      );

      // Create shortened service name
      const serviceName =
        `${props.config.env.APP_NAME}-${props.config.env.ENVIRONMENT}`.substring(
          0,
          35
        ) + "-api";

      // Create the App Runner service
      this.service = new apprunner.Service(this, "BackendService", {
        serviceName,
        source: apprunner.Source.fromEcr({
          imageConfiguration: {
            port: props.config.appRunner.port,
            environmentVariables: {
              ENVIRONMENT: props.config.env.ENVIRONMENT,
              PORT: props.config.appRunner.port.toString(),
              ...props.environmentVariables,
            },
          },
          repository: props.ecrRepository,
          tag: props.imageTag || "latest",
        }),
        vpcConnector: undefined,
        instanceRole: serviceRole,
        cpu: apprunner.Cpu.ONE_VCPU,
        memory: apprunner.Memory.TWO_GB,
        healthCheck: apprunner.HealthCheck.http({
          path: "/health",
          healthyThreshold: 2,
          unhealthyThreshold: 3,
          interval: cdk.Duration.seconds(5),
          timeout: cdk.Duration.seconds(2),
        }),
      });

      // Grant ECR pull permissions to App Runner service
      props.ecrRepository.grantPull(accessRole);

      // Add tags
      cdk.Tags.of(this).add("Environment", props.config.env.ENVIRONMENT);
      cdk.Tags.of(this).add("Application", props.config.env.APP_NAME);
    } catch (error) {
      throw new Error(
        `Failed to create App Runner service: ${
          error instanceof Error ? error.message : "Unknown error"
        }`
      );
    }
  }
}
