import axios from "axios";
import { config } from "../../config";

interface PushNotificationPayload {
  token: string;
  title: string;
  body: string;
  data?: Record<string, any>;
}

export const sendPushNotification = async (
  payload: PushNotificationPayload
) => {
  try {
    // Using Firebase Cloud Messaging (FCM) as the push notification service
    const response = await axios.post(
      "https://fcm.googleapis.com/fcm/send",
      {
        to: payload.token,
        notification: {
          title: payload.title,
          body: payload.body,
        },
        data: payload.data || {},
      },
      {
        headers: {
          "Content-Type": "application/json",
          Authorization: `key=${config.fcm.serverKey}`,
        },
      }
    );

    return response.data;
  } catch (error) {
    console.error("Push notification error:", error);
    throw error;
  }
};
