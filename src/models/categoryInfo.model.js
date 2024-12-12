import mongoose from "mongoose";

const SubcategorySchema = new mongoose.Schema({
  id: {
    type: mongoose.Schema.Types.ObjectId,
    default: mongoose.Types.ObjectId,
  },
  name: {
    type: String,
    required: true,
    trim: true,
  },
});

const CategoryInfoSchema = new mongoose.Schema(
  {
    gender: {
      type: String,
      required: true,
      enum: ["men", "women", "juniors"],
    },
    category: {
      type: String,
      required: true,
      trim: true,
    },
    categoryImage: {
      type: String,
      required: true,
    },
    subcategories: [SubcategorySchema],
    createdAt: {
      type: Date,
      default: Date.now,
    },
  },
  {
    timestamps: true,
  }
);

export const CategoryInfo = mongoose.model("CategoryInfo", CategoryInfoSchema);
