import { z } from "zod";

export const inventoryQuerySchema = z.object({
  productType: z
    .enum(["gloves", "hats", "scarves", "all"])
    .optional()
    .default("all"),
});

const allInventory = [
  {
    productType: "gloves",
    quantity: 100,
    priceInUSD: 10.0,
    urgentDeliveryDate: "2025-04-15",
    normalDeliveryDate: "2025-04-20",
    imageSrc: "https://images.unsplash.com/photo-1617118602199-d3c05ae37ed8",
  },
  {
    productType: "hats",
    quantity: 200,
    priceInUSD: 15.0,
    urgentDeliveryDate: "2025-04-15",
    normalDeliveryDate: "2025-04-20",
    imageSrc: "https://images.unsplash.com/photo-1556306535-0f09a537f0a3",
  },
  {
    productType: "scarves",
    quantity: 300,
    priceInUSD: 5.0,
    urgentDeliveryDate: "2025-04-15",
    normalDeliveryDate: "2025-04-20",
    imageSrc: "https://images.unsplash.com/photo-1457545195570-67f207084966",
  },
];

export const getInventory = (params: unknown) => {
  const parsedParams = inventoryQuerySchema.safeParse(params);
  if (!parsedParams.success) {
    console.error("Invalid params", parsedParams.error);
    return { success: false, error: parsedParams.error.message };
  }
  return {
    success: true,
    inventory: allInventory.filter(
      (item) =>
        parsedParams.data.productType === "all" ||
        item.productType === parsedParams.data.productType
    ),
  };
};
