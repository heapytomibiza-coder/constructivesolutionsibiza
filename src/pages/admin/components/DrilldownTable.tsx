import { Skeleton } from "@/components/ui/skeleton";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { format, isValid, parseISO } from "date-fns";

interface DrilldownTableProps {
  columns: { key: string; label: string }[];
  rows: Record<string, unknown>[];
  isLoading: boolean;
  page: number;
  pageSize: number;
  onPageChange: (p: number) => void;
  onRowClick?: (row: Record<string, unknown>) => void;
}

function formatCell(value: unknown): string {
  if (value == null) return "—";
  if (typeof value === "string") {
    // try date
    const d = parseISO(value);
    if (isValid(d) && value.includes("T")) {
      return format(d, "MMM d, yyyy HH:mm");
    }
    return value;
  }
  if (typeof value === "number") return value.toLocaleString();
  if (Array.isArray(value)) return value.join(", ");
  return String(value);
}

export function DrilldownTable({
  columns, rows, isLoading, page, pageSize, onPageChange, onRowClick,
}: DrilldownTableProps) {
  return (
    <div className="space-y-3">
      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              {columns.map((col) => (
                <TableHead key={col.key}>{col.label}</TableHead>
              ))}
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              [...Array(5)].map((_, i) => (
                <TableRow key={i}>
                  <TableCell colSpan={columns.length}>
                    <Skeleton className="h-8 w-full" />
                  </TableCell>
                </TableRow>
              ))
            ) : rows.length === 0 ? (
              <TableRow>
                <TableCell colSpan={columns.length} className="text-center text-muted-foreground py-8">
                  No records found
                </TableCell>
              </TableRow>
            ) : (
              rows.map((row, i) => (
                <TableRow
                  key={(row.id as string) ?? i}
                  className={onRowClick ? "cursor-pointer" : ""}
                  onClick={() => onRowClick?.(row)}
                >
                  {columns.map((col) => (
                    <TableCell key={col.key} className="max-w-[200px] truncate">
                      {formatCell(row[col.key])}
                    </TableCell>
                  ))}
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      {/* Pagination */}
      <div className="flex items-center justify-between text-sm text-muted-foreground">
        <span>
          {rows.length > 0
            ? `Showing ${page * pageSize + 1}–${page * pageSize + rows.length}`
            : "No results"}
        </span>
        <div className="flex gap-1">
          <Button variant="outline" size="sm" disabled={page === 0} onClick={() => onPageChange(page - 1)}>
            <ChevronLeft className="h-4 w-4" />
          </Button>
          <Button variant="outline" size="sm" disabled={rows.length < pageSize} onClick={() => onPageChange(page + 1)}>
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>
      </div>
    </div>
  );
}
