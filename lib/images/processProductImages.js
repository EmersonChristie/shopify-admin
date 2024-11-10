import fs from "fs";
import path from "path";
import axios from "axios";
import {
  getAllProducts,
  createProductMetafield,
  updateProduct,
  getProductMetafields,
} from "../shopify/products/services.js";

import { getProductById } from "../shopify/products/graphqlServices.js";

/**
 * Processes a list of products to update metafields.
 * @param {Array<Object>} products - List of products to process.
 */
async function processProductImages(products) {
  for (const product of products) {
    try {
      const productMetafields = await getProductMetafields(product.id);

      // Append dimensions to the product description
      const dimensionsMetafield = productMetafields.find(
        (mf) => mf.namespace === "custom" && mf.key === "dimensions"
      );
      if (dimensionsMetafield) {
        const dimensions = dimensionsMetafield.value;
        const updatedDescription = `${product.body_html}\nDimensions: ${dimensions}`;
        await updateProduct(product.id, { body_html: updatedDescription });
      } else {
        console.warn(
          `Dimensions metafield not found for product ${product.id}`
        );
      }
    } catch (error) {
      console.error(`Failed to process product ${product.id}:`, error);
    }
  }
}

// Example usage
(async () => {
  const products = await getAllProducts();
  await processProductImages(products);
})();
