import mongoose from "mongoose";

export const startDb = async () => {
  try {
    await mongoose.connect("mongodb://localhost:27017/shopking");
    console.log("mongodb  connected");
  } catch (error) {
    console.error("Error connecting to mongodb", error);
    process.exit(1);
  }
};
