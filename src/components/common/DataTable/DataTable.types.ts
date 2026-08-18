import type { ReactNode } from "react";

export interface DataTableColumn<T> {
  key: string;
  header: ReactNode;
  headerClassName?: string; // e.g. "d-none d-md-table-cell"
  cellClassName?: string;
  /** This column gets the expand-chevron + depth-indent wrapper (usually the "name" column). */
  isPrimary?: boolean;
  render: (item: T, depth: number) => ReactNode;
}

export interface DataTableFilterOption {
  value: string;
  label: string;
}

export interface DataTableFilter {
  value: string;
  onChange: (value: string) => void;
  options: DataTableFilterOption[];
  className?: string;
}

export interface DataTableStatPill {
  label: string;
  navy?: boolean;
}

export interface DataTablePaginationInfo {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
  hasNextPage: boolean;
  hasPrevPage: boolean;
}