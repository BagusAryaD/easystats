export type ColumnType = "numeric" | "categorical";

export interface Dataset {
  headers: string[];
  rows: string[][];
  columnTypes: Record<string, ColumnType>;
  source: string;
  delimiterLabel: string;
}
