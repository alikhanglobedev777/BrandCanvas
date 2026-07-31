"use client";
import { useStorefrontProducts, useStorefrontResolve, type StorefrontProductsSort } from "@brandcanvas/contracts";
import { LoadingState, SearchField } from "@brandcanvas/ui";
import Alert from "@mui/material/Alert";
import FormControl from "@mui/material/FormControl";
import Grid from "@mui/material/Grid";
import InputLabel from "@mui/material/InputLabel";
import MenuItem from "@mui/material/MenuItem";
import Pagination from "@mui/material/Pagination";
import Select from "@mui/material/Select";
import Stack from "@mui/material/Stack";
import Typography from "@mui/material/Typography";
import { useParams, useSearchParams } from "next/navigation";
import { useDeferredValue, useState } from "react";
import { ProductCard } from "../ui/product-card";
import { StorefrontShell } from "../ui/storefront-shell";
export function StorefrontProductsPage({ categorySlug, collectionSlug }: { categorySlug?: string; collectionSlug?: string }) {
 const { storeSlug } = useParams<{ storeSlug: string }>(); const searchParams = useSearchParams();
 const initial = searchParams.get("q") ?? ""; const [search, setSearch] = useState(initial); const deferred = useDeferredValue(search); const [page,setPage]=useState(1); const [sort,setSort]=useState<StorefrontProductsSort>("newest");
 const store = useStorefrontResolve({ storeSlug }); const products = useStorefrontProducts({ storeSlug, page, pageSize: 12, sort, ...(deferred.trim()?{search:deferred.trim()}:{}), ...(categorySlug?{categorySlug}:{}), ...(collectionSlug?{collectionSlug}:{}) });
 if (store.isPending) return <LoadingState label="Loading storefront…" />; if (store.isError || !store.data) return <Alert severity="warning">Storefront unavailable.</Alert>;
 return <StorefrontShell storefront={store.data}><Stack spacing={3}><Typography variant="h3">Products</Typography><Stack direction={{xs:"column",md:"row"}} spacing={2}><SearchField value={search} onChange={(e)=>{setSearch(e.target.value);setPage(1)}} placeholder="Search products" sx={{flex:1}}/><FormControl sx={{minWidth:210}}><InputLabel>Sort</InputLabel><Select label="Sort" value={sort} onChange={(e)=>setSort(e.target.value as StorefrontProductsSort)}><MenuItem value="newest">Newest</MenuItem><MenuItem value="price_ascending">Price: low to high</MenuItem><MenuItem value="price_descending">Price: high to low</MenuItem><MenuItem value="name_ascending">Name: A–Z</MenuItem></Select></FormControl></Stack>
 {products.isPending?<LoadingState label="Loading products…"/>:null}{products.isError?<Alert severity="error">Unable to load products.</Alert>:null}{products.data?.items.length===0?<Alert severity="info">No products match your filters.</Alert>:null}{products.data?.items.length?<Grid container spacing={3}>{products.data.items.map((product)=><Grid key={product.id} size={{xs:12,sm:6,md:4}}><ProductCard storeSlug={storeSlug} product={product} currency={store.data.currency}/></Grid>)}</Grid>:null}{products.data && products.data.totalPages>1?<Pagination count={products.data.totalPages} page={page} onChange={(_,v)=>setPage(v)}/>:null}
 </Stack></StorefrontShell>;
}
