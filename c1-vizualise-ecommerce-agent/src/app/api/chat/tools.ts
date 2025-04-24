import type { RunnableToolFunctionWithParse } from "openai/lib/RunnableFunction.mjs";
import { z } from "zod";
import { zodToJsonSchema } from "zod-to-json-schema";
import type { JSONSchema } from "openai/lib/jsonschema.mjs";
import { listProducts, getProductDetails, addToCard, getCart, listProductsSchema, getProductDetailsSchema, addToCartSchema, getCartSchema } from "@/src/services/productService";

export const tools: RunnableToolFunctionWithParse<any>[] = [
  {
    type: "function",
    function: {
      name: "listProducts",
      description: "Lists all available products with their name, ID, price, and imageUrl.",
      parse: (input) => JSON.parse(input) as z.infer<typeof listProductsSchema>,
      parameters: zodToJsonSchema(listProductsSchema) as JSONSchema,
      function: listProducts,
      strict: true,
    },
  },
  {
    type: "function",
    function: {
      name: "getProductDetails",
      description: "Gets detailed information about a specific product, including available sizes, colors, and stock.",
      parse: (input) => JSON.parse(input) as z.infer<typeof getProductDetailsSchema>,
      parameters: zodToJsonSchema(getProductDetailsSchema) as JSONSchema,
      function: getProductDetails,
      strict: true,
    },
  },
  {
    type: "function",
    function: {
      name: "addToCart",
      description: "Adds a specific product variant (size/color) to the shopping cart.",
      parse: (input) => JSON.parse(input) as z.infer<typeof addToCartSchema>,
      parameters: zodToJsonSchema(addToCartSchema) as JSONSchema,
      function: addToCard,
      strict: true,
    },
  },
  {
    type: "function",
    function: {
      name: "getCart",
      description: "Shows the current contents of the shopping cart.",
      parse: (input) => JSON.parse(input) as z.infer<typeof getCartSchema>,
      parameters: zodToJsonSchema(getCartSchema) as JSONSchema,
      function: getCart,
      strict: true,
    },
  },
];
