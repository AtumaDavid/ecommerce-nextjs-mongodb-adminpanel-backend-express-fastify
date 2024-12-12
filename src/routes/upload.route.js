import { v2 as cloudinary } from "cloudinary";
import { promises as fs } from "fs";
import path from "path";
// import multipart from "@fastify/multipart";

// Cloudinary upload helper function
const uploadToCloudinary = async (filePath) => {
  try {
    const result = await cloudinary.uploader.upload(filePath, {
      resource_type: "image",
      // folder: "uploads", // Optional: specify a folder in Cloudinary
      // // You can add more options like transformation here
    });
    return result;
  } catch (error) {
    console.error("Cloudinary upload error:", error);
    throw new Error("Image upload to Cloudinary failed");
  }
};

export default async function uploadRoutes(fastify, options) {
  // Image upload route
  fastify.post("/api/upload/image", async (request, reply) => {
    try {
      const data = await request.file();

      if (!data) {
        return reply.code(400).send({
          success: false,
          error: "No file uploaded",
        });
      }

      // Validate file type
      const allowedMimeTypes = [
        "image/jpeg",
        "image/png",
        "image/gif",
        "image/webp",
      ];
      if (!allowedMimeTypes.includes(data.mimetype)) {
        return reply.code(400).send({
          success: false,
          error: "Invalid file type. Only images are allowed.",
        });
      }

      // Save file temporarily
      const tempFilePath = path.join(
        process.cwd(),
        `temp-${Date.now()}-${data.filename}`
      );
      await fs.writeFile(tempFilePath, await data.toBuffer());

      try {
        // Upload to Cloudinary
        const uploadResult = await uploadToCloudinary(tempFilePath);

        // Clean up temporary file
        await fs.unlink(tempFilePath);

        return {
          success: true,
          message: "Image uploaded successfully",
          url: uploadResult.secure_url,
          public_id: uploadResult.public_id,
          format: uploadResult.format,
          bytes: uploadResult.bytes,
        };
      } catch (cloudinaryError) {
        // Clean up temp file in case of Cloudinary upload failure
        await fs.unlink(tempFilePath).catch(() => {});

        return reply.code(500).send({
          success: false,
          error: "Cloudinary upload failed",
        });
      }
    } catch (error) {
      console.error("Image upload error:", error);
      return reply.code(500).send({
        success: false,
        error: "Upload failed",
        details: error.message,
      });
    }
  });

  fastify.post("/api/upload/delete-image", async (request, response) => {
    try {
      const { publicId } = request.body;

      if (!publicId) {
        return response.code(400).send({
          success: false,
          error: "No public ID provided",
        });
      }

      try {
        // Delete image from Cloudinary
        const result = await cloudinary.uploader.destroy(publicId);

        return {
          success: true,
          message: "Image deleted successfully",
          result,
        };
      } catch (cloudinaryError) {
        console.error("Cloudinary deletion error:", cloudinaryError);
        return response.code(500).send({
          success: false,
          error: "Deletion failed",
          details: cloudinaryError.message,
        });
      }
    } catch (error) {
      console.error("Image deletion route error:", error);
      return response.code(500).send({
        success: false,
        error: "Internal server error",
        details: error.message,
      });
    }
  });
}
