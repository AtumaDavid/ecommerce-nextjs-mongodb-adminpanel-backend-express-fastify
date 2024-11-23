import Fastify from "fastify";
import { startDb } from "./config/dbConnect.js";
import authRoutes from "./routes/auth.route.js";
import fastifyJwt from "@fastify/jwt";

const fastify = Fastify({ logger: true });

// REGISTER FASTIFY JWT
fastify.register(fastifyJwt, { secret: "supersecret" });

fastify.get("/", (req, res) => {
  res.send({
    msg: "Hello from server",
  });
});

fastify.register(authRoutes);

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
