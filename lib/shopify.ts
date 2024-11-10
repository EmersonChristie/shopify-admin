import "@shopify/shopify-api/adapters/node";
import { shopifyApi, ApiVersion, Session } from "@shopify/shopify-api";
import fs from "fs";
import path from "path";

const shopify = shopifyApi({
  adminApiAccessToken: process.env.SHOPIFY_ACCESS_TOKEN,
  apiVersion: (process.env.SHOPIFY_API_VERSION as ApiVersion) || "2023-01",
  apiKey: process.env.SHOPIFY_API_KEY || "",
  apiSecretKey: process.env.SHOPIFY_API_SECRET || "",
  hostName: process.env.SHOPIFY_HOST_NAME || "localhost",
  isEmbeddedApp: false,
  scopes: ["read_products", "write_products", "read_media", "write_media"],
});

const session = new Session({
  id: "session-id", // Replace with a unique session ID
  shop: process.env.SHOPIFY_SHOP_NAME || "",
  state: "state", // Replace with the appropriate state
  isOnline: true, // or false, depending on your app's requirements
  accessToken: process.env.SHOPIFY_ACCESS_TOKEN || "",
  // Add other required properties as needed
});

/**
 * Initializes Shopify API client
 * @returns {object} Shopify Rest client
 */
function initializeShopifyClient() {
  return new shopify.clients.Rest({ session: session });
}

// Define a type or interface for product data
interface ProductData {
  title: string;
  body_html?: string;
  vendor?: string;
  product_type?: string;
  // Add other fields as necessary
}

/**
 * Create a new product on Shopify
 * @param {ProductData} productData - Product data to create
 * @returns {Object} The created product object
 */
async function createProduct(productData: ProductData) {
  const shopifyClient = initializeShopifyClient();
  try {
    const response = await shopifyClient.post({
      path: "products.json",
      data: { product: productData },
      //   type: shopify.clients.Rest.DataType.JSON, // Updated line
    });
    console.log("Product created successfully:", response.body);
    return response.body.product;
  } catch (error) {
    console.error("Failed to create product:", error);
    throw error;
  }
}

/**
 * Retrieve a product by ID
 * @param {string} productId - ID of the product to retrieve
 * @returns {Object} The retrieved product object
 */
async function getProductById(productId: string) {
  const shopifyClient = initializeShopifyClient();
  try {
    const response = await shopifyClient.get({
      path: `products/${productId}.json`,
      //   type: shopify.clients.Rest.DataType.JSON, // Updated line
    });
    console.log("Product retrieved successfully:", response.body);
    return response.body.product;
  } catch (error) {
    console.error(`Failed to retrieve product with ID ${productId}:`, error);
    throw error;
  }
}

/**
 * Update an existing product by ID
 * @param {string} productId - ID of the product to update
 * @param {Object} updateData - Data to update the product with
 * @returns {Object} The updated product object
 */
async function updateProduct(productId: string, updateData: object) {
  const shopifyClient = initializeShopifyClient();
  try {
    const response = await shopifyClient.put({
      path: `products/${productId}.json`,
      data: { product: updateData },
      //   type: shopify.clients.Rest.DataType.JSON, // Updated line
    });
    console.log("Product updated successfully:", response.body);
    return response.body.product;
  } catch (error) {
    console.error(`Failed to update product with ID ${productId}:`, error);
    throw error;
  }
}

/**
 * Delete a product by ID
 * @param {string} productId - ID of the product to delete
 * @returns {boolean} True if the product was deleted successfully
 */
async function deleteProduct(productId: string) {
  const shopifyClient = initializeShopifyClient();
  try {
    await shopifyClient.delete({
      path: `products/${productId}.json`,
    });
    console.log(`Product with ID ${productId} deleted successfully.`);
    return true;
  } catch (error) {
    console.error(`Failed to delete product with ID ${productId}:`, error);
    throw error;
  }
}

/**
 * Get a list of all products (paginated)
 * @param {number} limit - Number of products to retrieve per page
 * @param {number} page - The page number to retrieve (optional)
 * @returns {Array<Object>} List of products
 */
async function getAllProducts(limit = 10) {
  const shopifyClient = initializeShopifyClient();
  let products: ProductData[] = [];
  let nextPageInfo: {} = {};

  try {
    do {
      const response = await shopifyClient.get({
        path: "products.json",
        query: { limit, page_info: nextPageInfo },
      });
      console.log("response.body", response.body);

      products = products.concat(response.body.products);
      nextPageInfo = response.pageInfo?.nextPage?.query?.page_info || {};
    } while (Object.keys(nextPageInfo).length > 0);

    console.log("Products retrieved successfully:", products);
    return products;
  } catch (error) {
    console.error("Failed to retrieve products:", error);
    throw error;
  }
}

interface ProductOptions {
  limit?: number;
  title?: string;
  vendor?: string;
  handle?: string;
}

/**
 * Get a list of products with optional filters
 * @param {Object} options - Filtering options
 * @param {number} options.limit - Number of products to retrieve per page
 * @param {string} options.title - Title to filter products
 * @param {string} options.vendor - Vendor to filter products
 * @param {string} options.handle - Handle to filter products
 * @returns {Array<Object>} List of products
 */
async function getProducts(options: ProductOptions = {}) {
  const { limit = 50, title, vendor, handle } = options;
  const shopifyClient = initializeShopifyClient();
  let products = [];
  let params: {
    limit: number;
    title?: string;
    vendor?: string;
    handle?: string;
  } = { limit };

  if (title) params.title = title;
  if (vendor) params.vendor = vendor;
  if (handle) params.handle = handle;

  try {
    const response = await shopifyClient.get({
      path: "products",
      query: params,
    });

    products = response.body.products;
    console.log(`Retrieved ${products.length} products.`);
    return products;
  } catch (error) {
    console.error("Failed to retrieve products:", error);
    throw error;
  }
}

/**
 * Update the images of a product
 * @param {string} productId - ID of the product to update
 * @param {Array<string>} imageFilenames - List of image filenames in the static/output-images directory
 * @returns {Object} The updated product object with new images
 */
async function updateProductImages(
  productId: string,
  images: Array<{ position: number; [key: string]: any }>
) {
  const shopifyClient = initializeShopifyClient();
  try {
    for (const image of images) {
      const response = await shopifyClient.post({
        path: `products/${productId}/images.json`,
        data: { image },
      });
      console.log(
        `Image uploaded to position ${image.position} for product ${productId}`
      );
    }
  } catch (error) {
    console.error(
      `Failed to update images for product with ID ${productId}:`,
      error
    );
    throw error;
  }
}

/**
 * Retrieve metafields for a product by ID
 * @param {string} productId - ID of the product to retrieve metafields for
 * @returns {Array<Object>} List of metafields
 */
async function getProductMetafields(productId: string) {
  const shopifyClient = initializeShopifyClient();
  try {
    const response = await shopifyClient.get({
      path: `products/${productId}/metafields.json`,
    });
    console.log("Metafields retrieved successfully:", response.body);
    return response.body.metafields;
  } catch (error) {
    console.error(
      `Failed to retrieve metafields for product with ID ${productId}:`,
      error
    );
    throw error;
  }
}

/**
 * Create a metafield for a product by ID
 * @param {string} productId - ID of the product to create the metafield for
 * @param {Object} metafieldData - Data to create the metafield with
 * @returns {Object} The created metafield object
 */
async function createProductMetafield(
  productId: string,
  metafieldData: object
) {
  const shopifyClient = initializeShopifyClient();
  try {
    const response = await shopifyClient.post({
      path: `products/${productId}/metafields.json`,
      data: { metafield: metafieldData },
    });
    console.log("Metafield created successfully:", response.body);
    return response.body.metafield;
  } catch (error) {
    console.error(
      `Failed to create metafield for product with ID ${productId}:`,
      error
    );
    throw error;
  }
}

/**
 * Update a metafield for a product by ID
 * @param {string} productId - ID of the product to update the metafield for
 * @param {string} metafieldId - ID of the metafield to update
 * @param {Object} metafieldData - Data to update the metafield with
 * @returns {Object} The updated metafield object
 */
async function updateProductMetafield(
  productId: string,
  metafieldId: string,
  metafieldData: object
) {
  const shopifyClient = initializeShopifyClient();
  try {
    const response = await shopifyClient.put({
      path: `products/${productId}/metafields/${metafieldId}.json`,
      data: { metafield: metafieldData },
    });
    console.log("Metafield updated successfully:", response.body);
    return response.body.metafield;
  } catch (error) {
    console.error(
      `Failed to update metafield with ID ${metafieldId} for product with ID ${productId}:`,
      error
    );
    throw error;
  }
}

export {
  createProduct,
  getProductById,
  updateProduct,
  getAllProducts,
  updateProductImages,
  getProductMetafields,
  createProductMetafield,
  updateProductMetafield,
};
