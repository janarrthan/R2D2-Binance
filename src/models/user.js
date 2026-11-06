import mongoose from "mongoose";

// Active
// Blocked

const userScheme = mongoose.Schema({
  userName: {
    type: String,
    required: true,
  },
  email: {
    type: String,
    required: true,
    unique: true,
    trim: true,
    lowercase: true,
  },
  phoneNumber: {
    type: String,
    required: true,
  },
  status: {
    type: String,
    default: "Active",
  },
  tradingStrategies: [{}],
  joinedDate: {
    type: Date,
    required: true,
  },
  apiLastUpdatedDate: {
    type: Date,
    required: true,
  },
  apiKey: {
    type: String,
    required: true,
    unique: true,
  },
  apiSecret: {
    type: String,
    required: true,
    unique: true,
  },
  totalInvestment: {
    type: Number,
    required: true,
    min: 1,
  },
  totalWithdrawal: {
    type: Number,
    default: 0,
    min: 0,
  },
  nic: {
    type: String,
    required: true,
  },
  note: {
    type: String,
  },
});

const User = mongoose.model("User", userScheme);

export default User;
