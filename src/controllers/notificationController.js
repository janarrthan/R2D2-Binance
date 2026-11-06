import Notification from "../models/notification.js";
import DatabaseError from "../utils/DatabaseError.js";
import sendMail from "../utils/email.js";

const createNotif = async (notif) => {
  try {
    notif.message += "\n (R2D2 - Binance)";

    const existingNotif = await Notification.find({ message: notif.message });
    if (existingNotif.length > 0) {
      return existingNotif[0];
    }

    const notification = new Notification(notif);
    await notification.save();

    sendNotfiEmail(notif.type, notif.message);
    return notification;
  } catch (error) {
    throw new DatabaseError(error.message, 2);
  }
};

const createBinanceError = async (error, user) => {
  const errorMessage = `Bybit Error: ${error.msg} \n User: ${user.userName} \n User Email: ${user.email}`;
  return await createNotif({
    message: errorMessage,
    type: "error",
  });
};

const createAppError = async (errorMessage) => {
  return await createNotif({
    message: errorMessage,
    type: "error",
  });
};

const createPriceAlertWarning = async (msg) => {
  return await createNotif({
    message: msg,
    type: "warning",
  });
};

const getNotifications = async () => {
  try {
    return await Notification.find({});
  } catch (error) {
    throw new DatabaseError(error.message, 2);
  }
};

const findById = async (id) => {
  try {
    return await Notification.findById(id);
  } catch (error) {
    throw new DatabaseError(error.message, 2);
  }
};

const deleteNotif = async (id) => {
  try {
    const notification = await Notification.findByIdAndDelete({ _id: id });
    return notification;
  } catch (error) {
    throw new DatabaseError(error.message, 2);
  }
};

const sendNotfiEmail = (subject, message) => {
  sendMail({
    email: process.env.BREVO_RECEIVER_EMAIL,
    subject: subject,
    message: message,
  });
};

export default {
  createNotif,
  deleteNotif,
  createBinanceError,
  createAppError,
  getNotifications,
  findById,
  createPriceAlertWarning,
};
