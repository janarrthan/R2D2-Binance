import mongoose from "mongoose";

const strategyScheme = mongoose.Schema({
  type: {
    type: String,
    required: true,
    enum: {
      values: ["NTS", "OTS", "PENTS"],
      message: "The type should either NTS, OTS or PENTS",
    },
  },
  strategyName: {
    type: String,
    required: true,
    unique: true,
  },
  channel: {
    type: mongoose.Schema.Types.ObjectId,
    required: true,
    ref: "Channel",
  },
  strategyFor: {
    type: String,
    required: true,
    enum: {
      values: ["Long", "Short"],
      message: "The strategy for should either Long, Short",
    },
  },
  strategyType: {
    type: String,
    required: true,
    enum: {
      values: ["normal", "stopLossMoveToEntry", "tpEntry"],
      message: "The strategy type should either be normal, stopLossMoveToEntry or tpEntry",
    },
  },
  status: {
    type: String,
    default: "Active",
  },

  selectedTargetNo: {
    type: Number,
  },
  isPlaceTradeIfTargetDoesntExist: {
    type: Boolean,
    default: false,
  },
  tradeCancelTargetNo: {
    type: Number,
  },
  selectedEntryTargetNo: {
    type: Number,
  },
  selectedStoplossTargetNo: {
    type: Number,
  },
  selectedEntryPerc: {
    type: Number,
  },

  excludedDays: [],
  excludedDates: [],
  isExclRepeatTrades: {
    type: Boolean,
    default: false,
  },
});

const Strategy = mongoose.model("strategy", strategyScheme);

export default Strategy;

// Main Strategy Types
// 1 -> NTS
// 2 -> OTS
// 3 -> PENTS

// Sub Strategy Types
// 1 -> normal
// 2 -> stopLossMoveToEntry
// 3 -> tpEntry

// Status Types
// 1 -> Active
// 2 -> Blocked
