import { updateProduct } from "@/lib/shopify-gql";
import { NextRequest, NextResponse } from "next/server";

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const productId = formData.get("productId") as string;

    if (!productId) {
      return NextResponse.json(
        { error: "Product ID is required" },
        { status: 400 }
      );
    }

    // Convert FormData to the expected format
    const productData = {
      title: formData.get("title") as string,
      description: formData.get("description") as string,
      price: formData.get("price") as string,
      trackQuantity: formData.get("trackQuantity") === "true",
      quantity: Number(formData.get("quantity")),
      images: [] as File[],
      metafields: {} as any,
    };

    // Get all the files and metafields
    const files: File[] = [];
    formData.forEach((value, key) => {
      if (key.startsWith("images[") && value instanceof File) {
        files.push(value);
      }
      if (key.startsWith("metafields[")) {
        const metafieldKey = key.match(/\[(.*?)\]/)?.[1];
        if (metafieldKey) {
          productData.metafields[metafieldKey] = value;
        }
      }
    });

    productData.images = files;

    console.log("Processing product update:", {
      productId,
      ...productData,
      images: productData.images.map((file) => ({
        name: file.name,
        type: file.type,
        size: file.size,
      })),
    });

    const response = await updateProduct(productId, productData);
    return NextResponse.json(response);
  } catch (error) {
    console.error("Failed to update product:", error);
    return NextResponse.json(
      { error: "Failed to update product" },
      { status: 500 }
    );
  }
}
