import { User } from "../models/user.model.js";
import crypto from "crypto";

export default async function authRoutes(fastify, options) {
  // USER REGISTRATION
  fastify.post("/api/register", async (request, response) => {
    const { name, email, password } = request.body;
    const userExist = await User.findOne({ email });

    if (userExist) {
      return response
        .status(400)
        .send({ status: false, msg: "User Already Exists" });
    }

    const newUser = new User({ name, email, password });
    await newUser.save();
    response.send({ status: true, msg: "User registered successfully" });
  });

  // USER LOGIN
  fastify.post("/api/login", async (request, response) => {
    const { email, password } = request.body;
    const user = await User.findOne({ email });
    if (!user) {
      return response
        .status(400)
        .send({ status: false, msg: "Invalid Email or Password" });
    }
    const isMatch = await user.comparePassword(password);
    if (!isMatch) {
      return response
        .status(400)
        .send({ status: false, msg: "Invalid Email or password" });
    }
    const token = fastify.jwt.sign({ userId: user._id });
    response.send({ status: true, msg: "Login successful", token });
  });

  //   FORGOT PASSWORD
  fastify.post("/api/forgot-password", async (request, response) => {
    const { email } = request.body;
    const user = await User.findOne({ email });
    if (!user) {
      return response.status(400).send({ status: false, msg: "Invalid Email" });
    }
    const resetToken = await user.createPasswordResetToken();
    await user.save({ validateBeforeSave });
    const resetUrl = `http://localhost:3000/reset-password/${resetToken}`;
    response.status(200).send({
      status: true,
      msg: `password reset token sent. Please visit: ${resetUrl}`,
    });
  });

  //   RESET PASSWORD
  fastify.post("/api/reset-password/:resetToken", async (request, response) => {
    const { resetToken } = request.params;
    const { password } = request.body;
    const hashedToken = crypto
      .createHash("sha256")
      .update(resetToken)
      .digest("hex");
    const user = await User.findOne({
      resetPasswordToken: hashedToken,
      resetPasswordExpires: { $gt: Date.now() },
    });
    if (!user) {
      return response
        .status(400)
        .send({ status: false, msg: "Token is invalid or expired" });
    }
    user.password = password;
    user.resetPasswordToken = undefined;
    user.resetPasswordExpires = undefined;
    await user.save({ validateBeforeSave });
    response
      .status(200)
      .send({ status: true, msg: "password reset successful" });
  });

  //   GET ALL USERS (ADMIN ONLY)
  fastify.get("/api/users", async (request, response) => {
    const users = await User.find().select("-password");
    response.send({
      status: true,
      msg: "User found",
      users: users,
    });
  });

  // GET A USER BY ID
  fastify.get("/api/users/:id", async (request, response) => {
    const { id } = request.params;
    const user = await User.findById(id).select("-password");
    if (!user) {
      return response
        .status(400)
        .send({ status: false, msg: "User not found" });
    }
    response.status(200).send({ status: true, msg: "User found", user: user });
  });

  //   DELETE A USER
  fastify.delete("/api/users/:id", async (request, response) => {
    const { id } = request.params;
    const user = await User.findByIdAndDelete(id);
    if (!user) {
      return response
        .status(400)
        .send({ status: false, msg: "User not found" });
    }
    response
      .status(200)
      .send({ status: true, msg: "User deleted", user: user });
  });
}
