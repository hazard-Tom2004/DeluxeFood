import mongoose from "mongoose";

async function removeIndex() {
  try {
    await mongoose.connect("mongodb://localhost:27017/test"); // No need for options

    await mongoose.connection.db.collection("vendors").dropIndex("username_1");
    console.log("Index removed successfully!");

    mongoose.connection.close();
  } catch (error) {
    console.error("Error removing index:", error);
  }
}

removeIndex();
