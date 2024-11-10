import { GraphQLClient } from "graphql-request";
import type { Product } from "@shopify/hydrogen-react/storefront-api-types";
import "@shopify/shopify-api/adapters/node";
import { shopifyApi, ApiVersion, Session } from "@shopify/shopify-api";

// Define AuthScopes type if it's custom
type AuthScopes = string; // Adjust this definition as needed

const shopify = shopifyApi({
  adminApiAccessToken: process.env.NEXT_PUBLIC_SHOPIFY_ACCESS_TOKEN || "",
  apiVersion:
    (process.env.NEXT_PUBLIC_SHOPIFY_API_VERSION as ApiVersion) ||
    ApiVersion.July24,
  apiKey: process.env.NEXT_PUBLIC_SHOPIFY_API_KEY || "",
  apiSecretKey: process.env.NEXT_PUBLIC_SHOPIFY_API_SECRET || "",
  hostName: process.env.NEXT_PUBLIC_SHOPIFY_HOST_NAME || "localhost",
  scopes: ["read_products", "write_products", "read_media", "write_media"],
  isEmbeddedApp: false,
});

const session = {
  shop: process.env.NEXT_PUBLIC_SHOPIFY_SHOP_NAME || "",
  accessToken: process.env.NEXT_PUBLIC_SHOPIFY_ACCESS_TOKEN || "",
  // id: "session-id",
  // state: "active",
  // isOnline: true,
  // isActive: (scopes: string | string[] | AuthScopes | undefined) => true,
  // isScopeChanged: (scopes: string | string[] | AuthScopes | undefined) => false,
  // isScopeIncluded: () => true,
  // isExpired: () => false,
  // toObject: () => ({}),
  // equals: (otherSession: any) => false,
  // toPropertyArray: () => [],
};

/**
 * Initializes Shopify API client
 * @returns {object} Shopify GraphQL client
 */
function initializeShopifyClient() {
  return new shopify.clients.Graphql({ session: session as any });
}

// const endpoint = `https://${process.env.SHOPIFY_SHOP_NAME}/admin/api/${process.env.SHOPIFY_API_VERSION}/graphql.json`;

// const graphqlClient = new GraphQLClient(endpoint, {
//   headers: {
//     "X-Shopify-Access-Token": process.env.SHOPIFY_ACCESS_TOKEN!,
//   },
// });

// export const gql = String.raw;

// Define your queries
export const PRODUCTS_QUERY = `
  query GetProducts($cursor: String) {
    products(first: 250, after: $cursor) {
      pageInfo {
        hasNextPage
        endCursor
      }
      edges {
        node {
          id
          title
          handle
          description
          images(first: 1) {
            edges {
              node {
                url
                altText
              }
            }
          }
          variants(first: 1) {
            edges {
              node {
                id
                price
              }
            }
          }
          metafields(first: 10) {
            edges {
              node {
                key
                value
                namespace
              }
            }
          }
        }
      }
    }
  }
`;

// Type for the transformed product data
export interface TransformedProduct {
  id: string;
  title: string;
  image?: {
    src: string;
    altText?: string;
  };
  variants: {
    price: string;
  }[];
  metafields?: {
    id: string;
    key: string;
    value: string;
    namespace: string;
    createdAt?: string;
    parentResource?: any;
    type?: string;
    updatedAt?: string;
  }[];
}

// Function to transform GraphQL response to our expected format
function transformProduct(product: any): TransformedProduct {
  return {
    id: product.id,
    title: product.title,
    image: product.images.edges[0]
      ? {
          src: product.images.edges[0].node.url,
          altText: product.images.edges[0].node.altText,
        }
      : undefined,
    variants: product.variants.edges.map((variant: any) => ({
      price: variant.node.price,
    })),
    metafields: product.metafields.edges.map((metafield: any) => ({
      id: metafield.node.id,
      key: metafield.node.key,
      value: metafield.node.value,
      namespace: metafield.node.namespace,
      createdAt: metafield.node.createdAt,
      parentResource: metafield.node.parentResource,
      type: metafield.node.type,
      updatedAt: metafield.node.updatedAt,
    })),
  } satisfies TransformedProduct;
}

// Define the expected structure of the GraphQL response
interface ProductsQueryResponse {
  data: {
    products: {
      pageInfo: {
        hasNextPage: boolean;
        endCursor: string;
      };
      edges: Array<{
        node: {
          id: string;
          title: string;
          images: {
            edges: Array<{
              node: {
                url: string;
                altText: string | null;
              };
            }>;
          };
          variants: {
            edges: Array<{
              node: {
                id: string;
                price: string;
              };
            }>;
          };
          metafields: {
            edges: Array<{
              node: {
                id: string;
                key: string;
                value: string;
                namespace: string;
                createdAt?: string;
                parentResource?: any;
                type?: string;
                updatedAt?: string;
              };
            }>;
          };
        };
      }>;
    };
  };
}

// Define a type for the query variables
type ProductsQueryVariables = {
  cursor?: string;
};

export async function getAllProducts(): Promise<TransformedProduct[]> {
  const shopifyClient = initializeShopifyClient();
  const allProducts: TransformedProduct[] = [];
  let hasNextPage = true;
  let cursor: string | null = null;

  try {
    while (hasNextPage) {
      const variables: ProductsQueryVariables = cursor ? { cursor } : {};
      const response = await shopifyClient.request(PRODUCTS_QUERY, {
        variables,
      });

      if (response?.data?.products) {
        const products = response.data.products.edges.map(
          (edge: { node: any }) => transformProduct(edge.node)
        );
        allProducts.push(...products);

        hasNextPage = response.data.products.pageInfo.hasNextPage;
        cursor = response.data.products.pageInfo.endCursor;
      } else {
        hasNextPage = false;
      }
    }

    return allProducts;
  } catch (error) {
    console.error("Failed to fetch products:", error);
    return [];
  }
}

// Update the CREATE_PRODUCT_MUTATION
export const CREATE_PRODUCT_MUTATION = `
  mutation productCreate($input: ProductInput!) {
    productCreate(input: $input) {
      product {
        id
        title
        descriptionHtml
        handle
        status
        vendor
        productType
        media(first: 10) {
          nodes {
            id
            mediaContentType
            alt
            preview {
              image {
                url
              }
            }
          }
        }
        metafields(first: 10) {
          edges {
            node {
              id
              namespace
              key
              value
            }
          }
        }
      }
      userErrors {
        field
        message
      }
    }
  }
`;

// Add this interface for the form data
export interface ProductFormData {
  title: string;
  description: string;
  price: string;
  images: File[];
  trackQuantity: boolean;
  quantity: number;
  metafields: {
    title_tag: string;
    description_tag: string;
    medium: string;
    authentication: string;
    width: string;
    height: string;
    dimensions: string;
    year: string;
  };
}

// Add these mutations for image upload
export const STAGE_UPLOAD_MUTATION = `
  mutation stagedUploadsCreate($input: [StagedUploadInput!]!) {
    stagedUploadsCreate(input: $input) {
      stagedTargets {
        url
        resourceUrl
        parameters {
          name
          value
        }
      }
      userErrors {
        field
        message
      }
    }
  }
`;

// Update the CREATE_MEDIA_MUTATION
export const CREATE_MEDIA_MUTATION = `
  mutation productCreateMedia($media: [CreateMediaInput!]!, $productId: ID!) {
    productCreateMedia(media: $media, productId: $productId) {
      media {
        ... on MediaImage {
          id
          mediaContentType
          alt
          image {
            url
          }
        }
      }
      mediaUserErrors {
        field
        message
      }
    }
  }
`;

// Update the uploadImages function
async function uploadImages(
  files: File[],
  productId: string
): Promise<string[]> {
  const shopifyClient = initializeShopifyClient();
  const mediaIds: string[] = [];

  try {
    // 1. Generate staged uploads
    const stagedUploadsResponse = await shopifyClient.request(
      STAGE_UPLOAD_MUTATION,
      {
        variables: {
          input: files.map((file) => ({
            resource: "IMAGE",
            filename: file.name,
            mimeType: file.type || "image/jpeg",
            fileSize: String(file.size),
            httpMethod: "POST",
          })),
        },
      }
    );

    console.log("Staged uploads response:", stagedUploadsResponse);
    const { stagedTargets } = stagedUploadsResponse.data.stagedUploadsCreate;

    // 2. Upload each file to its staged target
    for (let i = 0; i < files.length; i++) {
      const target = stagedTargets[i];
      const file = files[i];

      const formData = new FormData();
      target.parameters.forEach((param: { name: string; value: string }) => {
        formData.append(param.name, param.value);
      });
      formData.append("file", file);

      const uploadResponse = await fetch(target.url, {
        method: "POST",
        body: formData,
      });

      if (!uploadResponse.ok) {
        throw new Error(`Failed to upload file ${file.name}`);
      }

      // 3. Create media object using the resourceUrl
      const createMediaResponse = await shopifyClient.request(
        CREATE_MEDIA_MUTATION,
        {
          variables: {
            media: [
              {
                mediaContentType: "IMAGE",
                originalSource: target.resourceUrl,
                alt: file.name,
              },
            ],
            productId,
          },
        }
      );

      console.log("Media creation response:", createMediaResponse);

      if (
        createMediaResponse.data?.productCreateMedia?.mediaUserErrors?.length >
        0
      ) {
        throw new Error(
          createMediaResponse.data.productCreateMedia.mediaUserErrors[0].message
        );
      }

      const mediaId = createMediaResponse.data.productCreateMedia.media[0].id;
      mediaIds.push(mediaId);
    }

    return mediaIds;
  } catch (error) {
    console.error("Failed to upload images:", error);
    throw error;
  }
}

// Update the createProduct function to handle media after product creation
export async function createProduct(
  productData: ProductFormData
): Promise<any> {
  const shopifyClient = initializeShopifyClient();

  try {
    // First create the product without media
    const response = await shopifyClient.request(CREATE_PRODUCT_MUTATION, {
      variables: {
        input: {
          title: productData.title,
          descriptionHtml: productData.description,
          status: "ACTIVE",
          productType: "Artwork",
          vendor: "Emerson",
          metafields: [
            {
              namespace: "global",
              key: "title_tag",
              value: productData.metafields.title_tag,
              type: "multi_line_text_field",
            },
            {
              namespace: "global",
              key: "description_tag",
              value: productData.metafields.description_tag,
              type: "multi_line_text_field",
            },
            {
              namespace: "custom",
              key: "medium",
              value: productData.metafields.medium,
              type: "multi_line_text_field",
            },
            {
              namespace: "custom",
              key: "authentication",
              value: productData.metafields.authentication,
              type: "multi_line_text_field",
            },
            {
              namespace: "custom",
              key: "width",
              value: JSON.stringify({
                value: parseFloat(productData.metafields.width),
                unit: "in",
              }),
              type: "dimension",
            },
            {
              namespace: "custom",
              key: "height",
              value: JSON.stringify({
                value: parseFloat(productData.metafields.height),
                unit: "in",
              }),
              type: "dimension",
            },
            {
              namespace: "custom",
              key: "dimensions",
              value: productData.metafields.dimensions,
              type: "multi_line_text_field",
            },
            {
              namespace: "custom",
              key: "year",
              value: productData.metafields.year,
              type: "number_integer",
            },
          ],
        },
      },
    });

    if (response.data?.productCreate?.userErrors?.length > 0) {
      throw new Error(response.data.productCreate.userErrors[0].message);
    }

    const productId = response.data.productCreate.product.id;

    // Then upload and attach media if any exist
    if (productData.images && productData.images.length > 0) {
      const validFiles = productData.images.filter(
        (file) => file instanceof File && file.name && file.size > 0
      );

      if (validFiles.length > 0) {
        await uploadImages(validFiles, productId);
      }
    }

    return response;
  } catch (error) {
    console.error("Failed to create product:", error);
    throw error;
  }
}

// Add the UPDATE_PRODUCT_MUTATION
export const UPDATE_PRODUCT_MUTATION = `
  mutation productUpdate($input: ProductInput!) {
    productUpdate(input: $input) {
      product {
        id
        title
        descriptionHtml
        handle
        status
        vendor
        productType
        media(first: 10) {
          nodes {
            id
            mediaContentType
            alt
            preview {
              image {
                url
              }
            }
          }
        }
        metafields(first: 10) {
          edges {
            node {
              id
              namespace
              key
              value
            }
          }
        }
      }
      userErrors {
        field
        message
      }
    }
  }
`;

// Add the updateProduct function
export async function updateProduct(
  productId: string,
  productData: ProductFormData
): Promise<any> {
  const shopifyClient = initializeShopifyClient();

  try {
    // First update the product details
    const response = await shopifyClient.request(UPDATE_PRODUCT_MUTATION, {
      variables: {
        input: {
          id: productId,
          title: productData.title,
          descriptionHtml: productData.description,
          status: "ACTIVE",
          productType: "Artwork",
          vendor: "Emerson",
          metafields: [
            {
              namespace: "global",
              key: "title_tag",
              value: productData.metafields.title_tag,
              type: "multi_line_text_field",
            },
            {
              namespace: "global",
              key: "description_tag",
              value: productData.metafields.description_tag,
              type: "multi_line_text_field",
            },
            {
              namespace: "custom",
              key: "medium",
              value: productData.metafields.medium,
              type: "multi_line_text_field",
            },
            {
              namespace: "custom",
              key: "authentication",
              value: productData.metafields.authentication,
              type: "multi_line_text_field",
            },
            {
              namespace: "custom",
              key: "width",
              value: JSON.stringify({
                value: parseFloat(productData.metafields.width),
                unit: "in",
              }),
              type: "dimension",
            },
            {
              namespace: "custom",
              key: "height",
              value: JSON.stringify({
                value: parseFloat(productData.metafields.height),
                unit: "in",
              }),
              type: "dimension",
            },
            {
              namespace: "custom",
              key: "dimensions",
              value: productData.metafields.dimensions,
              type: "multi_line_text_field",
            },
            {
              namespace: "custom",
              key: "year",
              value: productData.metafields.year,
              type: "number_integer",
            },
          ],
        },
      },
    });

    if (response.data?.productUpdate?.userErrors?.length > 0) {
      throw new Error(response.data.productUpdate.userErrors[0].message);
    }

    // Then handle any new images if they exist
    if (productData.images && productData.images.length > 0) {
      const validFiles = productData.images.filter(
        (file) => file instanceof File && file.name && file.size > 0
      );

      if (validFiles.length > 0) {
        await uploadImages(validFiles, productId);
      }
    }

    return response;
  } catch (error) {
    console.error("Failed to update product:", error);
    throw error;
  }
}
