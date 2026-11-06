import notificationController from "../controllers/notificationController.js";
import playAlert from "./playAlert.js";

process.on("unhandledRejection", async (err) => {
  console.log("UNHANDLED REJECTION! 💥 Shutting down...");
  console.log(err.name, err.message);
  playAlert();
  await notificationController.createAppError(err.stack.toString());
});
