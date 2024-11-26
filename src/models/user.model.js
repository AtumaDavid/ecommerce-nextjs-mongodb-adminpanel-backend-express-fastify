import mongoose from "mongoose";
import bcrypt from "bcryptjs";
import crypto from "crypto";

const addressSchema = new mongoose.Schema({
  street: { type: String, required: true },
  city: { type: String, required: true },
  state: { type: String, required: true },
  zipcode: { type: String, required: true },
  country: { type: String, required: true },
});

const userSchema = new mongoose.Schema({
  name: { type: String, required: true },
  email: { type: String, required: true, unique: true },
  // mobile: { type: String, required: true, unique: true },
  role: { type: String, enum: ["customer", "admin"], default: "customer" },
  password: { type: String, required: true },
  resetPasswordToken: { type: String },
  resetPasswordExpires: { type: String },
  shippingAddress: addressSchema,
  billingAddress: addressSchema,
  orderHistory: [
    {
      orderId: { type: mongoose.Schema.Types.ObjectId, ref: "Order" },
      date: { type: String, default: Date.now() },
      status: {
        type: String,
        enum: ["pending", "shipped", "delivered", "cancelled"],
        default: "pending",
      },
      totalAmount: { type: Number, required: true },
    },
  ],
  createdAt: { type: Date, default: Date.now() },
  updatedAt: { type: Date, default: Date.now() },
});

// MONGOOSE MIDDLEWARE TO HASH PASSWORD

userSchema.pre("save", async function (next) {
  if (!this.isModified("password")) return next();

  this.password = await bcrypt.hash(this.password, 10);
  next();
});

// METHOD TO COMPARE PASSWORDS
userSchema.methods.comparePassword = async function (password) {
  return await bcrypt.compare(password, this.password);
};

// METHOD TO GENERATE RESET PASSWORD TOKEN
userSchema.methods.createPasswordResetToken = async function () {
  const resetToken = crypto.randomBytes(20).toString("hex");
  this.resetPasswordToken = crypto
    .createHash("sha256")
    .update(resetToken)
    .digest("hex");
  this.resetPasswordExpires = Date.now() + 15 * 60 * 1000; //token valid for 15mins
  return resetToken;
};

export const User = mongoose.model("User", userSchema);
