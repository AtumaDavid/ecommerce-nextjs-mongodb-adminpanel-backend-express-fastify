import mongoose from "mongoose";

const productSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
    },
    sku: {
      type: String,
      required: true,
      unique: true,
    },
    categoryInfo: {
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
    },
    barcode: {
      type: String,
      enum: ["EAN-13", "UPC-A"],
    },
    buyingPrice: {
      type: Number,
      required: true,
    },
    sellingPrice: {
      type: Number,
      required: true,
    },
    tax: {
      type: String,
      enum: ["No Vat", "Vat-5", "Vat-10", "Vat-20"],
      default: "No Vat",
    },
    status: {
      type: String,
      enum: ["Active", "Inactive"],
      default: "Active",
    },
    canPurchasable: {
      type: Boolean,
      default: true,
    },
    showStockOut: {
      type: Boolean,
      default: true,
    },
    refundable: {
      type: Boolean,
      default: true,
    },
    maxPurchaseQuantity: {
      type: Number,
      // default: 1,
      required: true,
    },
    lowStockWarning: {
      type: Number,
      // default: 0,
      required: true,
    },
    unit: {
      type: String,
      enum: ["piece(pc)", "Gram", "Litre", "Milliliter"],
      default: "piece(pc)",
    },
    weight: {
      type: Number,
    },
    tags: [
      {
        type: [String],
      },
    ],
    description: {
      type: String,
    },
    images: {
      type: String,
    },
    videos: [videoSchema],
    offer: offerSchema,
    variations: [variationSchema],
    seo: seoSchema,
    shippingReturn: shippingReturnSchema,
  },
  { timestamps: true }
);

export const Product = mongoose.model("Product", productSchema);
