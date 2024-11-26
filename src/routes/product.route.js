import { Product } from "../models/product.model.js";

export default async function productRoutes(fastify, options) {
  // CREATE A PRODUCT
  fastify.post("/api/products", async (request, response) => {
    try {
      const product = new Product(request.body);
      await product.save();
      response.code(200).send({
        status: true,
        msg: "Product saved successfully",
        data: product,
      });
    } catch (error) {
      response.code(500).send({
        status: false,
        msg: "Something went wrong",
      });
    }
  });

  //   FETCH ALL PRODUCTS
  fastify.get("/api/products", async (request, response) => {
    try {
      const products = await Product.find();
      response.code(200).send({
        status: true,
        msg: "Product fetched successfully",
        data: products,
      });
    } catch (error) {
      response.code(500).send({
        status: false,
        msg: "Something went wrong",
      });
    }
  });

  //   FETCH A SINGLE PRODUCT
  fastify.get("/api/products/:id", async (request, response) => {
    try {
      const id = request.params.id;
      const product = await Product.findById(id);
      if (!product) {
        return response.code(404).send({
          status: false,
          msg: "Product not found",
        });
      }
      response.code(200).send({
        status: true,
        msg: "Product fetched successfully",
        data: product,
      });
    } catch (error) {
      response.code(500).send({
        status: false,
        msg: "Something went wrong",
      });
    }
  });

  //   UPDATE A SINGLE PRODUCT BY ID
  fastify.put("/api/products/:id", async (request, response) => {
    try {
      const id = request.params.id;
      const product = await Product.findByIdAndUpdate(id, request.body, {
        new: true,
      });

      if (!product) {
        return response.code(404).send({
          status: false,
          msg: "Product not found",
        });
      }
      response.code(200).send({
        status: true,
        msg: "Product updated successfully",
        data: product,
      });
    } catch (error) {
      response.code(500).send({
        status: false,
        msg: "Something went wrong",
      });
    }
  });

  //   DELETE PRODUCT
  fastify.delete("/api/products/:id", async (request, response) => {
    try {
      const id = request.params.id;
      const product = await Product.findByIdAndDelete(id);
      if (!product) {
        return response.code(404).send({
          status: false,
          msg: "Product not found",
        });
      }
      response.code(200).send({
        status: true,
        msg: "Product deleted successfully",
      });
    } catch (error) {
      response.code(500).send({
        status: false,
        msg: "Something went wrong",
      });
    }
  });

  //   CHECK AVAILABILITY FOR A SPECIFIC PRODUCT VARIANT (BY COLOR OR SIZE)
  fastify.get("/api/products/:id/availability", async (request, response) => {
    try {
      const { id } = request.params;
      const { color, size } = request.query;
      const product = await Product.findById(id).populate("variants");

      if (!product) {
        return response.code(404).send({
          status: false,
          msg: "Product not found",
        });
      }

      const variations = product.variations.find(
        (item) => item.color === color && item.size === size
      );

      if (!variations) {
        return response.code(404).send({
          status: false,
          msg: "Variation not found",
        });
      }

      response.code(200).send({
        status: true,
        msg: "variations available",
        sku: variations.sku,
        quantityAvailable: variations.quantity,
      });
    } catch (error) {
      response.code(500).send({
        status: false,
        msg: "Something went wrong",
        err: error,
      });
    }
  });

  //   CHECK IF ANY VARIATIONS HAS LOW STOCK (LESS THAN FIVE)
}
