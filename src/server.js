import Fastify from "fastify";
import { startDb } from "./config/dbConnect.js";

const fastify = Fastify({ logger: true });

fastify.get("/", (req, res) => {
  res.send({
    msg: "Hello from server",
  });
});

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
