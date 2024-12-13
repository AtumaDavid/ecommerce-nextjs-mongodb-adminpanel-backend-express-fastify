// import mongoose from "mongoose";

// const wishListSchema = new mongoose.Schema({
//   product: {
//     type: mongoose.Schema.Types.ObjectId,
//     ref: "Product",
//   },
//   user: {
//     type: mongoose.Schema.Types.ObjectId,
//     ref: "User",
//   },
// });

// export const Wishlist = mongoose.model("Wishlist", wishListSchema);

import mongoose from "mongoose";

const wishlistSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      unique: true, // Ensure one wishlist per user
    },
    items: [
      {
        product: {
          type: mongoose.Schema.Types.ObjectId,
          ref: "Product",
          required: true,
        },
        addedAt: {
          type: Date,
          default: Date.now,
        },
      },
    ],
  },
  {
    timestamps: true,
  }
);

// Compound index to prevent duplicate products in a user's wishlist
wishlistSchema.index({ user: 1, "items.product": 1 }, { unique: true });

export const Wishlist = mongoose.model("Wishlist", wishlistSchema);
