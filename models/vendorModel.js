import mongoose from "mongoose";

const vendorSchema = new mongoose.Schema(
  {
    name: { type: String, required: true },
    companyName: { type: String, required: true, unique: true },
    email: { type: String, required: true, unique: true, lowercase: true },
    phone: { type: String, required: true },
    picture: { type: String, required: true }, // Store URL or base64
    address: { type: String, required: true },
    preference: {
      type: [String],
      enum: [
        "Fast food",
        "local dish",
        "Intercontinental dish",
        "Vegetarian foods",
        "Drinks",
        "Sea foods",
        "Snacks",
      ],
      default: [],
      required: true,
    },
    password: { type: String, required: true },
    tokens: [
      {
        token: {
          type: mongoose.Schema.Types.ObjectId,
          ref: "Token",
        },
        createdAt: {
          type: Date,
          default: Date.now,
        },
      },
    ],
  },
  { timestamps: true },
  { strict: true }
);

export default mongoose.model("Vendor", vendorSchema);
