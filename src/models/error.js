import mongoose from "mongoose";

const errorScheme = mongoose.Schema({
  dateAdded: {
    type: Date,
    default: new Date(),
  },
  error: {
    type: String,
    require: true,
  },
});

const Error = mongoose.model("Error", errorScheme);

export default Error;
