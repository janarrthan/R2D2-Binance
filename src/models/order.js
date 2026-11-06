import mongoose from "mongoose";

const orderScheme = mongoose.Schema({
  signalId: {
    type: mongoose.Schema.Types.ObjectId,
    required: true,
    ref: "btSignal",
  },
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    required: true,
    ref: "User",
  },
  orderId: {
    type: Number,
    required: true,
  },
  tpOrderId: {
    type: String,
  },
  slOrderId: {
    type: String,
    required: true,
  },
  coinName: {
    type: String,
    required: true,
  },
  qty: {
    type: Number,
    required: true,
  },
  positionSide: {
    type: String,
    required: true,
  },
  status: {
    type: String,
    default: "Active",
  },
  isTPSet: {
    type: Boolean,
    default: false,
  },
});

const Order = mongoose.model("Order", orderScheme);

export default Order;
