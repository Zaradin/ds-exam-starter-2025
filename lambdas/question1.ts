import { APIGatewayProxyHandlerV2 } from "aws-lambda";
import { DynamoDBClient } from "@aws-sdk/client-dynamodb";
import { DynamoDBDocumentClient, GetCommand, QueryCommand } from "@aws-sdk/lib-dynamodb";

const client = createDDbDocClient();

export const handler: APIGatewayProxyHandlerV2 = async (event, context) => {
  try {
    console.log("Event: ", JSON.stringify(event));
    
    const role = event.pathParameters?.role;
    const movieId = event.pathParameters?.movieId;
    const verbose = event.queryStringParameters?.verbose === 'true';

    if (!role || !movieId) {
      return {
        statusCode: 400,
        headers: {
          "content-type": "application/json",
        },
        body: JSON.stringify({ 
          error: "Missing required parameters: role and movieId" 
        }),
      };
    }
    const movieIdNum = parseInt(movieId);
    if (isNaN(movieIdNum)) {
      return {
        statusCode: 400,
        headers: {
          "content-type": "application/json",
        },
        body: JSON.stringify({ 
          error: "movieId must be a number" 
        }),
      };
    }

    if (verbose) {
      const commandOutput = await client.send(
        new QueryCommand({
          TableName: process.env.TABLE_NAME,
          KeyConditionExpression: "movieId = :movieId",
          ExpressionAttributeValues: {
            ":movieId": movieIdNum,
          },
        })
      );

      if (!commandOutput.Items || commandOutput.Items.length === 0) {
        return {
          statusCode: 404,
          headers: {
            "content-type": "application/json",
          },
          body: JSON.stringify({ 
            error: `No crew members found for movie ${movieId}` 
          }),
        };
      }

      return {
        statusCode: 200,
        headers: {
          "content-type": "application/json",
        },
        body: JSON.stringify({
          movieId: movieIdNum,
          crewCount: commandOutput.Items.length,
          crew: commandOutput.Items,
        }),
      };
    } else {
      const commandOutput = await client.send(
        new GetCommand({
          TableName: process.env.TABLE_NAME,
          Key: {
            movieId: movieIdNum,
            role: role,
          },
        })
      );

      if (!commandOutput.Item) {
        return {
          statusCode: 404,
          headers: {
            "content-type": "application/json",
          },
          body: JSON.stringify({ 
            error: `No crew member found for role '${role}' in movie ${movieId}` 
          }),
        };
      }

      return {
        statusCode: 200,
        headers: {
          "content-type": "application/json",
        },
        body: JSON.stringify(commandOutput.Item),
      };
    }
  } catch (error: any) {
    console.log(JSON.stringify(error));
    return {
      statusCode: 500,
      headers: {
        "content-type": "application/json",
      },
      body: JSON.stringify({ error: error.message }),
    };
  }
};

function createDDbDocClient() {
  const ddbClient = new DynamoDBClient({ region: process.env.REGION });
  const marshallOptions = {
    convertEmptyValues: true,
    removeUndefinedValues: true,
    convertClassInstanceToMap: true,
  };
  const unmarshallOptions = {
    wrapNumbers: false,
  };
  const translateConfig = { marshallOptions, unmarshallOptions };
  return DynamoDBDocumentClient.from(ddbClient, translateConfig);
}