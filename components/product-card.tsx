import Image from "next/image";
import Link from "next/link";
import { Card, CardContent, CardHeader } from "./ui/card";
import type { TransformedProduct } from "@/lib/shopify-gql";

export function ProductCard({ product }: { product: TransformedProduct }) {
  return (
    <Link href={`/products/${product.id}`}>
      <Card className="hover:shadow-lg transition-shadow">
        <CardHeader className="p-0">
          {product.image && (
            <div className="aspect-square relative">
              <Image
                src={product.image.src}
                alt={product.image.altText || product.title}
                fill
                className="object-cover rounded-t-lg"
              />
            </div>
          )}
        </CardHeader>
        <CardContent className="p-4">
          <h3 className="font-semibold">{product.title}</h3>
          <p className="text-sm text-muted-foreground">
            {product.variants[0]?.price}
          </p>
          {product.metafields?.map(
            (metafield) =>
              metafield.key === "dimensions" && (
                <p
                  key={metafield.key}
                  className="text-sm text-muted-foreground"
                >
                  {metafield.value}
                </p>
              )
          )}
        </CardContent>
      </Card>
    </Link>
  );
}
