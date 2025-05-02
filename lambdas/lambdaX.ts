import { Handler } from "aws-lambda";
import { SQSEvent } from "aws-lambda";

interface UserMessage {
  name: string;
  address: {
    street: string;
    city: string;
    country: string;
  };
  email: string;
}

export const handler: Handler = async (event: SQSEvent, context) => {
  try {
    console.log("Event: ", JSON.stringify(event));
    for (const record of event.Records) {
      console.log("Processing message:", record.messageId);
      const messageBody = JSON.parse(record.body);
      
      const snsMessage: UserMessage = messageBody.Message ? JSON.parse(messageBody.Message) : messageBody;
      
      console.log("Message content:", snsMessage);
      console.log(`Processing user from ${snsMessage.address.country}`);
      console.log(`User: ${snsMessage.name}, Email: ${snsMessage.email}`);
    }
    
  } catch (error: any) {
    console.error("Error processing message:", error);
    throw error;
  }
};