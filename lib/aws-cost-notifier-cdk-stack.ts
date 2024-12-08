import * as cdk from 'aws-cdk-lib';
import { Construct } from 'constructs';
import * as lambda from 'aws-cdk-lib/aws-lambda';
import * as events from 'aws-cdk-lib/aws-events';
import * as targets from 'aws-cdk-lib/aws-events-targets';
import * as iam from 'aws-cdk-lib/aws-iam';

export class AwsCostNotifierCdkStack extends cdk.Stack {
  constructor(scope: Construct, id: string, props?: cdk.StackProps) {
    super(scope, id, props);
    const fn = new lambda.Function(this, 'CostNotifierFunction', {
      runtime: lambda.Runtime.NODEJS_18_X,
      code: lambda.Code.fromAsset('lib/lambda-handler'),
      handler: 'index.handler',
      environment: {
        SLACK_WEBHOOK_URL: process.env.SLACK_WEBHOOK_URL || ''
      }
    });

    // Add Cost Explorer permission
    fn.addToRolePolicy(new iam.PolicyStatement({
      actions: ['ce:GetCostAndUsage'],
      resources: ['*']
    }));

    // Add execution rule
    const rule = new events.Rule(this, 'DailyRule', {
      schedule: events.Schedule.cron({ hour: '9', minute: '0' })
    });
    rule.addTarget(new targets.LambdaFunction(fn));
  }
}
