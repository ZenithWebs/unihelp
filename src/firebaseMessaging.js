import { getMessaging, getToken } from "firebase/messaging";
import { app } from "./firebase/config";


const messaging = getMessaging(app);

export const requestNotificationPermission = async () => {
  const permission = await Notification.requestPermission();

  if (permission === "granted") {
    const token = await getToken(messaging, {
      vapidKey: "BNSkrKfXIg968vhAb-KcSk7x5knlR67nEhIq-dlD7mGAbN1AgAABQlEmPq1ISNesMUvqW0JvyMQymywrAna0jv4",
    });

    return token;
  }
};