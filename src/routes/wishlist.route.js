import { Product } from "../models/product.model.js";
import { Wishlist } from "../models/wishlist.model.js";

export default async function wishListRoutes(fastify, options) {
  // Add a product to wishlist
  fastify.post(
    "/api/wishlist",
    { preValidation: [fastify.authenticate] },
    async (request, reply) => {
      try {
        const { product } = request.body;
        const user = request.user?.userId;

        // Validate product exists
        const existingProduct = await Product.findById(product);
        if (!existingProduct) {
          return reply.code(404).send({
            status: false,
            msg: "Product not found",
          });
        }

        // Find or create user's wishlist
        let userWishlist = await Wishlist.findOne({ user });

        if (!userWishlist) {
          // Create new wishlist for user if not exists
          userWishlist = new Wishlist({
            user,
            items: [],
          });
        }

        // Check if product already in wishlist
        const isProductInWishlist = userWishlist.items.some(
          (item) => item.product.toString() === product
        );

        if (isProductInWishlist) {
          return reply.code(400).send({
            status: false,
            msg: "Product already in wishlist",
          });
        }

        // Add product to wishlist
        userWishlist.items.push({ product });

        // Save wishlist
        await userWishlist.save();

        return reply.code(200).send({
          status: true,
          msg: "Product added to wishlist successfully",
          data: userWishlist,
        });
      } catch (error) {
        console.error("Wishlist addition error:", error);
        return reply.code(500).send({
          status: false,
          msg: "Something went wrong",
          error: error.message,
        });
      }
    }
  );

  // Get user's wishlist
  fastify.get(
    "/api/wishlist",
    { preValidation: [fastify.authenticate] },
    async (request, reply) => {
      try {
        const user = request.user?.userId;

        const userWishlist = await Wishlist.findOne({ user })
          .populate({
            path: "items.product",
            select: "name price images slug", // Specify fields to populate
          })
          .sort({ "items.addedAt": -1 }); // Sort by most recent

        return reply.code(200).send({
          status: true,
          msg: "Wishlist fetched successfully",
          data: userWishlist?.items || [],
        });
      } catch (error) {
        console.error("Wishlist fetch error:", error);
        return reply.code(500).send({
          status: false,
          msg: "Something went wrong",
          error: error.message,
        });
      }
    }
  );

  // Remove product from wishlist
  fastify.delete(
    "/api/wishlist/:productId",
    { preValidation: [fastify.authenticate] },
    async (request, reply) => {
      try {
        const { productId } = request.params;
        const user = request.user?.userId;

        // Find user's wishlist and remove the specific product
        const updatedWishlist = await Wishlist.findOneAndUpdate(
          { user },
          {
            $pull: {
              items: { product: productId },
            },
          },
          { new: true }
        );

        if (!updatedWishlist) {
          return reply.code(404).send({
            status: false,
            msg: "Wishlist not found or product not in wishlist",
          });
        }

        return reply.code(200).send({
          status: true,
          msg: "Product removed from wishlist successfully",
          data: updatedWishlist,
        });
      } catch (error) {
        console.error("Wishlist removal error:", error);
        return reply.code(500).send({
          status: false,
          msg: "Something went wrong",
          error: error.message,
        });
      }
    }
  );

  // Clear entire wishlist
  fastify.delete(
    "/api/wishlist/clear",
    { preValidation: [fastify.authenticate] },
    async (request, reply) => {
      try {
        const user = request.user?.userId;

        // Clear all items from user's wishlist
        const updatedWishlist = await Wishlist.findOneAndUpdate(
          { user },
          { items: [] },
          { new: true }
        );

        if (!updatedWishlist) {
          return reply.code(404).send({
            status: false,
            msg: "Wishlist not found",
          });
        }

        return reply.code(200).send({
          status: true,
          msg: "Wishlist cleared successfully",
          data: {
            deletedCount: updatedWishlist.items.length,
          },
        });
      } catch (error) {
        console.error("Wishlist clear error:", error);
        return reply.code(500).send({
          status: false,
          msg: "Something went wrong",
          error: error.message,
        });
      }
    }
  );

  // Check if product is in wishlist
  fastify.get(
    "/api/wishlist/check/:productId",
    { preValidation: [fastify.authenticate] },
    async (request, reply) => {
      try {
        const { productId } = request.params;
        const user = request.user?.userId;

        const wishlist = await Wishlist.findOne({ user });

        const inWishlist = wishlist?.items.some(
          (item) => item.product.toString() === productId
        );

        return reply.code(200).send({
          status: true,
          msg: "Wishlist check completed",
          inWishlist: !!inWishlist,
        });
      } catch (error) {
        console.error("Wishlist check error:", error);
        return reply.code(500).send({
          status: false,
          msg: "Something went wrong",
          error: error.message,
        });
      }
    }
  );
}
