import mongoose from "mongoose";

const priceAlertScheme = mongoose.Schema({
  coinName: {
    type: String,
    required: true,
  },
  targetPrice: {
    type: Number,
    min: 0,
  },
  direction: {
    type: String,
    required: true,
  },
  note: {
    type: String,
  },
  dateAdded: {
    type: Date,
    required: true,
  },
});

const PriceAlert = mongoose.model("priceAlert", priceAlertScheme);

export default PriceAlert;
