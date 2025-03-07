import mongoose from "mongoose";

const userSchema = mongoose.Schema({
  username: { type: String, required: true, unique: true },
  email: { type: String, required: true, unique: true },
  password: { type: String, required: true },
  phone: { type: String, required: true },
  tokens: [
    {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Token", // This connects a user to multiple tokens
    },
  ],
  createdAt: {
    type: Date,
    default: Date.now,
  },
});


export default mongoose.model("User", userSchema);
