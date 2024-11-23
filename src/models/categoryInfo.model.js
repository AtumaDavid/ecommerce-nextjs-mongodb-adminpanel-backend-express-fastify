import mongoose from "mongoose";

const categoryInfoSchema = new mongoose.Schema(
  {
    gender: {
      type: String,
      enum: ["men", "women", "juniors"],
      required: true,
    },
    category: {
      type: String,
      required: true,
    },
    subcategory: {
      type: String,
      required: true,
    },

    // isActive: {
    //   type: Boolean,
    //   default: true,
    // },
    // image: {
    //   type: String,
    // },
    // slug: {
    //   type: String,
    //   unique: true,
    //   required: true,
    // },
  },
  { timestamps: true }
);

// Create indexes for better query performance
// categoryInfoSchema.index({ gender: 1, category: 1, subcategory: 1 });
// categoryInfoSchema.index({ slug: 1 });

export const CategoryInfo = mongoose.model("CategoryInfo", categoryInfoSchema);
