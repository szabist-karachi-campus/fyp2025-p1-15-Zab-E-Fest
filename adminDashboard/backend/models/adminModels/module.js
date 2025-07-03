import mongoose from "mongoose";

const moduleSchema = new mongoose.Schema({
  title: { type: String, required: true },
  date: { type: Date, required: true },
  location: { type: String, required: true },
  image: { type: String },
  head: { type: String },
  cap: { type: Number, default: 0 },
});

const Module = mongoose.model("Module", moduleSchema);
export default Module;
