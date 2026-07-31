"use client";
import { useOrderTrack } from "@brandcanvas/contracts";
import Alert from "@mui/material/Alert";
import Button from "@mui/material/Button";
import Paper from "@mui/material/Paper";
import Stack from "@mui/material/Stack";
import TextField from "@mui/material/TextField";
import Typography from "@mui/material/Typography";
import { useSearchParams } from "next/navigation";
import { useState } from "react";
export function TrackOrderPage(){const params=useSearchParams();const[reference,setReference]=useState(params.get("reference")??"");const[email,setEmail]=useState(params.get("email")??"");const[enabled,setEnabled]=useState(false);const q=useOrderTrack({reference,email},{query:{enabled}});return <Paper sx={{p:3,maxWidth:720,mx:"auto",my:6}}><Stack spacing={2}><Typography variant="h3">Track order</Typography><TextField label="Order reference" value={reference} onChange={e=>setReference(e.target.value)}/><TextField label="Email" type="email" value={email} onChange={e=>setEmail(e.target.value)}/><Button variant="contained" onClick={()=>setEnabled(true)}>Track</Button>{q.isError?<Alert severity="error">Order not found.</Alert>:null}{q.data?<Stack spacing={1}><Typography variant="h5">{q.data.orderNumber}</Typography><Typography>Status: {q.data.status.replaceAll("_"," ")}</Typography>{q.data.timeline.map((event,i)=><Typography key={i}>{new Date(event.createdAt).toLocaleString()} — {event.status.replaceAll("_"," ")}</Typography>)}</Stack>:null}</Stack></Paper>}
