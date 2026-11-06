import notificationController from "../controllers/notificationController.js";
import playAlert from "./playAlert.js";

process.on("uncaughtException", async (err) => {
  console.log("UNCAUGHT EXCEPTION! 💥 Shutting down...");
  console.log(err);
  playAlert();
  await notificationController.createAppError(err.stack.toString());
});
