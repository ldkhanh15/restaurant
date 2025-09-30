import { Twilio } from "twilio";
import { config } from "../../config";

interface SMSPayload {
  to: string;
  message: string;
}

const twilioClient = new Twilio(
  config.twilio.accountSid,
  config.twilio.authToken
);

export const sendSMS = async (payload: SMSPayload) => {
  try {
    const message = await twilioClient.messages.create({
      body: payload.message,
      to: payload.to,
      from: config.twilio.phoneNumber,
    });

    return {
      messageId: message.sid,
      status: message.status,
    };
  } catch (error) {
    console.error("SMS sending error:", error);
    throw error;
  }
};
