"use client";

import { useEffect, useState } from "react";
import { ProductCard } from "./product-card";
import { CreateProductDialog } from "./create-product-dialog";
import type { TransformedProduct } from "@/lib/shopify-gql";

export function ProductGrid() {
  const [products, setProducts] = useState<TransformedProduct[]>([]);

  useEffect(() => {
    const fetchProducts = async () => {
      try {
        const response = await fetch("/api/products");
        const products = await response.json();
        setProducts(products);
      } catch (error) {
        console.error("Failed to fetch products:", error);
      }
    };

    // Initial fetch
    fetchProducts();

    // Listen for product creation
    const handleProductCreated = () => {
      fetchProducts();
    };

    window.addEventListener("productCreated", handleProductCreated);

    // Cleanup
    return () => {
      window.removeEventListener("productCreated", handleProductCreated);
    };
  }, []);

  return (
    <div className="space-y-6">
      <div className="flex justify-end">
        <CreateProductDialog />
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
        {products.map((product) => (
          <ProductCard key={product.id} product={product} />
        ))}
      </div>
    </div>
  );
}
