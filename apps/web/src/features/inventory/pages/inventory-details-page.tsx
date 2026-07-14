"use client";

import {
  getInventoryManagementGetProductQueryKey,
  getInventoryManagementListMovementsQueryKey,
  type InventoryAdjustmentRequestDto,
  type InventoryItemResponseDto,
  type InventoryManagementListMovementsMovementType,
  useInventoryManagementAdjust,
  useInventoryManagementGetProduct,
  useInventoryManagementListMovements,
  useInventoryManagementUpdateThreshold,
} from "@brandcanvas/contracts";
import {
  AppButton,
  EmptyState,
  LoadingState,
  PageHeader,
  StatusChip,
} from "@brandcanvas/ui";
import Alert from "@mui/material/Alert";
import FormControl from "@mui/material/FormControl";
import InputLabel from "@mui/material/InputLabel";
import MenuItem from "@mui/material/MenuItem";
import Pagination from "@mui/material/Pagination";
import Paper from "@mui/material/Paper";
import Select from "@mui/material/Select";
import Stack from "@mui/material/Stack";
import Table from "@mui/material/Table";
import TableBody from "@mui/material/TableBody";
import TableCell from "@mui/material/TableCell";
import TableContainer from "@mui/material/TableContainer";
import TableHead from "@mui/material/TableHead";
import TableRow from "@mui/material/TableRow";
import TextField from "@mui/material/TextField";
import Typography from "@mui/material/Typography";
import { useQueryClient } from "@tanstack/react-query";
import { useParams } from "next/navigation";
import { useEffect, useState } from "react";
import { SellerGuard } from "@/features/authentication";
import {
  formatProductStatus,
  getStockStatusTone,
} from "@/features/products/lib/product-status";
import { getApiErrorMessage } from "@/shared/lib/get-api-error-message";
import { InventoryAdjustmentDialog } from "../ui/inventory-adjustment-dialog";

export function InventoryDetailsPage() {
  const { productId } = useParams<{ productId: string }>();
  const queryClient = useQueryClient();
  const product = useInventoryManagementGetProduct(productId);
  const [selectedId, setSelectedId] = useState("");
  const [adjusting, setAdjusting] = useState<InventoryItemResponseDto | null>(
    null,
  );
  const [movementPage, setMovementPage] = useState(1);
  const [movementType, setMovementType] = useState<
    InventoryManagementListMovementsMovementType | "all"
  >("all");
  const [threshold, setThreshold] = useState(0);
  const selected = product.data?.items.find((item) => item.id === selectedId);

  useEffect(() => {
    if (!selectedId && product.data?.items[0])
      setSelectedId(product.data.items[0].id);
  }, [product.data, selectedId]);
  useEffect(() => {
    if (selected) setThreshold(selected.lowStockThreshold);
  }, [selected]);

  const movementParams = {
    page: movementPage,
    pageSize: 10,
    ...(movementType !== "all" ? { movementType } : {}),
  };
  const movements = useInventoryManagementListMovements(
    selectedId || "00000000-0000-4000-8000-000000000000",
    movementParams,
    { query: { enabled: Boolean(selectedId) } },
  );
  const invalidate = async () => {
    await Promise.all([
      queryClient.invalidateQueries({
        queryKey: getInventoryManagementGetProductQueryKey(productId),
      }),
      selectedId
        ? queryClient.invalidateQueries({
            queryKey: getInventoryManagementListMovementsQueryKey(selectedId),
          })
        : Promise.resolve(),
    ]);
  };
  const adjust = useInventoryManagementAdjust({
    mutation: {
      onSuccess: async () => {
        setAdjusting(null);
        await invalidate();
      },
    },
  });
  const updateThreshold = useInventoryManagementUpdateThreshold({
    mutation: { onSuccess: invalidate },
  });

  if (product.isPending)
    return (
      <SellerGuard>
        <LoadingState label="Loading inventory details…" />
      </SellerGuard>
    );
  if (product.isError)
    return (
      <SellerGuard>
        <Alert severity="error">
          {getApiErrorMessage(
            product.error,
            "Unable to load inventory. You may not have permission to view it.",
          )}
        </Alert>
      </SellerGuard>
    );
  if (!product.data || product.data.items.length === 0)
    return (
      <SellerGuard>
        <EmptyState
          title="Inventory not found"
          description="This product is outside your store or has no inventory variants."
        />
      </SellerGuard>
    );

  return (
    <SellerGuard>
      <PageHeader
        eyebrow="Inventory ledger"
        title={product.data.items[0]?.productName ?? "Inventory details"}
        description="Review current quantities and the immutable movement history for each variant."
      />
      <Stack spacing={3}>
        <FormControl sx={{ maxWidth: 420 }}>
          <InputLabel>Variant</InputLabel>
          <Select
            value={selectedId}
            label="Variant"
            onChange={(event) => {
              setSelectedId(event.target.value);
              setMovementPage(1);
            }}
          >
            {product.data.items.map((item) => (
              <MenuItem key={item.id} value={item.id}>
                {item.variantTitle} · {item.sku}
              </MenuItem>
            ))}
          </Select>
        </FormControl>
        {selected ? (
          <Paper variant="outlined" sx={{ p: 3 }}>
            <Stack spacing={2}>
              <Stack
                direction={{ xs: "column", sm: "row" }}
                spacing={2}
                sx={{ alignItems: { sm: "center" } }}
              >
                <Quantity label="On hand" value={selected.stockQuantity} />
                <Quantity label="Reserved" value={selected.reservedQuantity} />
                <Quantity
                  label="Available"
                  value={selected.availableQuantity}
                />
                <StatusChip
                  label={formatProductStatus(selected.stockStatus)}
                  tone={getStockStatusTone(selected.stockStatus)}
                />
                <AppButton
                  sx={{ ml: { sm: "auto" } }}
                  disabled={!selected.isAvailable}
                  onClick={() => setAdjusting(selected)}
                >
                  Adjust stock
                </AppButton>
              </Stack>
              <Stack direction={{ xs: "column", sm: "row" }} spacing={1}>
                <TextField
                  label="Low-stock threshold"
                  type="number"
                  value={threshold}
                  onChange={(event) => setThreshold(Number(event.target.value))}
                  slotProps={{ htmlInput: { min: 0 } }}
                />
                <AppButton
                  variant="outlined"
                  loading={updateThreshold.isPending}
                  disabled={
                    threshold < 0 || threshold === selected.lowStockThreshold
                  }
                  onClick={() =>
                    updateThreshold.mutate({
                      inventoryItemId: selected.id,
                      data: {
                        lowStockThreshold: threshold,
                        reason: "Low-stock threshold updated",
                      },
                    })
                  }
                >
                  Save threshold
                </AppButton>
              </Stack>
              {updateThreshold.error ? (
                <Alert severity="error">
                  {getApiErrorMessage(
                    updateThreshold.error,
                    "Unable to update threshold.",
                  )}
                </Alert>
              ) : null}
            </Stack>
          </Paper>
        ) : null}
        <Paper variant="outlined" sx={{ p: 2 }}>
          <Stack spacing={2}>
            <Stack
              direction={{ xs: "column", sm: "row" }}
              spacing={2}
              sx={{ justifyContent: "space-between" }}
            >
              <Typography variant="h6">Movement history</Typography>
              <FormControl size="small" sx={{ minWidth: 220 }}>
                <InputLabel>Movement type</InputLabel>
                <Select
                  label="Movement type"
                  value={movementType}
                  onChange={(event) => {
                    setMovementType(
                      event.target.value as
                        InventoryManagementListMovementsMovementType | "all",
                    );
                    setMovementPage(1);
                  }}
                >
                  <MenuItem value="all">All movements</MenuItem>
                  {[
                    "initial_stock",
                    "manual_increase",
                    "manual_decrease",
                    "set_quantity",
                    "reservation",
                    "reservation_release",
                    "reservation_expiry",
                    "sale",
                    "correction",
                  ].map((type) => (
                    <MenuItem key={type} value={type}>
                      {type.replaceAll("_", " ")}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Stack>
            {movements.isPending ? (
              <LoadingState label="Loading movements…" />
            ) : null}
            {movements.isError ? (
              <Alert severity="error">
                {getApiErrorMessage(
                  movements.error,
                  "Unable to load movements.",
                )}
              </Alert>
            ) : null}
            {movements.data?.items.length === 0 ? (
              <EmptyState
                title="No movements"
                description="No ledger entries match this filter."
              />
            ) : null}
            {movements.data?.items.length ? (
              <TableContainer>
                <Table size="small">
                  <TableHead>
                    <TableRow>
                      <TableCell>Date</TableCell>
                      <TableCell>Type</TableCell>
                      <TableCell>Delta</TableCell>
                      <TableCell>Stock</TableCell>
                      <TableCell>Reserved</TableCell>
                      <TableCell>Reason / actor / reference</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {movements.data.items.map((movement) => (
                      <TableRow key={movement.id}>
                        <TableCell>
                          {new Date(movement.createdAt).toLocaleString()}
                        </TableCell>
                        <TableCell>
                          {movement.movementType.replaceAll("_", " ")}
                        </TableCell>
                        <TableCell>{movement.quantityDelta}</TableCell>
                        <TableCell>
                          {movement.stockBefore} → {movement.stockAfter}
                        </TableCell>
                        <TableCell>
                          {movement.reservedBefore} → {movement.reservedAfter}
                        </TableCell>
                        <TableCell>
                          <Typography variant="body2">
                            {movement.reason ?? "—"}
                          </Typography>
                          <Typography variant="caption" color="text.secondary">
                            {movement.actorName ?? "System"}
                            {movement.referenceType
                              ? ` · ${movement.referenceType}: ${movement.referenceId}`
                              : ""}
                          </Typography>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </TableContainer>
            ) : null}
            {movements.data && movements.data.totalPages > 1 ? (
              <Pagination
                page={movementPage}
                count={movements.data.totalPages}
                onChange={(_, page) => setMovementPage(page)}
              />
            ) : null}
          </Stack>
        </Paper>
      </Stack>
      <InventoryAdjustmentDialog
        item={adjusting}
        loading={adjust.isPending}
        error={adjust.error}
        onClose={() => {
          adjust.reset();
          setAdjusting(null);
        }}
        onSubmit={(data: InventoryAdjustmentRequestDto) => {
          if (adjusting) adjust.mutate({ inventoryItemId: adjusting.id, data });
        }}
      />
    </SellerGuard>
  );
}

function Quantity({ label, value }: { label: string; value: number }) {
  return (
    <Stack spacing={0.25} sx={{ minWidth: 90 }}>
      <Typography variant="caption" color="text.secondary">
        {label}
      </Typography>
      <Typography variant="h5">{value}</Typography>
    </Stack>
  );
}
