"use client";

import type { ProductResponseDto } from "@brandcanvas/contracts";
import { EmptyState, StatusChip } from "@brandcanvas/ui";
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
  getProductStatusTone,
  getStockStatusTone,
} from "../lib/product-status";

export function ProductTable({ products }: { products: ProductResponseDto[] }) {
  if (products.length === 0) {
    return (
      <Paper variant="outlined">
        <EmptyState
          title="No products found"
          description="Create your first product or adjust the current filters."
        />
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
            <TableCell>Price</TableCell>
            <TableCell>Product status</TableCell>
            <TableCell>Available inventory</TableCell>
            <TableCell>Stock status</TableCell>
          </TableRow>
        </TableHead>
        <TableBody>
          {products.map((product) => (
            <TableRow key={product.id} hover>
              <TableCell>
                <Typography
                  component={Link}
                  href={`/admin/products/${product.id}`}
                  sx={{
                    fontWeight: 700,
                    color: "primary.main",
                    textDecoration: "none",
                    "&:hover": { textDecoration: "underline" },
                  }}
                >
                  {product.name}
                </Typography>
                <Typography variant="caption" color="text.secondary">
                  {product.slug}
                </Typography>
              </TableCell>
              <TableCell>{product.sku}</TableCell>
              <TableCell>
                {new Intl.NumberFormat("en-PK", {
                  style: "currency",
                  currency: "PKR",
                }).format(Number(product.price))}
              </TableCell>
              <TableCell>
                <StatusChip
                  label={formatProductStatus(product.status)}
                  tone={getProductStatusTone(product.status)}
                />
              </TableCell>
              <TableCell>{product.availableQuantity}</TableCell>
              <TableCell>
                <StatusChip
                  label={formatProductStatus(product.stockStatus)}
                  tone={getStockStatusTone(product.stockStatus)}
                />
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </TableContainer>
  );
}
