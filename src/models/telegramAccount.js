import mongoose from "mongoose";

const telegramAccountScheme = mongoose.Schema({
  accountName: {
    type: String,
    required: true,
  },
  apiId: {
    type: Number,
    required: true,
  },
  apiHash: {
    type: String,
    required: true,
  },
  status: {
    type: String,
    default: "Active",
  },
});

const TelegramAccount = mongoose.model("TelegramAccount", telegramAccountScheme);

export default TelegramAccount;
