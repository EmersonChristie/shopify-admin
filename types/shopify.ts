import type {
  Product as ShopifyProduct,
  Metafield,
  ProductVariantConnection,
} from "@shopify/hydrogen-react/storefront-api-types";

export interface Product extends Partial<ShopifyProduct> {
  id: string;
  title: string;
  image?: {
    src: string;
    altText?: string;
  };
  variants: ProductVariantConnection;
  metafields?: Metafield[];
}
