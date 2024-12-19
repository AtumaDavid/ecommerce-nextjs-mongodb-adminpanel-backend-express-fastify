import mongoose from "mongoose";

const cartItemSchema = new mongoose.Schema(
  {
    productId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Product",
      required: true,
    },
    variationId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Product.variations", // Reference to the specific variation
      default: null,
    },
    quantity: { type: Number, required: true, min: 1 },
    // // Optional: Add more details for better tracking
    // selectedVariation: {
    //   color: { type: String },
    //   size: { type: String },
    //   price: { type: Number },
    // },
  },
  { _id: false }
); // Disable creating separate _id for subdocuments

const CartSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      unique: true,
    },
    items: [cartItemSchema],
    // Optional: Add metadata
    totalItems: {
      type: Number,
      default: 0,
    },
    totalValue: {
      type: Number,
      default: 0,
    },
  },
  {
    timestamps: true,
    // Add a pre-save hook to update metadata
    // (runs automatically before the document is saved to the database)
    // Automatically calculates the total number of items in the cart
    hooks: {
      pre: {
        save: function (next) {
          // 'this' refers to the current cart document
          this.totalItems = this.items.reduce(
            // Reduce method to sum up quantities
            (total, item) => total + item.quantity,
            0 // Initial value of total is 0
          );
          next();
        },
      },
    },
  }
);

// Add a method to calculate total value
CartSchema.methods.calculateTotalValue = async function () {
  const populatedCart = await this.populate({
    path: "items.productId",
    select: "sellingPrice variations",
  });

  this.totalValue = populatedCart.items.reduce((total, item) => {
    const product = item.productId;
    let itemPrice;

    // Use variation price if variation is selected
    if (item.variationId) {
      const variation = product.variations.find(
        (v) => v._id.toString() === item.variationId.toString()
      );
      itemPrice = variation
        ? variation.price
        : parseFloat(product.sellingPrice);
    } else {
      itemPrice = parseFloat(product.sellingPrice);
    }

    return total + itemPrice * item.quantity;
  }, 0);

  return this.totalValue;
};

// Add a method to add or update an item
CartSchema.methods.addOrUpdateItem = function (
  productId,
  quantity,
  variationId = null
) {
  const existingItemIndex = this.items.findIndex(
    (item) =>
      item.productId.toString() === productId &&
      (item.variationId?.toString() || null) === variationId
  );

  if (existingItemIndex > -1) {
    // Update existing item
    this.items[existingItemIndex].quantity += quantity;
  } else {
    // Add new item
    this.items.push({
      productId,
      quantity,
      variationId,
    });
  }

  return this;
};

// Add a method to remove an item
CartSchema.methods.removeItem = function (productId, variationId = null) {
  this.items = this.items.filter(
    (item) =>
      !(
        item.productId.toString() === productId &&
        (item.variationId?.toString() || null) === variationId
      )
  );

  return this;
};

export const Cart = mongoose.model("Cart", CartSchema);
