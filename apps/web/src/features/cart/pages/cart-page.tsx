"use client";
import { getCartGetQueryKey, useCartGet, useCartRemoveItem, useCartUpdateItem, useStorefrontResolve } from "@brandcanvas/contracts";
import { LoadingState } from "@brandcanvas/ui";
import Alert from "@mui/material/Alert";
import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
import Divider from "@mui/material/Divider";
import IconButton from "@mui/material/IconButton";
import Paper from "@mui/material/Paper";
import Stack from "@mui/material/Stack";
import TextField from "@mui/material/TextField";
import Typography from "@mui/material/Typography";
import { useQueryClient } from "@tanstack/react-query";
import Link from "next/link";
import { useParams } from "next/navigation";
import { StorefrontShell } from "@/features/storefront/ui/storefront-shell";
export function CartPage(){
 const {storeSlug}=useParams<{storeSlug:string}>();const qc=useQueryClient();const store=useStorefrontResolve({storeSlug});const cart=useCartGet({storeSlug});const invalidate=()=>qc.invalidateQueries({queryKey:getCartGetQueryKey({storeSlug})});
 const update=useCartUpdateItem({mutation:{onSuccess:invalidate}});const remove=useCartRemoveItem({mutation:{onSuccess:invalidate}});
 if(store.isPending||cart.isPending)return <LoadingState label="Loading cart…"/>;if(store.isError||!store.data)return <Alert severity="warning">Storefront unavailable.</Alert>;
 return <StorefrontShell storefront={store.data}><Stack spacing={3}><Typography variant="h3">Your cart</Typography>{cart.isError?<Alert severity="error">Unable to load your cart.</Alert>:null}{cart.data?.items.length===0?<Alert severity="info">Your cart is empty.</Alert>:null}{cart.data?.items.map((item)=><Paper key={item.id} variant="outlined" sx={{p:2}}><Stack direction={{xs:"column",sm:"row"}} spacing={2} alignItems={{sm:"center"}}>{item.imageUrl?<Box component="img" src={item.imageUrl} alt="" sx={{width:96,height:96,objectFit:"cover",borderRadius:1}}/>:null}<Stack flex={1}><Typography fontWeight={800}>{item.productName}</Typography><Typography variant="body2" color="text.secondary">{item.variantTitle}</Typography>{item.warning?<Alert severity="warning" sx={{mt:1}}>{item.warning}</Alert>:null}</Stack><TextField type="number" label="Quantity" value={item.quantity} inputProps={{min:1,max:99}} onChange={(e)=>update.mutate({itemId:item.id,data:{storeSlug,quantity:Number(e.target.value)}})} sx={{width:110}}/><Typography fontWeight={800}>{cart.data.currency} {(item.lineTotalMinor/100).toFixed(2)}</Typography><IconButton aria-label="Remove item" onClick={()=>remove.mutate({itemId:item.id,params:{storeSlug}})}>×</IconButton></Stack></Paper>)}{cart.data?.items.length?<Paper sx={{p:3}}><Stack spacing={2}><Stack direction="row" justifyContent="space-between"><Typography variant="h6">Subtotal</Typography><Typography variant="h6" fontWeight={900}>{cart.data.currency} {(cart.data.subtotalMinor/100).toFixed(2)}</Typography></Stack><Divider/><Button component={Link} href={`/store/${storeSlug}/checkout`} variant="contained" size="large">Continue to checkout</Button></Stack></Paper>:<Button component={Link} href={`/store/${storeSlug}/products`} variant="contained" sx={{alignSelf:"flex-start"}}>Browse products</Button>}</Stack></StorefrontShell>;
}
