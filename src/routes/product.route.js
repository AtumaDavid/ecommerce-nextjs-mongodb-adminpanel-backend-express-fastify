import slugify from "slugify";
import { Product } from "../models/product.model.js";
import { v2 as cloudinary } from "cloudinary";

// Utility function to extract public ID from Cloudinary URL
function extractPublicIdFromUrl(url) {
  if (!url) return null;
  const match = url.match(/\/v\d+\/([^/]+)\.\w+$/);
  return match ? match[1] : null;
}

export default async function productRoutes(fastify, options) {
  fastify.post("/api/products", async (request, response) => {
    try {
      if (request.body.name) {
        request.body.slug = slugify(request.body.name.toLowerCase());
      }
      // Create a copy of the request body to avoid modifying the original
      const productData = { ...request.body };

      // Handle base64 image conversion if needed
      if (productData.images && productData.images.startsWith("data:image")) {
        try {
          // Create a temporary file from base64
          const base64Data = productData.images.split(",")[1];
          const tempFilePath = path.join(
            process.cwd(),
            `temp-${Date.now()}-avatar.png`
          );

          // Write base64 to file
          await fs.writeFile(tempFilePath, base64Data, "base64");

          // Upload to Cloudinary
          const uploadResult = await cloudinary.uploader.upload(tempFilePath, {
            resource_type: "image",
            folder: "product-avatars", // Optional: specify a folder
          });

          // Remove temporary file
          await fs.unlink(tempFilePath);

          // Update images with Cloudinary URL
          productData.images = uploadResult.secure_url;
        } catch (uploadError) {
          console.error("Base64 image upload error:", uploadError);
          // Fallback to a placeholder if upload fails
          productData.images =
            "https://via.placeholder.com/200x200.png?text=Product";
        }
      }

      // Validate image URL if present
      if (productData.images && typeof productData.images !== "string") {
        return response.code(400).send({
          status: false,
          msg: "Invalid image format",
        });
      }

      // Create and save the product
      const product = new Product(productData);
      await product.save();

      response.code(200).send({
        status: true,
        msg: "Product saved successfully",
        data: product,
      });
    } catch (error) {
      console.error("Product creation error:", error);
      response.code(500).send({
        status: false,
        msg: "Something went wrong",
        error: error.message,
      });
    }
  });

  //   FETCH ALL PRODUCTS
  fastify.get("/api/products", async (request, response) => {
    try {
      const products = await Product.find().sort({ createdAt: -1 });
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
  //   FETCH A SINGLE PRODUCT BY SLUG
  fastify.get("/api/products/:slug/byslug", async (request, response) => {
    try {
      const slug = request.params.slug;
      const product = await Product.findOne({ slug: slug });
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
      if (request.body.name) {
        request.body.slug = slugify(request.body.name.toLowerCase());
      }
      const id = request.params.id;
      const updateData = request.body;

      // Validate images
      if (updateData.images) {
        // Ensure images is an array
        const imagesToUpdate = Array.isArray(updateData.images)
          ? updateData.images
          : [updateData.images];

        // Filter and validate image URLs
        const validImages = imagesToUpdate.filter(
          (img) =>
            typeof img === "string" &&
            (img.startsWith("http") || img.startsWith("https"))
        );

        // Limit to 4 images
        updateData.images = validImages.slice(0, 4);
      }

      // Find and update the product
      const product = await Product.findByIdAndUpdate(id, updateData, {
        new: true,
        runValidators: true,
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
      console.error("Product update error:", error);
      response.code(500).send({
        status: false,
        msg: "Something went wrong",
        error: error instanceof Error ? error.message : "Unknown error",
      });
    }
  });
  //   DELETE PRODUCT
  fastify.delete("/api/products/:id", async (request, response) => {
    try {
      const id = request.params.id;

      // Find the product to get the image URL
      const product = await Product.findById(id);
      if (!product) {
        return response.code(404).send({
          status: false,
          msg: "Product not found",
        });
      }

      // Try to delete the image from Cloudinary
      if (product.images) {
        try {
          const publicId = extractPublicIdFromUrl(product.images);
          if (publicId) {
            await cloudinary.uploader.destroy(publicId);
          }
        } catch (cloudinaryError) {
          console.error("Cloudinary image deletion error:", cloudinaryError);
        }
      }

      // Delete the product from the database
      await Product.findByIdAndDelete(id);

      response.code(200).send({
        status: true,
        msg: "Product deleted successfully",
      });
    } catch (error) {
      console.error("Product deletion error:", error);
      response.code(500).send({
        status: false,
        msg: "Something went wrong",
        error: error.message,
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

  // FLASH SALE
  fastify.get("/api/products/flash-sales", async (request, response) => {
    try {
      const currentDate = new Date();
      const flashSaleProducts = await Product.find({
        "offer.flashSale": true,
        "offer.startDate": { $lte: currentDate },
        "offer.endDate": { $gte: currentDate },
        // "discountPercentage",
      });
      response.send({ status: true, data: flashSaleProducts });
    } catch (error) {
      response
        .code(500)
        .send({ status: false, error: "Failed to fetch sales product" });
    }
  });
}
