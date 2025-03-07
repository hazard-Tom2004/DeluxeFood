import mongoose from "mongoose";
// import User from "../models/userModel.js"


// const users = await User.findOne({ token })
mongoose.Schema.Types.ObjectId
const tokenSchema = new mongoose.Schema({
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User", 
      // required: true,
    },
    token: {
      type: String,
      required: true,
    },
    createdAt: {
      type: Date,
      default: Date.now,
      expires: "7d", // Automatically delete after 7 days
    },
  });
  
export default mongoose.model("Token", tokenSchema);