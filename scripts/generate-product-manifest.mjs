import { existsSync, mkdirSync, readdirSync, readFileSync, writeFileSync } from "node:fs";
import { join } from "node:path";

const projectRoot = process.cwd();
const productsRoot = join(projectRoot, "public", "products");
const outputPath = join(projectRoot, "app", "product-data.ts");

const imageOrder = [
  ["front", "Front"],
  ["back", "Back"],
  ["left", "Left"],
  ["right", "Right"],
  ["45-degree", "45 Degree"],
  ["closeup-fabric", "Fabric"],
  ["fabric", "Fabric"],
  ["neck", "Neck"],
  ["sleeve", "Sleeve"],
  ["lifestyle-1", "Lifestyle 1"],
  ["lifestyle-2", "Lifestyle 2"],
  ["flatlay", "Flatlay"],
];

const allowedExtensions = new Set([".jpg", ".jpeg", ".png", ".webp", ".avif"]);

function titleFromSlug(slug) {
  return slug.split("-").map((part) => part ? part[0].toUpperCase() + part.slice(1) : part).join(" ");
}

function extensionOf(file) {
  const index = file.lastIndexOf(".");
  return index === -1 ? "" : file.slice(index).toLowerCase();
}

function keyOf(file) {
  return file.replace(/\.(jpg|jpeg|png|webp|avif)$/i, "");
}

function orderIndex(file) {
  const key = keyOf(file);
  const index = imageOrder.findIndex(([orderedKey]) => orderedKey === key);
  return index === -1 ? 999 : index;
}

function labelFor(file) {
  const key = keyOf(file);
  return imageOrder.find(([orderedKey]) => orderedKey === key)?.[1] ?? titleFromSlug(key);
}

function readMetadata(slug) {
  const metadataPath = join(productsRoot, slug, "metadata.json");
  if (!existsSync(metadataPath)) return {};
  return JSON.parse(readFileSync(metadataPath, "utf8"));
}

function normalizeMetadataImages(metadata, slug) {
  if (!Array.isArray(metadata.images)) return null;
  return metadata.images
    .map((entry) => typeof entry === "string" ? { file: entry } : entry)
    .filter((entry) => entry?.file && existsSync(join(productsRoot, slug, entry.file)))
    .map((entry) => ({
      key: keyOf(entry.file),
      label: entry.label ?? labelFor(entry.file),
      src: `/products/${slug}/${entry.file}`,
    }));
}

const directories = existsSync(productsRoot)
  ? readdirSync(productsRoot, { withFileTypes: true }).filter((entry) => entry.isDirectory()).map((entry) => entry.name)
  : [];

const products = directories.map((slug, index) => {
  const productPath = join(productsRoot, slug);
  const metadata = readMetadata(slug);
  const metadataImages = normalizeMetadataImages(metadata, slug);
  const files = readdirSync(productPath)
    .filter((file) => allowedExtensions.has(extensionOf(file)))
    .sort((a, b) => orderIndex(a) - orderIndex(b) || a.localeCompare(b));

  return {
    id: metadata.id ?? index + 1,
    editionNumber: metadata.editionNumber ?? metadata.id ?? index + 1,
    slug,
    name: metadata.name ?? titleFromSlug(slug),
    price: metadata.price ?? 1499,
    compareAtPrice: metadata.compareAtPrice ?? null,
    color: metadata.color ?? "White",
    category: metadata.category ?? "Men",
    note: metadata.note ?? "Oversized T-shirt with a premium everyday fit, clean construction and detailed product photography.",
    gallery: metadataImages ?? files.map((file) => ({
      key: keyOf(file),
      label: labelFor(file),
      src: `/products/${slug}/${file}`,
    })),
  };
}).filter((product) => product.gallery.length > 0);

const fallbackProducts = [
  {
    id: 1,
    editionNumber: 1,
    slug: "heavyweight-tee-01",
    name: "Heavyweight Tee 01",
    price: 1499,
    compareAtPrice: null,
    color: "Washed Charcoal",
    category: "Men",
    note: "240 GSM / Relaxed structure",
    gallery: [
      { key: "front", label: "Front", src: "/images/washed-charcoal.png" },
      { key: "campaign", label: "Campaign", src: "/images/campaign-hero.png" },
    ],
  },
];

const source = `export type ProductImage = { key: string; label: string; src: string };
export type ProductCategory = "Men" | "Women";
export type ProductVariant = { id: number; size: string; stock: number; price?: number | null };
export type Product = { id: number; slug: string; name: string; price: number; compareAtPrice?: number | null; color: string; category: ProductCategory; note: string; gallery: ProductImage[]; variantId?: number; selectedSize?: string; variants?: ProductVariant[]; editionNumber?: number | null; isUniqueFind?: boolean; lifetimeProductionCap?: number | null; availableStock?: number; uniqueFindStatus?: string };

export const products: Product[] = ${JSON.stringify(products.length ? products : fallbackProducts, null, 2)};
`;

mkdirSync(join(projectRoot, "app"), { recursive: true });
writeFileSync(outputPath, source);
