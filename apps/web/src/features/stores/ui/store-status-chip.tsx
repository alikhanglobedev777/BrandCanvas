import type { StoreResponseDtoStatus } from "@brandcanvas/contracts";
import { StatusChip } from "@brandcanvas/ui";
import { formatStoreStatus, getStoreStatusTone } from "../lib/store-status";

export function StoreStatusChip({ status }: { status: StoreResponseDtoStatus }) {
  return <StatusChip label={formatStoreStatus(status)} tone={getStoreStatusTone(status)} />;
}
