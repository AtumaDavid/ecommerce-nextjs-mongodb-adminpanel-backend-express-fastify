import { Cart } from "../models/cart.model.js";
import { Product } from "../models/product.model.js";
import mongoose from "mongoose";

export default async function cartRoutes(fastify, options) {
  // ADD ITEM TO CART
  fastify.post(
    "/api/cart",
    { preValidation: [fastify.authenticate] },
    async (request, reply) => {
      try {
        const { productId, quantity = 1, variationId } = request.body;
        // console.log(request.body);
        const userId = request.user?.userId;

        // Validate input
        if (!userId || !productId) {
          return reply.code(400).send({
            status: false,
            error: "User ID and Product ID are required",
          });
        }

        // Check if product exists
        const product = await Product.findById(productId);
        if (!product) {
          return reply.code(404).send({
            status: false,
            error: "Product not found",
          });
        }

        // Validate quantity
        if (quantity < 1) {
          return reply.code(400).send({
            status: false,
            error: "Quantity must be at least 1",
          });
        }

        // If variation is specified, validate it
        let selectedVariation = null;
        if (variationId) {
          selectedVariation = product.variations.find(
            (variation) => variation._id.toString() === variationId
          );

          if (!selectedVariation) {
            return reply.code(404).send({
              status: false,
              error: "Selected variation not found",
            });
          }

          // Check variation quantity
          if (selectedVariation.quantityAvailable < quantity) {
            return reply.code(400).send({
              status: false,
              error: "Requested quantity exceeds available stock",
            });
          }
        }

        // Find or create cart
        let cart = await Cart.findOne({ userId });

        if (!cart) {
          // Create new cart if it doesn't exist
          cart = new Cart({
            userId,
            items: [{ productId, quantity, variationId: variationId || null }],
          });
        } else {
          // Check if product already exists in cart
          const existingItemIndex = cart.items.findIndex(
            (item) =>
              item.productId.toString() === productId &&
              (item.variationId?.toString() || null === (variationId || null))
          );

          if (existingItemIndex > -1) {
            // Update quantity if product exists
            cart.items[existingItemIndex].quantity = quantity;
          } else {
            // Add new item to cart
            cart.items.push({
              productId,
              quantity,
              variationId: variationId || null,
            });
          }
        }

        // Save cart
        await cart.save();

        reply.code(200).send({
          status: true,
          msg: "Item added to cart successfully",
          data: cart,
        });
      } catch (error) {
        console.error("Cart addition error:", error);
        reply.code(500).send({
          status: false,
          msg: "Something went wrong",
          error: error.message,
        });
      }
    }
  );

  // FETCH USER'S CART
  fastify.get(
    "/api/cart",
    { preValidation: [fastify.authenticate] },
    async (request, reply) => {
      try {
        // const { userId } = request.params;
        const userId = request.user?.userId;

        // Validate userId
        if (!mongoose.Types.ObjectId.isValid(userId)) {
          return reply.code(400).send({
            status: false,
            error: "Invalid User ID",
          });
        }

        // Find cart and populate product details with variations
        const cart = await Cart.findOne({ userId }).populate({
          path: "items.productId",
          select: "name sellingPrice images variations",
          populate: {
            path: "variations",
            select: "color size price quantityAvailable",
          },
        });

        if (!cart) {
          return reply.code(404).send({
            status: false,
            msg: "Cart not found",
          });
        }

        // Calculate total with variation price if applicable
        const total = cart.items.reduce((sum, item) => {
          const product = item.productId;
          let itemPrice = parseFloat(product.sellingPrice);

          // If variation is selected, use variation price
          if (item.variationId) {
            const variation = product.variations.find(
              (v) => v._id.toString() === item.variationId.toString()
            );
            if (variation) {
              itemPrice = variation.price;
            }
          }

          return sum + itemPrice * item.quantity;
        }, 0);

        reply.code(200).send({
          status: true,
          msg: "Cart fetched successfully",
          data: cart,
          total,
        });
      } catch (error) {
        reply.code(500).send({
          status: false,
          msg: "Something went wrong",
          error: error.message,
        });
      }
    }
  );

  // UPDATE CART ITEM QUANTITY
  fastify.put(
    "/api/cart",
    { preValidation: [fastify.authenticate] },
    async (request, reply) => {
      try {
        // const { userId } = request.params;
        const { productId, quantity, variationId } = request.body;
        const userId = request.user?.userId;

        // Validate inputs
        if (!productId || quantity < 1) {
          return reply.code(400).send({
            status: false,
            error: "Invalid product or quantity",
          });
        }

        // Find cart
        const cart = await Cart.findOne({ userId });
        if (!cart) {
          return reply.code(404).send({
            status: false,
            msg: "Cart not found",
          });
        }

        // Find the product to check variation stock
        const product = await Product.findById(productId);
        if (!product) {
          return reply.code(404).send({
            status: false,
            msg: "Product not found",
          });
        }

        // Check variation stock if variationId is provided
        if (variationId) {
          const variation = product.variations.find(
            (v) => v._id.toString() === variationId
          );

          if (!variation) {
            return reply.code(404).send({
              status: false,
              msg: "Variation not found",
            });
          }

          if (quantity > variation.quantityAvailable) {
            return reply.code(400).send({
              status: false,
              msg: "Requested quantity exceeds available stock",
            });
          }
        }

        // Find and update cart item
        const itemIndex = cart.items.findIndex(
          (item) =>
            item.productId.toString() === productId &&
            (item.variationId?.toString() || null) === (variationId || null)
        );

        if (itemIndex > -1) {
          cart.items[itemIndex].quantity = quantity;
          await cart.save();

          reply.code(200).send({
            status: true,
            msg: "Cart item updated successfully",
            data: cart,
          });
        } else {
          reply.code(404).send({
            status: false,
            msg: "Product not found in cart",
          });
        }
      } catch (error) {
        reply.code(500).send({
          status: false,
          msg: "Something went wrong",
          error: error.message,
        });
      }
    }
  );

  // REMOVE ITEM FROM CART
  fastify.delete(
    "/api/cart/:productId",
    { preValidation: [fastify.authenticate] },
    async (request, reply) => {
      try {
        const { productId } = request.params;
        // console.log(productId);
        const userId = request.user?.userId;

        // Find and update cart
        const cart = await Cart.findOne({ userId });
        if (!cart) {
          return reply.code(404).send({
            status: false,
            msg: "Cart not found",
          });
        }

        // Remove item from cart
        cart.items = cart.items.filter(
          (item) => item.productId.toString() !== productId
        );

        await cart.save();

        reply.code(200).send({
          status: true,
          msg: "Item removed from cart successfully",
          data: cart,
        });
      } catch (error) {
        reply.code(500).send({
          status: false,
          msg: "Something went wrong",
          error: error.message,
        });
      }
    }
  );

  // CLEAR ALL CART ITEMS
  fastify.delete("/api/cart/clear/:userId", async (request, reply) => {
    try {
      const { userId } = request.params;

      // Validate userId
      if (!mongoose.Types.ObjectId.isValid(userId)) {
        return reply.code(400).send({
          status: false,
          error: "Invalid User ID",
        });
      }

      // Find and update cart
      const cart = await Cart.findOne({ userId });
      if (!cart) {
        return reply.code(404).send({
          status: false,
          msg: "Cart not found",
        });
      }

      // Clear all cart items
      cart.items = [];

      await cart.save();

      reply.code(200).send({
        status: true,
        msg: "All items removed from cart successfully",
        data: cart,
      });
    } catch (error) {
      reply.code(500).send({
        status: false,
        msg: "Something went wrong",
        error: error.message,
      });
    }
  });
}
