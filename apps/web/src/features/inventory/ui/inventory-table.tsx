"use client";

import type { ProductResponseDto } from "@brandcanvas/contracts";
import { AppButton, EmptyState, StatusChip } from "@brandcanvas/ui";
import Paper from "@mui/material/Paper";
import Table from "@mui/material/Table";
import TableBody from "@mui/material/TableBody";
import TableCell from "@mui/material/TableCell";
import TableContainer from "@mui/material/TableContainer";
import TableHead from "@mui/material/TableHead";
import TableRow from "@mui/material/TableRow";
import Typography from "@mui/material/Typography";
import { formatProductStatus, getStockStatusTone } from "@/features/products/lib/product-status";

export function InventoryTable({
  products,
  onAdjust,
}: {
  products: ProductResponseDto[];
  onAdjust: (product: ProductResponseDto) => void;
}) {
  if (products.length === 0) {
    return (
      <Paper variant="outlined">
        <EmptyState title="No inventory found" description="Add products first or change the stock-status filter." />
      </Paper>
    );
  }

  return (
    <TableContainer component={Paper} variant="outlined">
      <Table>
        <TableHead>
          <TableRow>
            <TableCell>Product</TableCell>
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
          {products.map((product) => (
            <TableRow key={product.inventoryItemId} hover>
              <TableCell>
                <Typography sx={{ fontWeight: 700 }}>{product.name}</Typography>
              </TableCell>
              <TableCell>{product.sku}</TableCell>
              <TableCell>{product.stockQuantity}</TableCell>
              <TableCell>{product.reservedQuantity}</TableCell>
              <TableCell>{product.availableQuantity}</TableCell>
              <TableCell>{product.lowStockThreshold}</TableCell>
              <TableCell>
                <StatusChip label={formatProductStatus(product.stockStatus)} tone={getStockStatusTone(product.stockStatus)} />
              </TableCell>
              <TableCell align="right">
                <AppButton size="small" variant="outlined" onClick={() => onAdjust(product)}>
                  Adjust stock
                </AppButton>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </TableContainer>
  );
}
