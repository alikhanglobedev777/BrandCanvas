"use client";
import { getCartGetQueryKey, useCartAddItem, useStorefrontProduct, useStorefrontResolve } from "@brandcanvas/contracts";
import { LoadingState } from "@brandcanvas/ui";
import Alert from "@mui/material/Alert";
import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
import Chip from "@mui/material/Chip";
import Grid from "@mui/material/Grid";
import Stack from "@mui/material/Stack";
import Typography from "@mui/material/Typography";
import { useParams } from "next/navigation";
import { useMemo, useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { StorefrontShell } from "../ui/storefront-shell";
export function StorefrontProductDetailsPage(){
 const {storeSlug,productSlug}=useParams<{storeSlug:string;productSlug:string}>(); const queryClient=useQueryClient(); const store=useStorefrontResolve({storeSlug}); const product=useStorefrontProduct(productSlug,{storeSlug}); const [selectedValues,setSelectedValues]=useState<string[]>([]); const add=useCartAddItem({mutation:{onSuccess:()=>queryClient.invalidateQueries({queryKey:getCartGetQueryKey({storeSlug})})}});
 const selectedVariant=useMemo(()=>product.data?.variants.find((v)=>v.optionValueIds.length===selectedValues.length&&v.optionValueIds.every((id)=>selectedValues.includes(id)))??product.data?.variants[0],[product.data,selectedValues]);
 if(store.isPending||product.isPending)return <LoadingState label="Loading product…"/>; if(store.isError||product.isError||!store.data||!product.data)return <Alert severity="warning">Product not found.</Alert>;
 const p=product.data; return <StorefrontShell storefront={store.data}><Grid container spacing={5}><Grid size={{xs:12,md:6}}><Stack spacing={2}>{p.images.length?p.images.map((image)=><Box key={image.id} component="img" src={image.url} alt={image.altText??p.name} sx={{width:"100%",borderRadius:2}}/>):<Alert severity="info">No product image.</Alert>}</Stack></Grid><Grid size={{xs:12,md:6}}><Stack spacing={3}><Typography variant="h3">{p.name}</Typography><Typography variant="h5" fontWeight={800}>{p.currency} {((selectedVariant?.priceMinor??p.priceMinor)/100).toFixed(2)}</Typography>{p.description?<Typography color="text.secondary">{p.description}</Typography>:null}{p.options.map((option)=><Stack key={option.id} spacing={1}><Typography fontWeight={700}>{option.name}</Typography><Stack direction="row" flexWrap="wrap" gap={1}>{option.values.map((value)=><Chip key={value.id} label={value.value} clickable color={selectedValues.includes(value.id)?"primary":"default"} onClick={()=>setSelectedValues((current)=>[...current.filter((id)=>!option.values.some((item)=>item.id===id)),value.id])}/>)}</Stack></Stack>)}<Chip label={(selectedVariant?.stock??p.stock).status.replaceAll("_"," ")} color={(selectedVariant?.stock??p.stock).availableForSale?"success":"default"} sx={{alignSelf:"flex-start"}}/><Button variant="contained" size="large" disabled={!selectedVariant?.stock.availableForSale||add.isPending} onClick={()=>selectedVariant&&add.mutate({data:{storeSlug,productId:p.id,variantId:selectedVariant.id,quantity:1}})}>{add.isPending?"Adding…":"Add to cart"}</Button>{add.isError?<Alert severity="error">Unable to add this item to your cart.</Alert>:null}</Stack></Grid></Grid></StorefrontShell>;
}
