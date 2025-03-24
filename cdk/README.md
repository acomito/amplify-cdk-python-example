# AWS CDK Infrastructure

This directory contains the AWS CDK infrastructure code for the project, written in TypeScript.

## Project Structure

- `lib/` - Contains the CDK stack definitions
- `bin/` - Contains the CDK app entry point
- `lambda/` - Contains Lambda function code
- `test/` - Contains infrastructure tests

## Environment Setup

The project uses environment-specific configuration files:

- `.env.dev` - Development environment configuration
- `.env.production` - Production environment configuration

## Useful Commands

- `npm run build` compile typescript to js
- `npm run watch` watch for changes and compile
- `npm run test` perform the jest unit tests
- `npx cdk deploy` deploy this stack to your default AWS account/region
- `npx cdk diff` compare deployed stack with current state
- `npx cdk synth` emits the synthesized CloudFormation template

## Development

1. Make sure you have the AWS CDK CLI installed: `npm install -g aws-cdk`
2. Install dependencies: `npm install`
3. Copy the appropriate .env file for your environment
4. Build the project: `npm run build`
5. Deploy: `npx cdk deploy`
