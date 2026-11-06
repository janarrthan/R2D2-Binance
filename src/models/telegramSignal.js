import mongoose from "mongoose";

const telegramSignalScheme = mongoose.Schema({
  coinName: {
    type: String,
    required: true,
  },
  entryPrice: {
    type: Number,
    min: 0,
    required: true,
  },
  stopLoss: {
    type: Number,
    min: 0,
    required: true,
  },
  targets: [],
  direction: {
    type: String,
    required: true,
  },
  dateAdded: {
    type: Date,
    required: true,
  },
  status: {
    type: String,
    default: "Active",
  },
  messageId: {
    type: String,
    required: true,
  },
  channel: {
    type: mongoose.Schema.Types.ObjectId,
    required: true,
    ref: "Channel",
  },
  isRepeatedSignal: {
    type: Boolean,
    default: false,
  },
  repeatedSignalOf: [],
});

const TelegramSignal = mongoose.model("TelegramSignal", telegramSignalScheme);

export default TelegramSignal;
