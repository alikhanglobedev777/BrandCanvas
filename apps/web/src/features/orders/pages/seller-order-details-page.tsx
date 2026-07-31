"use client";
import { getSellerOrderGetQueryKey, useSellerOrderGet, useSellerOrderUpdateStatus, type UpdateOrderStatusDtoStatus } from "@brandcanvas/contracts";
import { LoadingState, PageHeader } from "@brandcanvas/ui";
import Alert from "@mui/material/Alert";
import Button from "@mui/material/Button";
import Chip from "@mui/material/Chip";
import Divider from "@mui/material/Divider";
import MenuItem from "@mui/material/MenuItem";
import Paper from "@mui/material/Paper";
import Stack from "@mui/material/Stack";
import TextField from "@mui/material/TextField";
import Typography from "@mui/material/Typography";
import { useQueryClient } from "@tanstack/react-query";
import { useParams } from "next/navigation";
import { useState } from "react";
import { SellerGuard } from "@/features/authentication";
const statuses:UpdateOrderStatusDtoStatus[]=["confirmed","processing","packed","shipped","delivered","cancelled","returned","refunded"];
export function SellerOrderDetailsPage(){const{orderId}=useParams<{orderId:string}>();const qc=useQueryClient();const q=useSellerOrderGet(orderId);const[next,setNext]=useState<UpdateOrderStatusDtoStatus>("confirmed");const mutation=useSellerOrderUpdateStatus({mutation:{onSuccess:()=>qc.invalidateQueries({queryKey:getSellerOrderGetQueryKey(orderId)})}});if(q.isPending)return <LoadingState label="Loading order…"/>;return <SellerGuard>{q.isError||!q.data?<Alert severity="error">Order not found.</Alert>:<Stack spacing={3}><PageHeader eyebrow="Order details" title={q.data.orderNumber} description={q.data.customerEmail}/><Stack direction="row" spacing={1}><Chip label={q.data.status}/><Chip label={q.data.paymentStatus}/><Chip label={q.data.fulfillmentStatus}/></Stack><Paper variant="outlined" sx={{p:3}}><Stack spacing={2}>{q.data.items.map((item,i)=><Stack key={`${item.sku}-${i}`} direction="row" justifyContent="space-between"><Typography>{item.name} · {item.variantTitle} × {item.quantity}</Typography><Typography>{q.data.currency} {(item.lineTotalMinor/100).toFixed(2)}</Typography></Stack>)}<Divider/><Typography variant="h6" fontWeight={900}>Total {q.data.currency} {(q.data.totalMinor/100).toFixed(2)}</Typography></Stack></Paper><Paper variant="outlined" sx={{p:3}}><Stack spacing={2}><Typography variant="h6">Update status</Typography><TextField select label="Next status" value={next} onChange={e=>setNext(e.target.value as UpdateOrderStatusDtoStatus)}>{statuses.map(s=><MenuItem key={s} value={s}>{s.replaceAll("_"," ")}</MenuItem>)}</TextField><Button variant="contained" disabled={mutation.isPending} onClick={()=>mutation.mutate({orderId,data:{status:next}})}>Apply status</Button>{mutation.isError?<Alert severity="error">The selected transition is not allowed.</Alert>:null}</Stack></Paper><Paper variant="outlined" sx={{p:3}}><Typography variant="h6" gutterBottom>Timeline</Typography><Stack spacing={1}>{q.data.timeline.map((event,i)=><Typography key={i}>{new Date(event.createdAt).toLocaleString()} — {event.status.replaceAll("_"," ")}{event.note?` · ${event.note}`:""}</Typography>)}</Stack></Paper></Stack>}</SellerGuard>}
