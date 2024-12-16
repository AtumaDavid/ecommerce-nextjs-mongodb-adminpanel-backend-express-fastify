import mongoose from "mongoose";
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
          // Create new wishlist if it doesn't exist
          userWishlist = new Wishlist({
            user: user,
            items: [{ product: product }],
          });
        } else {
          // Check if product already in wishlist
          const productExists = userWishlist.items.some(
            (item) => item.product.toString() === product
          );

          if (productExists) {
            return reply.code(400).send({
              status: false,
              msg: "Product already in wishlist",
            });
          }

          // Add product to wishlist items
          userWishlist.items.push({ product: product });
        }

        // Save the wishlist
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
            select: "name sellingPrice images slug offer", // Specify fields to populate
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

        const userWishlist = await Wishlist.findOne({ user });

        if (!userWishlist) {
          return reply.code(404).send({
            status: false,
            msg: "Wishlist not found",
          });
        }

        // Find the index of the product in the wishlist items
        const productIndex = userWishlist.items.findIndex(
          (item) => item.product.toString() === productId
        );

        if (productIndex === -1) {
          return reply.code(404).send({
            status: false,
            msg: "Product not found in wishlist",
          });
        }

        // Remove the product from the items array
        userWishlist.items.splice(productIndex, 1);

        // Save the updated wishlist
        await userWishlist.save();

        return reply.code(200).send({
          status: true,
          msg: "Product removed from wishlist successfully",
          // Remove the reference to removedItem
          data: userWishlist,
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

        // Validate user is provided
        if (!user) {
          return reply.code(400).send({
            status: false,
            msg: "User  ID is required",
          });
        }

        // Delete all wishlist items for the user
        const deleteResult = await Wishlist.deleteMany({ user: user });

        return reply.code(200).send({
          status: true,
          msg: "Wishlist cleared successfully",
          data: {
            deletedCount: deleteResult.deletedCount,
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

  //   // Check if product is in wishlist
  fastify.get(
    "/api/wishlist/check/:productId",
    { preValidation: [fastify.authenticate] },
    async (request, reply) => {
      try {
        const { productId } = request.params;
        const user = request.user?.userId;

        const wishlistItem = await Wishlist.findOne({
          user: user,
          product: productId,
        });

        return reply.code(200).send({
          status: true,
          msg: "Wishlist check completed",
          inWishlist: !!wishlistItem,
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
