export type ImportRowFailure = {
  rowNumber: number;
  label: string;
  error: string;
};

export type BatchImportResult = {
  success: boolean;
  attempted: number;
  succeeded: number;
  failures: ImportRowFailure[];
};

export const MAX_IMPORT_ROWS = 500;
