export function imageMime(bytes: Uint8Array): string | null {
  const hex = Buffer.from(bytes.subarray(0, 12)).toString("hex");
  if (hex.startsWith("ffd8ff")) return "image/jpeg";
  if (hex.startsWith("89504e470d0a1a0a")) return "image/png";
  if (Buffer.from(bytes.subarray(0, 4)).toString() === "RIFF" && Buffer.from(bytes.subarray(8, 12)).toString() === "WEBP") return "image/webp";
  if (Buffer.from(bytes.subarray(4, 8)).toString() === "ftyp" && ["avif", "avis"].includes(Buffer.from(bytes.subarray(8, 12)).toString())) return "image/avif";
  return null;
}
