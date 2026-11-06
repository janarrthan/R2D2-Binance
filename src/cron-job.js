import bcrypt from "bcryptjs";

import notificationController from "./controllers/notificationController.js";
import Auth from "./models/auth.js";
import TimeKeeper from "./models/timeKeeper.js";

const runCronJob = async (socketIO) => {
  const notifications = await notificationController.getNotifications();

  socketIO.sockets.emit("data", {
    notifications: notifications,
  });

  setTimeout(() => {
    runCronJob(socketIO);
  }, 1000);
};

const createAdminUser = async () => {
  try {
    const loginDetails = await Auth.find({});

    if (loginDetails && loginDetails.length > 0) {
      return;
    }

    const email = process.env.AUTH_EMAIL;
    const password = process.env.AUTH_PASSWORD;
    const hashedPassword = await bcrypt.hash(password, 8);

    const newAuth = new Auth({ email: email, password: hashedPassword });
    await newAuth.save();
  } catch (error) {
    notificationController.createAppError(error.stack.toString());
  }
};

const createTimeKeeper = async () => {
  try {
    const timerKeeper = await TimeKeeper.find({});

    if (timerKeeper && timerKeeper.length > 0) {
      return;
    }

    const newTimeKeeper = new TimeKeeper({ lastActive: new Date() });
    await newTimeKeeper.save();
  } catch (error) {
    notificationController.createAppError(error.stack.toString());
  }
};

export default {
  runCronJob,
  createAdminUser,
  createTimeKeeper,
};
