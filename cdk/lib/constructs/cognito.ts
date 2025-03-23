import * as cdk from "aws-cdk-lib";
import * as cognito from "aws-cdk-lib/aws-cognito";
import * as lambda from "aws-cdk-lib/aws-lambda";
import { Construct } from "constructs";
import { StackConfig } from "../config/types";

export interface CognitoAuthProps {
  config: StackConfig;
  usersTable: cdk.aws_dynamodb.Table;
}

export class CognitoAuth extends Construct {
  public readonly userPool: cognito.UserPool;
  public readonly userPoolClient: cognito.UserPoolClient;

  constructor(scope: Construct, id: string, props: CognitoAuthProps) {
    super(scope, id);

    try {
      // Create Lambda for email validation
      const emailValidationLambda = new lambda.Function(
        this,
        "EmailValidationFunction",
        {
          runtime: lambda.Runtime.PYTHON_3_11,
          handler: "validate_email.handler",
          code: lambda.Code.fromAsset("lambda/auth"),
          environment: {
            APP_ENV: props.config.env.ENVIRONMENT,
          },
        }
      );

      // Create Lambda for post-signup user creation
      const createUserLambda = new lambda.Function(this, "CreateUserFunction", {
        runtime: lambda.Runtime.PYTHON_3_11,
        handler: "create_user.handler",
        code: lambda.Code.fromAsset("lambda/auth"),
        environment: {
          DYNAMODB_USERS_TABLE: props.usersTable.tableName,
        },
      });

      // Grant DynamoDB permissions to the create user Lambda
      props.usersTable.grantWriteData(createUserLambda);

      // Create User Pool
      this.userPool = new cognito.UserPool(this, "UserPool", {
        userPoolName: `${props.config.env.APP_NAME}-${props.config.env.ENVIRONMENT}-user-pool`,
        selfSignUpEnabled: true,
        signInAliases: {
          email: true,
        },
        standardAttributes: {
          email: {
            required: true,
            mutable: true,
          },
        },
        passwordPolicy: {
          minLength: 8,
          requireLowercase: true,
          requireUppercase: true,
          requireDigits: true,
          requireSymbols: true,
        },
        accountRecovery: cognito.AccountRecovery.EMAIL_ONLY,
        removalPolicy:
          props.config.env.ENVIRONMENT === "production"
            ? cdk.RemovalPolicy.RETAIN
            : cdk.RemovalPolicy.DESTROY,
        lambdaTriggers: {
          preSignUp: emailValidationLambda,
          postConfirmation: createUserLambda,
        },
      });

      // Create the client app
      this.userPoolClient = new cognito.UserPoolClient(this, "UserPoolClient", {
        userPool: this.userPool,
        authFlows: {
          adminUserPassword: true,
          userPassword: true,
          userSrp: true,
        },
        oAuth: {
          flows: {
            authorizationCodeGrant: true,
            implicitCodeGrant: true,
          },
          scopes: [
            cognito.OAuthScope.EMAIL,
            cognito.OAuthScope.OPENID,
            cognito.OAuthScope.PROFILE,
          ],
          callbackUrls: [
            "http://localhost:5173", // Local development
            `https://${props.config.env.APP_NAME}-${props.config.env.ENVIRONMENT}.amplifyapp.com`, // Amplify domain
          ],
          logoutUrls: [
            "http://localhost:5173", // Local development
            `https://${props.config.env.APP_NAME}-${props.config.env.ENVIRONMENT}.amplifyapp.com`, // Amplify domain
          ],
        },
        preventUserExistenceErrors: true,
      });

      // Add domain
      const domain = this.userPool.addDomain("CognitoDomain", {
        cognitoDomain: {
          domainPrefix: `${props.config.env.APP_NAME}-${props.config.env.ENVIRONMENT}`,
        },
      });

      // Add tags
      cdk.Tags.of(this).add("Environment", props.config.env.ENVIRONMENT);
      cdk.Tags.of(this).add("Application", props.config.env.APP_NAME);
    } catch (error) {
      throw new Error(
        `Failed to create Cognito authentication: ${
          error instanceof Error ? error.message : "Unknown error"
        }`
      );
    }
  }
}
