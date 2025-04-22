import type { RunnableToolFunctionWithParse } from "openai/lib/RunnableFunction.mjs";
import { z } from "zod";
import { zodToJsonSchema } from "zod-to-json-schema";
import type { JSONSchema } from "openai/lib/jsonschema.mjs";

// --- Mock Data ---
interface ProductVariant {
  size: string;
  color: string;
  stock: number;
}

interface ClothingProduct {
  id: string;
  name: string;
  category: string;
  basePrice: number;
  description: string;
  variants: ProductVariant[];
  imageUrl: string;
}

const mockProducts: ClothingProduct[] = [
  {
    id: "prod_101",
    name: "Classic Cotton T-Shirt",
    category: "Tops",
    basePrice: 25,
    description: "A comfortable and durable 100% cotton t-shirt.",
    imageUrl: "https://images.unsplash.com/photo-1713881587420-113c1c43e28a",
    variants: [
      { size: "S", color: "White", stock: 15 },
      { size: "M", color: "White", stock: 20 },
      { size: "L", color: "White", stock: 10 },
      { size: "S", color: "Black", stock: 12 },
      { size: "M", color: "Black", stock: 18 },
      { size: "L", color: "Black", stock: 5 },
      { size: "M", color: "Blue", stock: 8 },
    ],
  },
  {
    id: "prod_205",
    name: "Slim Fit Jeans",
    category: "Bottoms",
    basePrice: 60,
    description: "Modern slim fit jeans with a slight stretch.",
    imageUrl: "https://images.unsplash.com/photo-1721665107649-11e9773821b9",
    variants: [
      { size: "30x32", color: "Indigo", stock: 8 },
      { size: "32x32", color: "Indigo", stock: 10 },
      { size: "34x32", color: "Indigo", stock: 7 },
      { size: "32x32", color: "Black", stock: 5 },
      { size: "34x32", color: "Black", stock: 6 },
    ],
  },
  {
    id: "prod_310",
    name: "Wool Blend Sweater",
    category: "Tops",
    basePrice: 80,
    description: "A warm and stylish sweater made from a wool blend.",
    imageUrl: "https://images.unsplash.com/photo-1529635457390-aa69ba54d77d",
    variants: [
      { size: "M", color: "Grey", stock: 6 },
      { size: "L", color: "Grey", stock: 9 },
      { size: "XL", color: "Grey", stock: 4 },
      { size: "M", color: "Navy", stock: 7 },
      { size: "L", color: "Navy", stock: 5 },
    ],
  },
];

// In-memory cart for simplicity in this example
const shoppingCart: { productId: string; variant: ProductVariant; quantity: number }[] = [];

// --- Tool Schemas ---
const listProductsSchema = z.object({});

const getProductDetailsSchema = z.object({
  productId: z.string().describe("The ID of the product to get details for (e.g., prod_101)"),
});

const addToCartSchema = z.object({
  productId: z.string().describe("The ID of the product to add"),
  size: z.string().describe("The size of the product variant"),
  color: z.string().describe("The color of the product variant"),
  quantity: z.number().describe("Number of items to add"),
});

const getCartSchema = z.object({}); // No parameters needed

// --- Tools ---
export const tools: RunnableToolFunctionWithParse<any>[] = [
  // --- Search Products ---
  {
    type: "function",
    function: {
      name: "listProducts",
      description: "Lists all available products with their name, ID, price, and imageUrl.",
      parse: (input) => JSON.parse(input) as z.infer<typeof listProductsSchema>,
      parameters: zodToJsonSchema(listProductsSchema) as JSONSchema,
      function: async () => {
        console.log(`Listing all products`);
        const summary = mockProducts.map(p => ({ id: p.id, name: p.name, price: p.basePrice, imageUrl: p.imageUrl }));
        return JSON.stringify(summary);
      },
      strict: true,
    },
  },
  // --- Get Product Details ---
  {
    type: "function",
    function: {
      name: "getProductDetails",
      description: "Gets detailed information about a specific product, including available sizes, colors, and stock.",
      parse: (input) => JSON.parse(input) as z.infer<typeof getProductDetailsSchema>,
      parameters: zodToJsonSchema(getProductDetailsSchema) as JSONSchema,
      function: async ({ productId }: z.infer<typeof getProductDetailsSchema>) => {
        console.log(`Getting details for product ID: ${productId}`);
        const product = mockProducts.find(p => p.id === productId);
        if (product) {
          // Return details including variants with stock > 0
          const availableVariants = product.variants.filter(v => v.stock > 0);
          return JSON.stringify({ ...product, variants: availableVariants });
        } else {
          return `Product with ID ${productId} not found.`;
        }
      },
      strict: true,
    },
  },
  // --- Add to Cart ---
  {
    type: "function",
    function: {
      name: "addToCart",
      description: "Adds a specific product variant (size/color) to the shopping cart.",
      parse: (input) => JSON.parse(input) as z.infer<typeof addToCartSchema>,
      parameters: zodToJsonSchema(addToCartSchema) as JSONSchema,
      function: async ({ productId, size, color, quantity }: z.infer<typeof addToCartSchema>) => {
        console.log(`Attempting to add to cart: ${quantity} x ${productId} (${size}, ${color})`);
        const product = mockProducts.find(p => p.id === productId);
        if (!product) {
          return `Error: Product with ID ${productId} not found.`;
        }
        const variantIndex = product.variants.findIndex(v => v.size === size && v.color === color);
        if (variantIndex === -1) {
          return `Error: Variant (${size}, ${color}) not found for product ${productId}.`;
        }
        const variant = product.variants[variantIndex];
        if (variant.stock < quantity) {
          return `Error: Not enough stock for ${product.name} (${size}, ${color}). Only ${variant.stock} available.`;
        }

        // Simulate stock reduction and add to cart
        product.variants[variantIndex].stock -= quantity; // Update mock stock

        const existingCartItemIndex = shoppingCart.findIndex(item =>
          item.productId === productId && item.variant.size === size && item.variant.color === color
        );

        if (existingCartItemIndex > -1) {
          shoppingCart[existingCartItemIndex].quantity += quantity;
        } else {
          shoppingCart.push({ productId, variant: { ...variant, stock: product.variants[variantIndex].stock }, quantity }); // Store current stock state *after* adding
        }

        console.log("Current Cart:", shoppingCart);
        return `Successfully added ${quantity} x ${product.name} (${size}, ${color}) to cart. Total stock remaining for this variant: ${variant.stock}.`;
      },
      strict: true,
    },
  },
  // --- Get Cart ---
  {
    type: "function",
    function: {
      name: "getCart",
      description: "Shows the current contents of the shopping cart.",
      parse: (input) => JSON.parse(input) as z.infer<typeof getCartSchema>,
      parameters: zodToJsonSchema(getCartSchema) as JSONSchema,
      function: async () => {
        console.log("Getting cart contents");
        if (shoppingCart.length === 0) {
          return "Your shopping cart is currently empty.";
        }
        // Enhance cart representation for the LLM
        const cartDetails = shoppingCart.map(item => {
          const product = mockProducts.find(p => p.id === item.productId);
          return {
            productId: item.productId,
            name: product?.name || 'Unknown Product',
            imageUrl: product?.imageUrl || '',
            size: item.variant.size,
            color: item.variant.color,
            quantity: item.quantity,
            pricePerItem: product?.basePrice || 0,
            itemTotal: (product?.basePrice || 0) * item.quantity,
          };
        });
        const cartTotal = cartDetails.reduce((sum, item) => sum + item.itemTotal, 0);
        return `Cart Contents: ${JSON.stringify(cartDetails)}. Total Price: $${cartTotal.toFixed(2)}`;
      },
      strict: true,
    },
  },
  // Add removeFromCart and checkout tools later if needed
];
