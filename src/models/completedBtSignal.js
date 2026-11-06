import mongoose from "mongoose";

const completedBtSignalScheme = mongoose.Schema({
  telegramSignalId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "TelegramSignal",
  },
  coinName: {
    type: String,
    required: true,
  },
  direction: {
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
  targetPrice: {
    type: Number,
    min: 0,
    required: true,
  },
  targets: [],
  dateAdded: {
    type: Date,
    required: true,
  },
  dateClosed: {
    type: Date,
  },
  status: {
    type: String,
    default: "Active",
  },
  isEntry: {
    type: Boolean,
    default: false,
  },
  profitLoss: {
    type: Number,
    default: 0,
  },
  telegramOutgoingMsgId: {
    type: Number,
    default: 0,
  },
  channel: {
    type: mongoose.Schema.Types.ObjectId,
    required: true,
    ref: "Channel",
  },
  isStopLossMvToEntry: {
    type: Boolean,
    default: false,
  },
  stopLossMvPrice: {
    // when to move the stop loss price to entry
    type: Number,
    default: 0,
  },
  didMoveSLToEntry: {
    type: Boolean,
    default: false,
  },
  strategy: {
    type: "String",
    default: "normal",
  },
  isTargetsUpdated: {
    type: Boolean,
    default: false,
  },
  currentTarget: {
    type: Number,
    default: 0,
  },
  cumaltivePNL: {
    type: Number,
    default: 0,
  },
});

const CompletedBtSignal = mongoose.model("CompletedBtSignal", completedBtSignalScheme);

export default CompletedBtSignal;
