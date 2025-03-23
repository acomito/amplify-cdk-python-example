import * as cdk from "aws-cdk-lib";
import * as dynamodb from "aws-cdk-lib/aws-dynamodb";
import { Construct } from "constructs";
import { StackConfig } from "../config/types";

interface TableIndex {
  indexName: string;
  partitionKey: string;
  partitionKeyType?: dynamodb.AttributeType;
  sortKey?: string;
  sortKeyType?: dynamodb.AttributeType;
}

interface TableDefinition {
  name: string;
  envSuffix: string;
  partitionKey: string;
  partitionKeyType?: dynamodb.AttributeType;
  sortKey?: string;
  sortKeyType?: dynamodb.AttributeType;
  indexes?: TableIndex[];
}

export interface DynamoDBProps {
  config: StackConfig;
}

export class DynamoDBConstruct extends Construct {
  private readonly tables: { [key: string]: dynamodb.Table } = {};
  private readonly tableDefinitions: TableDefinition[] = [
    {
      name: "users",
      envSuffix: "users",
      partitionKey: "id",
      indexes: [
        {
          indexName: "email-index",
          partitionKey: "email",
        },
      ],
    },
    {
      name: "sites",
      envSuffix: "sites",
      partitionKey: "id",
      indexes: [
        {
          indexName: "name-index",
          partitionKey: "name",
        },
      ],
    },
    {
      name: "customers",
      envSuffix: "customers",
      partitionKey: "id",
      indexes: [
        {
          indexName: "name-index",
          partitionKey: "name",
        },
      ],
    },
  ];

  constructor(scope: Construct, id: string, props: DynamoDBProps) {
    super(scope, id);

    try {
      const removalPolicy =
        props.config.env.ENVIRONMENT === "production"
          ? cdk.RemovalPolicy.RETAIN
          : cdk.RemovalPolicy.DESTROY;

      const pointInTimeRecovery = props.config.env.ENVIRONMENT === "production";

      // Create tables based on definitions
      this.tableDefinitions.forEach((tableDef) => {
        const table = new dynamodb.Table(this, `${tableDef.name}Table`, {
          tableName: `${props.config.env.APP_NAME}-${props.config.env.ENVIRONMENT}-${tableDef.envSuffix}`,
          partitionKey: {
            name: tableDef.partitionKey,
            type: tableDef.partitionKeyType || dynamodb.AttributeType.STRING,
          },
          ...(tableDef.sortKey && {
            sortKey: {
              name: tableDef.sortKey,
              type: tableDef.sortKeyType || dynamodb.AttributeType.STRING,
            },
          }),
          billingMode: dynamodb.BillingMode.PAY_PER_REQUEST, // @TODO: may want to change this to Provisioned
          removalPolicy,
          pointInTimeRecovery,
        });

        // Add indexes if defined
        tableDef.indexes?.forEach((index) => {
          table.addGlobalSecondaryIndex({
            indexName: index.indexName,
            partitionKey: {
              name: index.partitionKey,
              type: index.partitionKeyType || dynamodb.AttributeType.STRING,
            },
            ...(index.sortKey && {
              sortKey: {
                name: index.sortKey,
                type: index.sortKeyType || dynamodb.AttributeType.STRING,
              },
            }),
            projectionType: dynamodb.ProjectionType.ALL,
          });
        });

        // Add tags
        cdk.Tags.of(table).add("Environment", props.config.env.ENVIRONMENT);
        cdk.Tags.of(table).add("Application", props.config.env.APP_NAME);

        // Store table reference
        this.tables[tableDef.name] = table;
      });
    } catch (error) {
      throw new Error(
        `Failed to create DynamoDB tables: ${
          error instanceof Error ? error.message : "Unknown error"
        }`
      );
    }
  }

  // Getter methods for tables
  public getTable(name: string): dynamodb.Table {
    const table = this.tables[name];
    if (!table) {
      throw new Error(`Table ${name} not found`);
    }
    return table;
  }

  // Convenience getters for existing tables
  public get usersTable(): dynamodb.Table {
    return this.getTable("users");
  }

  public get sitesTable(): dynamodb.Table {
    return this.getTable("sites");
  }

  public get customersTable(): dynamodb.Table {
    return this.getTable("customers");
  }
}
