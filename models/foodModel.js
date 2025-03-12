import mongoose from "mongoose";

const foodSchema = new mongoose.Schema(
  {
    name: { type: String, required: true },
    price: { type: Number, required: true },
    picture: { type: String, required: true },
    category: {
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
    description: { type: String },
    vendor: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Vendor",
      required: true,
    }, // Reference Vendor
  },
  { timestamps: true }
);

export default mongoose.model("Food", foodSchema);
