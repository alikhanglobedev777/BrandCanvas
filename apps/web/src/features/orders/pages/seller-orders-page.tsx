"use client";
import { useSellerOrderList } from "@brandcanvas/contracts";
import { LoadingState, PageHeader, SearchField } from "@brandcanvas/ui";
import Alert from "@mui/material/Alert";
import Chip from "@mui/material/Chip";
import Link from "@mui/material/Link";
import Pagination from "@mui/material/Pagination";
import Paper from "@mui/material/Paper";
import Stack from "@mui/material/Stack";
import Table from "@mui/material/Table";
import TableBody from "@mui/material/TableBody";
import TableCell from "@mui/material/TableCell";
import TableHead from "@mui/material/TableHead";
import TableRow from "@mui/material/TableRow";
import Typography from "@mui/material/Typography";
import NextLink from "next/link";
import { useDeferredValue, useState } from "react";
import { SellerGuard } from "@/features/authentication";
export function SellerOrdersPage(){const[page,setPage]=useState(1);const[search,setSearch]=useState("");const deferred=useDeferredValue(search);const q=useSellerOrderList({page,pageSize:20,...(deferred.trim()?{search:deferred.trim()}:{})});return <SellerGuard><PageHeader eyebrow="Seller orders" title="Orders" description="Review customer orders and progress them through fulfillment."/><Paper variant="outlined" sx={{p:2,mb:3}}><SearchField value={search} onChange={e=>{setSearch(e.target.value);setPage(1)}} placeholder="Search order number or email"/></Paper>{q.isPending?<LoadingState label="Loading orders…"/>:null}{q.isError?<Alert severity="error">Unable to load orders.</Alert>:null}{q.data?.items.length===0?<Alert severity="info">No orders yet.</Alert>:null}{q.data?.items.length?<Paper variant="outlined"><Table><TableHead><TableRow><TableCell>Order</TableCell><TableCell>Customer</TableCell><TableCell>Status</TableCell><TableCell>Total</TableCell><TableCell>Created</TableCell></TableRow></TableHead><TableBody>{q.data.items.map(o=><TableRow key={o.id}><TableCell><Link component={NextLink} href={`/admin/orders/${o.id}`}>{o.orderNumber}</Link></TableCell><TableCell>{o.customerEmail}</TableCell><TableCell><Chip size="small" label={o.status.replaceAll("_"," ")}/></TableCell><TableCell>{o.currency} {(o.totalMinor/100).toFixed(2)}</TableCell><TableCell>{new Date(o.createdAt).toLocaleString()}</TableCell></TableRow>)}</TableBody></Table></Paper>:null}{q.data&&q.data.totalPages>1?<Pagination sx={{mt:3}} page={page} count={q.data.totalPages} onChange={(_,v)=>setPage(v)}/>:null}</SellerGuard>}
