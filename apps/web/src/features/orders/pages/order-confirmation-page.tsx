"use client";
import { useStorefrontResolve } from "@brandcanvas/contracts";
import Alert from "@mui/material/Alert";
import Button from "@mui/material/Button";
import Paper from "@mui/material/Paper";
import Stack from "@mui/material/Stack";
import Typography from "@mui/material/Typography";
import Link from "next/link";
import { useParams, useSearchParams } from "next/navigation";
import { StorefrontShell } from "@/features/storefront/ui/storefront-shell";
export function OrderConfirmationPage(){const{storeSlug,reference}=useParams<{storeSlug:string;reference:string}>();const params=useSearchParams();const store=useStorefrontResolve({storeSlug});if(!store.data)return <Alert severity="info">Loading confirmation…</Alert>;return <StorefrontShell storefront={store.data}><Paper sx={{p:{xs:3,md:6},maxWidth:700,mx:"auto"}}><Stack spacing={2} alignItems="flex-start"><Typography variant="h3">Order received</Typography><Typography>Your order reference is <strong>{reference}</strong>.</Typography><Typography color="text.secondary">A seller will confirm your order. Keep this reference and the email used at checkout.</Typography><Button component={Link} href={`/store/${storeSlug}/track-order?reference=${encodeURIComponent(reference)}&email=${encodeURIComponent(params.get("email")??"")}`} variant="contained">Track order</Button></Stack></Paper></StorefrontShell>}
