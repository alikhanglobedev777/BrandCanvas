"use client";

import type { StoreResponseDto } from "@brandcanvas/contracts";
import { AppButton, EmptyState } from "@brandcanvas/ui";
import Box from "@mui/material/Box";
import Paper from "@mui/material/Paper";
import Table from "@mui/material/Table";
import TableBody from "@mui/material/TableBody";
import TableCell from "@mui/material/TableCell";
import TableContainer from "@mui/material/TableContainer";
import TableHead from "@mui/material/TableHead";
import TableRow from "@mui/material/TableRow";
import Typography from "@mui/material/Typography";
import { StoreStatusChip } from "./store-status-chip";

export interface StoreTableProps {
  stores: StoreResponseDto[];
  onManageStatus: (store: StoreResponseDto) => void;
}

export function StoreTable({ stores, onManageStatus }: StoreTableProps) {
  if (stores.length === 0) {
    return (
      <Paper variant="outlined">
        <EmptyState title="No stores found" description="Create a seller store or change the current filters." />
      </Paper>
    );
  }

  return (
    <TableContainer component={Paper} variant="outlined">
      <Table>
        <TableHead>
          <TableRow>
            <TableCell>Store</TableCell>
            <TableCell>Seller</TableCell>
            <TableCell>Status</TableCell>
            <TableCell>Store URL</TableCell>
            <TableCell>Created</TableCell>
            <TableCell align="right">Actions</TableCell>
          </TableRow>
        </TableHead>
        <TableBody>
          {stores.map((store) => (
            <TableRow key={store.id} hover>
              <TableCell>
                <Typography sx={{ fontWeight: 700 }}>{store.name}</Typography>
                <Typography variant="caption" color="text.secondary">
                  {store.slug}
                </Typography>
              </TableCell>
              <TableCell>
                <Typography variant="body2">{store.owner.name}</Typography>
                <Typography variant="caption" color="text.secondary">
                  {store.owner.email}
                </Typography>
              </TableCell>
              <TableCell>
                <StoreStatusChip status={store.status} />
              </TableCell>
              <TableCell>
                <Box component="span" sx={{ fontFamily: "monospace", fontSize: 13 }}>
                  {store.subdomain}.brandcanvas.local
                </Box>
              </TableCell>
              <TableCell>{new Intl.DateTimeFormat("en-PK", { dateStyle: "medium" }).format(new Date(store.createdAt))}</TableCell>
              <TableCell align="right">
                <AppButton size="small" variant="outlined" onClick={() => onManageStatus(store)}>
                  Manage status
                </AppButton>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </TableContainer>
  );
}
