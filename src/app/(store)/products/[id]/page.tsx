import { createClient } from "@/lib/supabase/server";
import { notFound } from "next/navigation";
import AddToCartButton from "@/components/AddToCartButton";
import { ArrowLeft } from "lucide-react";
import Link from "next/link";
import Image from "next/image";

interface Props {
  params: Promise<{ id: string }>;
}

export default async function ProductPage({ params }: Props) {
  const { id } = await params;
  const supabase = await createClient();
  const { data: product } = await supabase
    .from("products")
    .select("*")
    .eq("id", id)
    .single();
  if (!product) notFound();

  const categoryEmoji: Record<string, string> = {
    tank: "🛢️",
    refill: "🔄",
    regulator: "🔧",
    accessory: "🔩",
    safety: "🧯",
  };

  return (
    <div className="max-w-2xl mx-auto px-4 py-8">
      <Link
        href="/"
        className="flex items-center gap-1 text-sm text-gray-500 hover:text-gray-700 mb-6"
      >
        <ArrowLeft size={15} /> Back to shop
      </Link>
      <div className="bg-white border border-gray-100 rounded-2xl overflow-hidden">
        <div className="h-48 bg-sky-50 flex items-center justify-center text-8xl">
          {product.image_url ? (
            <Image
              src={product.image_url}
              alt={product.name}
              className="h-full w-full object-cover"
              height={500}
              width={500}
            />
          ) : (
            (categoryEmoji[product.category] ?? "📦")
          )}
        </div>
        <div className="p-6">
          <span className="text-xs bg-sky-100 text-sky-700 px-2.5 py-0.5 rounded-full capitalize">
            {product.category}
          </span>
          <h1 className="text-xl font-bold mt-2 mb-1">{product.name}</h1>
          <p className="text-gray-500 text-sm mb-4">{product.description}</p>
          <div className="flex items-center justify-between">
            <span className="text-2xl font-bold text-sky-600">
              ₱{product.price.toLocaleString()}
            </span>
            <span className="text-sm text-gray-400">per {product.unit}</span>
          </div>
          <div className="mt-4">
            <AddToCartButton product={product} />
          </div>
        </div>
      </div>
    </div>
  );
}
