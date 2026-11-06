import mongoose from "mongoose";

// Active
// Blocked

const authScheme = mongoose.Schema({
  email: {
    type: String,
    required: true,
    unique: true,
    trim: true,
    lowercase: true,
  },
  password: {
    type: String,
    required: true,
  },
  status: {
    type: String,
    default: "Active",
  },
  attemptsLeft: {
    type: Number,
    default: 3,
  },
  registeredDevices: [],
});

const Auth = mongoose.model("Auth", authScheme);

export default Auth;
