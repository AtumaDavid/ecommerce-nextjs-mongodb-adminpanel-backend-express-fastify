import Fastify from "fastify";
import { startDb } from "./config/dbConnect.js";
import authRoutes from "./routes/auth.route.js";
import fastifyJwt from "@fastify/jwt";
import productRoutes from "./routes/product.route.js";
import orderRoutes from "./routes/order.route.js";
import categoryRoutes from "./routes/category.route.js";
import fastifyCors from "@fastify/cors";
import dotenv from "dotenv";
import { v2 as cloudinary } from "cloudinary";
import uploadRoutes from "./routes/upload.route.js";
import multipart from "@fastify/multipart";
import wishListRoutes from "./routes/wishlist.route.js";
import cartRoutes from "./routes/cart.route.js";

dotenv.config();

const fastify = Fastify({ logger: true });

// REGISTER CORS BEFORE OTHER PLUGINS
fastify.register(fastifyCors, {
  origin: "*", // Your frontend URL
  methods: ["GET", "POST", "PUT", "DELETE", "PATCH", "OPTIONS"],
  allowedHeaders: ["Content-Type", "Authorization"],
  credentials: true,
});

// Cloudinary Configuration
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

// Register multipart plugin for file uploads
fastify.register(multipart, {
  limits: {
    fieldNameSize: 100, // Max field name size
    fieldSize: 100, // Max field value size
    fields: 10, // Max number of non-file fields
    fileSize: 10000000, // 10MB max file size
    files: 1, // Max number of file fields
  },
});

// REGISTER FASTIFY JWT
fastify.register(fastifyJwt, { secret: "supersecret" });

fastify.decorate("authenticate", async function (request, response) {
  try {
    // const token = request.headers.authorization.split(" ")[1];
    await request.jwtVerify();
  } catch (error) {
    response.code(500).send({
      status: false,
      msg: "something went wrong!",
      error: error,
    });
  }
});

// fastify.get("/", (req, res) => {
//   res.send({
//     msg: "Hello from server",
//   });
// });

fastify.register(authRoutes);
fastify.register(productRoutes);
fastify.register(orderRoutes);
fastify.register(uploadRoutes);
fastify.register(categoryRoutes);
fastify.register(wishListRoutes);
fastify.register(cartRoutes);

const start = async () => {
  await startDb();
  try {
    await fastify.listen({ port: 4000 });
    console.log("server is running on http://localhost:4000");
  } catch (error) {
    fastify.log.error(error);
    process.exit(1);
  }
};

start();
