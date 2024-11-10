import { getAllProducts } from "@/lib/shopify-gql";
import { NextResponse } from "next/server";

export async function GET() {
  try {
    const products = await getAllProducts();

    return NextResponse.json(products);
  } catch (error) {
    console.error("Failed to fetch products:", error);
    return NextResponse.json(
      { error: "Failed to fetch products" },
      { status: 500 }
    );
  }
}
