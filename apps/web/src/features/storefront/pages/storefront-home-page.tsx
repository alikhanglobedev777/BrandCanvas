"use client";
import { useStorefrontHome } from "@brandcanvas/contracts";
import Alert from "@mui/material/Alert";
import Button from "@mui/material/Button";
import Grid from "@mui/material/Grid";
import Paper from "@mui/material/Paper";
import Stack from "@mui/material/Stack";
import Typography from "@mui/material/Typography";
import Link from "next/link";
import { useParams } from "next/navigation";
import { LoadingState } from "@brandcanvas/ui";
import { ProductCard } from "../ui/product-card";
import { StorefrontShell } from "../ui/storefront-shell";
export function StorefrontHomePage() {
 const { storeSlug } = useParams<{ storeSlug: string }>();
 const query = useStorefrontHome({ storeSlug });
 if (query.isPending) return <LoadingState label="Loading storefront…" />;
 if (query.isError || !query.data) return <Alert severity="warning">This storefront is unavailable.</Alert>;
 const data = query.data; const base = `/store/${storeSlug}`;
 return <StorefrontShell storefront={data.storefront}><Stack spacing={6}>
  <Paper sx={{ p: { xs: 3, md: 7 }, background: `linear-gradient(135deg, ${data.storefront.theme.primaryColor}22, ${data.storefront.theme.secondaryColor}22)` }}><Stack spacing={2} maxWidth={720}><Typography variant="h2" fontWeight={900}>{data.storefront.name}</Typography><Typography variant="h6" color="text.secondary">{data.storefront.description ?? "Discover products selected for you."}</Typography><Button component={Link} href={`${base}/products`} variant="contained" sx={{ alignSelf: "flex-start" }}>Shop products</Button></Stack></Paper>
  {data.categories.length ? <Stack spacing={2}><Typography variant="h4">Categories</Typography><Stack direction="row" flexWrap="wrap" gap={1}>{data.categories.map((item) => <Button key={item.id} component={Link} href={`${base}/categories/${item.slug}`} variant="outlined">{item.name}</Button>)}</Stack></Stack> : null}
  <Stack spacing={2}><Typography variant="h4">Featured products</Typography>{data.featuredProducts.length ? <Grid container spacing={3}>{data.featuredProducts.map((product) => <Grid key={product.id} size={{ xs: 12, sm: 6, md: 3 }}><ProductCard storeSlug={storeSlug} product={product} currency={data.storefront.currency} /></Grid>)}</Grid> : <Alert severity="info">No published products yet.</Alert>}</Stack>
 </Stack></StorefrontShell>;
}
