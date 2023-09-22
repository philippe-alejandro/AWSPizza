import { expect as expectCDK, haveResourceLike } from '@aws-cdk/assert';
import * as cdk from '@aws-cdk/core';
import TheStateMachine = require('../lib/the-state-machine-stack');
import { APIGatewayProxyEvent } from 'aws-lambda'; // Import the necessary types
import { handler } from '../lambda-fns/orderPizza'; // Import your Lambda handler function


test('API Gateway Proxy Created', () => {
  const app = new cdk.App();
  // WHEN
  const stack = new TheStateMachine.TheStateMachineStack(app, 'MyTestStack');
  // THEN
  expectCDK(stack).to(haveResourceLike("AWS::ApiGatewayV2::Integration", {
    "IntegrationType": "AWS_PROXY",
    "ConnectionType": "INTERNET",
    "IntegrationSubtype": "StepFunctions-StartSyncExecution",
    "PayloadFormatVersion": "1.0",
    "RequestParameters": {
        "Input": "$request.body",
        "StateMachineArn": {
        }
    },
    "TimeoutInMillis": 10000
  }
  ));
});


test('State Machine Created', () => {
  const app = new cdk.App();
  // WHEN
  const stack = new TheStateMachine.TheStateMachineStack(app, 'MyTestStack');
  // THEN
  expectCDK(stack).to(haveResourceLike("AWS::StepFunctions::StateMachine", {
    "DefinitionString": {
      "Fn::Join": [
        "",
        [
          "{\"StartAt\":\"Order Pizza Job\",\"States\":{\"Order Pizza Job\":{\"Next\":\"With Pineapple?\",\"Retry\":[{\"ErrorEquals\":[\"Lambda.ServiceException\",\"Lambda.AWSLambdaException\",\"Lambda.SdkClientException\"],\"IntervalSeconds\":2,\"MaxAttempts\":6,\"BackoffRate\":2}],\"Type\":\"Task\",\"InputPath\":\"$.flavour\",\"ResultPath\":\"$.pineappleAnalysis\",\"Resource\":\"",
          {
          },
          "\"},\"With Pineapple?\":{\"Type\":\"Choice\",\"Choices\":[{\"Variable\":\"$.pineappleAnalysis.containsPineapple\",\"BooleanEquals\":true,\"Next\":\"Sorry, We Dont add Pineapple\"}],\"Default\":\"Lets make your pizza\"},\"Lets make your pizza\":{\"Type\":\"Succeed\",\"OutputPath\":\"$.pineappleAnalysis\"},\"Sorry, We Dont add Pineapple\":{\"Type\":\"Fail\",\"Error\":\"Failed To Make Pizza\",\"Cause\":\"They asked for Pineapple\"}},\"TimeoutSeconds\":300}"
        ]
      ]
    },
    "StateMachineType": "EXPRESS",
    "TracingConfiguration": {
      "Enabled": true
    }
  }
  ));
});

test('Order Pizza Lambda Created', () => {
  const app = new cdk.App();
  // WHEN
  const stack = new TheStateMachine.TheStateMachineStack(app, 'MyTestStack');
  // THEN
  expectCDK(stack).to(haveResourceLike("AWS::Lambda::Function", {
    "Handler": "orderPizza.handler"
  }
  ));
});

//Both tests inside the 'describe' method are aimed at testing the 'Pizza Order' lambda function.
describe('Pizza Order Lambda', () => {
  // this test, checks if the lambda function executes as expected when using "{ 'flavour': 'pepperoni' }"
  // as the body of the event. 
  it('should return a successful response for a valid pizza flavor within the array of options --> pepperoni', async () => {
    // 'APIGatewayProxyEvent' is a type for defining the data structure of the 'event'.
    // event: APIGatewayProxyEvent specifies that the event variable should conform to the structure 
    // defined by APIGatewayProxyEvent.
    // 'as any' is a type assertion to indicate TypeScript no type checking should be done on this specific expression
    // It's being used to tell TypeScript that, even though you're assigning an object literal to event, you want TypeScript
    // to consider it as conforming to the APIGatewayProxyEvent type. The reason for using as any here is likely to suppress 
    // TypeScript errors related to type mismatches between your object literal and the APIGatewayProxyEvent type.
    const event: APIGatewayProxyEvent = {
      body: '{ "flavour": "pepperoni" }', 
    } as any; 
    // 'as any' is used to type-assert the empty objects passed as the second and third arguments to the handler function. 
    // This is used to avoid TypeScript type checking for these objects.
    const response = await handler(event, {} as any, {} as any) || { statusCode: -1 }; 

    expect(response.statusCode).toBe(200);

    if (response.statusCode === 200 && 'body' in response && response.body !== undefined) {
      expect(response.body).toBeDefined();
      // By adding ! after response.body, I'm telling TypeScript to treat response.body as if it's guaranteed to 
      // be defined and not null. This can be useful when I'm sure that response.body should never be null 
      // or undefined at this point in the code.
      // At this point, response.body is not null nor undefined since it already passed the 'response.body !== undefined' condition. 
      const responseBody = JSON.parse(response.body!);
      expect(responseBody.containsPineapple).toBe(false);
      expect(responseBody.pizzaStatus).toContain('Pizza is prepared');
    }
  });

  it('should return a successful response for a valid pizza flavor within the array of options --> cheese', async () => {
    const event: APIGatewayProxyEvent = {
      body: '{ "flavour": "cheese" }', 
    } as any; 
    const response = await handler(event, {} as any, {} as any) || { statusCode: -1 }; 

    expect(response.statusCode).toBe(200);

    if (response.statusCode === 200 && 'body' in response && response.body !== undefined) {
      expect(response.body).toBeDefined();
      const responseBody = JSON.parse(response.body!);
      expect(responseBody.containsPineapple).toBe(false);
      expect(responseBody.pizzaStatus).toContain('Pizza is prepared');
    }
  });

  // this test, checks if the lambda function executes as expected when using "{ 'flavour': 'hawaiian' }" or "{ 'flavour': 'pineapple' }"
  // as the body of the event. 
  it('should return an error response for an invalid request', async () => {
    const event: APIGatewayProxyEvent = {
      body: '{ "flavour": "pineapple" }', 
    } as any;

    const response = await handler(event, {} as any, {} as any) || { statusCode: -1 }; // Default value;

    expect(response.statusCode).toBe(500);

    if (response.statusCode === 500 && 'body' in response && response.body !== undefined) {
      const responseBodyPineapple = JSON.parse(response.body!);
      expect(responseBodyPineapple.containsPineapple).toBe(true);
      expect(responseBodyPineapple.pizzaStatus).toContain("Sorry, we don't add pineapple to our pizzas.");

      const responseBody = JSON.parse(response.body!);
    }
  });
});