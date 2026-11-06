import mongoose from "mongoose";

const timeKeeperScheme = mongoose.Schema({
  lastActive: {
    type: Date,
    default: new Date(),
  },
});

const TimeKeeper = mongoose.model("TimeKeeper", timeKeeperScheme);

export default TimeKeeper;
