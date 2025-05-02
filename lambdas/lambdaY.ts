import { SNSHandler } from "aws-lambda";
import { SQSClient, SendMessageCommand } from "@aws-sdk/client-sqs";

const sqs = new SQSClient({ region: process.env.REGION });

export const handler: SNSHandler = async (event, context) => {
  try {
    console.log("LambdaY received event: ", JSON.stringify(event));
    
    for (const record of event.Records) {
      const message = JSON.parse(record.Sns.Message);
      console.log("Processing SNS message:", message);

      if (!message.email) {
        console.log("Message missing email, forwarding to Queue B");
        
        const command = new SendMessageCommand({
          QueueUrl: process.env.QUEUE_B_URL,
          MessageBody: JSON.stringify(message),
        });

        await sqs.send(command);
        console.log("forwarded to queue b");
      } else {
        console.log("Message has email");
      }
    }
  } catch (error: any) {
    console.error("error processing SNS message:", error);
    throw error;
  }
};