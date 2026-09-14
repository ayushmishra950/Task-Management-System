import React, { useEffect, useState } from "react";
import { Filter, X } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

const STATUS_LABELS: Record<string, string> = {
  pending: "Pending",
  in_progress: "In Progress",
  active: "In Progress",
  completed: "Completed",
  overdue: "Overdue",
  in_review: "In Review",
  approved: "Approved",
  rejected: "Rejected",
};

/** createdAt current month ka hai ya nahi ("This Month" cards ke liye). */
export const isCreatedThisMonth = (date?: string | Date) => {
  if (!date) return false;
  const created = new Date(date);
  const now = new Date();
  return created.getFullYear() === now.getFullYear() && created.getMonth() === now.getMonth();
};

/**
 * Overdue = endDate diya hua hai, wo aaj se pehle nikal chuki hai, aur kaam abhi completed/cancelled nahi hua.
 * (Backend dashboard count bhi isi logic se hota hai.)
 */
export const isOverdueItem = (item?: { endDate?: string | Date | null; status?: string }) => {
  if (!item?.endDate) return false;
  if (item.status === "completed" || item.status === "cancelled") return false;
  const endDate = new Date(item.endDate);
  return !Number.isNaN(endDate.getTime()) && endDate < new Date();
};

interface ActiveFilterBannerProps {
  /** Dashboard ke jis card se aaye uska title, jaise "Completed Tasks" */
  sourceTitle?: string;
  /** Filter abhi bhi wahi hai jo dashboard card ne lagaya tha */
  isSourceFilter?: boolean;
  status: string;
  thisMonth?: boolean;
  /** Aur filters ke chips, jaise "Project: Website Revamp" */
  extraChips?: string[];
  count: number;
  itemLabel: string;
  onClear: () => void;
}

/** List ke upar saaf dikhata hai ki kaunsa filter laga hai / kaunse dashboard card se aaye hai. */
const ActiveFilterBanner: React.FC<ActiveFilterBannerProps> = ({
  sourceTitle,
  isSourceFilter,
  status,
  thisMonth = false,
  extraChips = [],
  count,
  itemLabel,
  onClear,
}) => {
  const [dismissed, setDismissed] = useState(false);
  const hasFilters = status !== "all" || thisMonth || extraChips.length > 0;
  const showSource = Boolean(sourceTitle && isSourceFilter);
  const chipsKey = extraChips.join("|");

  // Filter badle to banner phir se dikhe
  useEffect(() => setDismissed(false), [status, thisMonth, chipsKey]);

  if (dismissed || (!hasFilters && !showSource)) return null;

  return (
    <div className="mb-4 flex flex-wrap items-center justify-between gap-3 rounded-md border border-primary/30 bg-primary/5 px-3 py-2">
      <div className="flex flex-wrap items-center gap-2 text-sm">
        <Filter className="h-4 w-4 text-primary" />
        <span className="font-medium">
          {showSource ? `From Dashboard: ${sourceTitle}` : `Filtered ${itemLabel}`}
        </span>

        {extraChips.map((chip) => (
          <Badge key={chip} variant="secondary">{chip}</Badge>
        ))}
        {status !== "all" && (
          <Badge variant="secondary">Status: {STATUS_LABELS[status] ?? status}</Badge>
        )}
        {thisMonth && <Badge variant="secondary">Created: This Month</Badge>}
        {!hasFilters && <Badge variant="secondary">All {itemLabel}</Badge>}

        <span className="text-muted-foreground">
          · Showing {count} {itemLabel}
        </span>
      </div>

      {hasFilters ? (
        <Button variant="ghost" size="sm" className="h-7" onClick={onClear}>
          <X className="mr-1 h-4 w-4" /> Clear filter
        </Button>
      ) : (
        <Button variant="ghost" size="icon" className="h-7 w-7" aria-label="Hide" onClick={() => setDismissed(true)}>
          <X className="h-4 w-4" />
        </Button>
      )}
    </div>
  );
};

export default ActiveFilterBanner;
