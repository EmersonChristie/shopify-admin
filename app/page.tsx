import Image from "next/image";
import { ProductGrid } from "@/components/product-grid";
import { Button } from "@/components/ui/button";
import Link from "next/link";

export default function Home() {
  return (
    <div className="grid grid-rows-[auto_1fr_auto] min-h-screen p-8 pb-20 gap-16 sm:p-20 font-[family-name:var(--font-geist-sans)]">
      {/* Header */}
      <header className="flex justify-between items-center">
        <Image
          className="dark:invert"
          src="/next.svg"
          alt="Next.js logo"
          width={180}
          height={38}
          priority
        />
        {/* <Link href="/products/new">
          <Button>Create New Product</Button>
        </Link> */}
      </header>

      {/* Main Content */}
      <main className="flex flex-col gap-8">
        <ProductGrid />
      </main>

      {/* Footer */}
      <footer className="flex gap-6 flex-wrap items-center justify-center">
        {/* Your existing footer content */}
      </footer>
    </div>
  );
}
