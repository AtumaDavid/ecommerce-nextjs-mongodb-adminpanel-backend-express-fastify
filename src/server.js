import Fastify from "fastify";
import { startDb } from "./config/dbConnect.js";
import authRoutes from "./routes/auth.route.js";
import fastifyJwt from "@fastify/jwt";
import productRoutes from "./routes/product.route.js";
import orderRoutes from "./routes/order.route.js";
import fastifyCors from "@fastify/cors";

const fastify = Fastify({ logger: true });

// REGISTER CORS BEFORE OTHER PLUGINS
fastify.register(fastifyCors, {
  origin: "*", // Your frontend URL
  methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
  allowedHeaders: ["Content-Type", "Authorization"],
  credentials: true,
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

// import Fastify from "fastify";
// import fastifyCors from "@fastify/cors";
// import { startDb } from "./config/dbConnect.js";
// import authRoutes from "./routes/auth.route.js";
// import fastifyJwt from "@fastify/jwt";
// import productRoutes from "./routes/product.route.js";
// import orderRoutes from "./routes/order.route.js";

// const fastify = Fastify({ logger: true });

// // REGISTER CORS BEFORE OTHER PLUGINS
// fastify.register(fastifyCors, {
//   origin: ["http://localhost:3000/registration"], // Your frontend URL
//   methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
//   allowedHeaders: ["Content-Type", "Authorization"],
//   credentials: true,
// });

// // REGISTER FASTIFY JWT
// fastify.register(fastifyJwt, { secret: "supersecret" });

// fastify.decorate("authenticate", async function (request, response) {
//   try {
//     await request.jwtVerify();
//   } catch (error) {
//     response.code(500).send({
//       status: false,
//       msg: "something went wrong!",
//       error: error,
//     });
//   }
// });

// fastify.register(authRoutes);
// fastify.register(productRoutes);
// fastify.register(orderRoutes);

// const start = async () => {
//   await startDb();
//   try {
//     await fastify.listen({ port: 4000, host: "0.0.0.0" }); // Added host to ensure it listens on all network interfaces
//     console.log("server is running on http://localhost:4000");
//   } catch (error) {
//     fastify.log.error(error);
//     process.exit(1);
//   }
// };

// start();
