import mongoose from "mongoose";

const connection = mongoose.createConnection(process.env.NOTIF_DB);

// Notification Types
// 1 -> Error
// 2 -> Warning
// 3 -> Info

const notificationScheme = mongoose.Schema({
  dateAdded: {
    type: Date,
    default: new Date(),
  },
  message: {
    type: String,
    require: true,
  },
  type: {
    type: String,
    required: true,
  },
  isRead: {
    type: Boolean,
    default: false,
  },
  isEmailSend: {
    type: Boolean,
    default: false,
  },
});

const Notification = connection.model("Notification", notificationScheme);

export default Notification;
