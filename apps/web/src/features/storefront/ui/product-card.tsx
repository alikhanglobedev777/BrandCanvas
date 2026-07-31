"use client";
import type { PublicProductSummaryDto } from "@brandcanvas/contracts";
import Card from "@mui/material/Card";
import CardActionArea from "@mui/material/CardActionArea";
import CardContent from "@mui/material/CardContent";
import CardMedia from "@mui/material/CardMedia";
import Chip from "@mui/material/Chip";
import Stack from "@mui/material/Stack";
import Typography from "@mui/material/Typography";
import Link from "next/link";
export function ProductCard({ storeSlug, product, currency }: { storeSlug: string; product: PublicProductSummaryDto; currency: string }) {
  return <Card variant="outlined" sx={{ height: "100%" }}><CardActionArea component={Link} href={`/store/${storeSlug}/products/${product.slug}`} sx={{ height: "100%", display: "flex", flexDirection: "column", alignItems: "stretch" }}>
    {product.primaryImage ? <CardMedia component="img" image={product.primaryImage.url} alt={product.primaryImage.altText ?? product.name} sx={{ aspectRatio: "4 / 3", objectFit: "cover" }} /> : <Stack alignItems="center" justifyContent="center" sx={{ aspectRatio: "4 / 3", bgcolor: "action.hover" }}><Typography color="text.secondary">No image</Typography></Stack>}
    <CardContent sx={{ flex: 1 }}><Stack spacing={1}><Typography variant="h6">{product.name}</Typography><Typography fontWeight={800}>{currency} {(product.priceMinor / 100).toFixed(2)}</Typography><Chip size="small" label={product.stock.status.replaceAll("_", " ")} color={product.stock.availableForSale ? "success" : "default"} sx={{ alignSelf: "flex-start" }} /></Stack></CardContent>
  </CardActionArea></Card>;
}
