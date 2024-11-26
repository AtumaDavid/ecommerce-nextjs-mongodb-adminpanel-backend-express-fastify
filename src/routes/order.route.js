import { Order } from "../models/order.model.js";
import { Product } from "../models/product.model.js";
// import { User } from "../models/user.model.js";

const generateOrderId = () => {
  const timestamp = Date.now(); // Get the current timestamp
  const randomNum = Math.floor(Math.random() * 10000000000); // Generate a random number
  return `#${timestamp}-${randomNum}`;
};

export default async function orderRoutes(fastify, options) {
  // CREATE ORDER
  fastify.post("/api/orders", async (request, response) => {
    try {
      const orderData = request.body;

      const newOrder = new Order({
        orderId: generateOrderId(),
        paymentType: orderData?.payment,
        orderType: orderData?.orderType,
        items: orderData?.items,
        shippingAddress: orderData?.shippingAddress,
        billingAddress: orderData?.billingAddress,
        shippingCharge: orderData?.shippingCharge,
        discount: orderData?.discount,
        total: orderData?.total,
        orderStatus: "Pending",
        tax: orderData?.tax,
        subTotal: orderData?.subTotal,
        userId: request.user.id,
      });

      await newOrder.save();

      // Create pay order

      response.code(201).send({
        status: true,
        message: "Order created successfully",
        data: newOrder,
      });
    } catch (error) {
      response.code(500).send({
        status: false,
        message: "Error creating order",
        error: error,
      });
    }
  });
}
