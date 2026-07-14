"use client";

import type { InventoryItemResponseDto } from "@brandcanvas/contracts";
import { AppButton, EmptyState, StatusChip } from "@brandcanvas/ui";
import Paper from "@mui/material/Paper";
import Table from "@mui/material/Table";
import TableBody from "@mui/material/TableBody";
import TableCell from "@mui/material/TableCell";
import TableContainer from "@mui/material/TableContainer";
import TableHead from "@mui/material/TableHead";
import TableRow from "@mui/material/TableRow";
import Typography from "@mui/material/Typography";
import Link from "next/link";
import {
  formatProductStatus,
  getStockStatusTone,
} from "@/features/products/lib/product-status";

export function InventoryTable({
  items,
  onAdjust,
}: {
  items: InventoryItemResponseDto[];
  onAdjust: (item: InventoryItemResponseDto) => void;
}) {
  if (items.length === 0)
    return (
      <Paper variant="outlined">
        <EmptyState
          title="No inventory found"
          description="Add products first or change the inventory filters."
        />
      </Paper>
    );

  return (
    <TableContainer component={Paper} variant="outlined">
      <Table>
        <TableHead>
          <TableRow>
            <TableCell>Product / variant</TableCell>
            <TableCell>SKU</TableCell>
            <TableCell>On hand</TableCell>
            <TableCell>Reserved</TableCell>
            <TableCell>Available</TableCell>
            <TableCell>Threshold</TableCell>
            <TableCell>Status</TableCell>
            <TableCell align="right">Actions</TableCell>
          </TableRow>
        </TableHead>
        <TableBody>
          {items.map((item) => (
            <TableRow key={item.id} hover>
              <TableCell>
                <Typography sx={{ fontWeight: 700 }}>
                  {item.productName}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  {item.variantTitle}
                </Typography>
              </TableCell>
              <TableCell>{item.sku}</TableCell>
              <TableCell>{item.stockQuantity}</TableCell>
              <TableCell>{item.reservedQuantity}</TableCell>
              <TableCell>{item.availableQuantity}</TableCell>
              <TableCell>{item.lowStockThreshold}</TableCell>
              <TableCell>
                <StatusChip
                  label={formatProductStatus(item.stockStatus)}
                  tone={getStockStatusTone(item.stockStatus)}
                />
              </TableCell>
              <TableCell align="right">
                <AppButton
                  size="small"
                  variant="text"
                  component={Link}
                  href={`/admin/inventory/${item.productId}`}
                >
                  History
                </AppButton>
                <AppButton
                  size="small"
                  variant="outlined"
                  disabled={!item.isAvailable}
                  onClick={() => onAdjust(item)}
                >
                  Adjust
                </AppButton>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </TableContainer>
  );
}
