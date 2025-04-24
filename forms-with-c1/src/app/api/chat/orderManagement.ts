import { z } from "zod";

export const gloveOrderSchema = z.object({
  kind: z.literal("gloves"),
  quantity: z.number(),
  unit: z.enum(["boxes", "pairs"]),
  deliveryDate: z.string(),
  shipping: z.enum(["normal", "express"]),
});

export const hats = z.object({
  kind: z.literal("hats"),
  quantity: z.number(),
  variants: z.enum(["top", "beanie", "cap"]),
  deliveryDate: z.string(),
  shipping: z.enum(["normal", "express"]),
});

export const scarfOrderSchema = z.object({
  kind: z.literal("scarves"),
  quantity: z.number(),
  colors: z.enum(["red", "blue", "green", "yellow", "purple", "orange"]),
  deliveryDate: z.string(),
  shipping: z.enum(["normal", "express"]),
});

export const orderSchema = z.object({
  order: z.discriminatedUnion("kind", [
    gloveOrderSchema,
    hats,
    scarfOrderSchema,
  ]),
});

type Order = z.infer<typeof orderSchema>;

const orders: Order["order"][] = [];

export const createOrder = async (orderJson: unknown) => {
  const order = orderSchema.safeParse(orderJson);
  if (!order.success) {
    console.error("Invalid order", order.error);
    return {
      success: false,
      error: order.error.message,
    };
  }
  const deliveryDate = new Date(order.data.order.deliveryDate);
  console.log("Creating order", { ...order.data.order, deliveryDate });
  orders.push(order.data.order);
  return {
    success: true,
  };
};

export const getOrderSchema = z.object({
  number: z.number().optional().default(10),
});

export const getOrders = (params: unknown) => {
  const parsedParams = getOrderSchema.safeParse(params);
  if (!parsedParams.success) {
    console.error("Invalid params", parsedParams.error);
    return {
      success: false,
      error: parsedParams.error.message,
    };
  }
  return {
    success: true,
    orders: orders.slice(0, parsedParams.data.number),
  };
};
