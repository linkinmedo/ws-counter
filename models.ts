import mongoose from "mongoose";

// Mongoose Schema
let clickSchema = new mongoose.Schema({
  amount: Number,
  new: Number,
  clicksToday: Number,
  time: { type: Date, default: Date.now }
});

let todayClickSchema = new mongoose.Schema({
  amount: Number,
  time: { type: Date, default: Date.now }
});

let countrySchema = new mongoose.Schema({
  name: String,
  flag: String,
  clicks: { type: Number, default: 0 }
});

let userSchema = new mongoose.Schema({
  name: String,
  clicks: { type: Number, default: 0 },
  blocked: { type: Boolean, default: false }
});

// Mongoose Model
export let ClickModel = mongoose.model("Click", clickSchema);
export let TodayClickModel = mongoose.model("TodayClick", todayClickSchema);
export let CountryModel = mongoose.model("Country", countrySchema);
export let UserModel = mongoose.model("User", userSchema);
