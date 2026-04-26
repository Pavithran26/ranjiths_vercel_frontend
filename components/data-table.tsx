import type { ReactNode } from "react";

export type ColumnDef<T> = {
  header: string;
  accessor?: keyof T;
  render?: (item: T) => ReactNode;
};

type DataTableProps<T> = {
  data: T[];
  columns: ColumnDef<T>[];
  keyExtractor: (item: T) => string;
  emptyState?: ReactNode;
  startIndex?: number;
};

export function DataTable<T>({
  data,
  columns,
  keyExtractor,
  emptyState,
  startIndex = 1
}: DataTableProps<T>) {
  if (data.length === 0 && emptyState) {
    return <div className="empty-state-stack">{emptyState}</div>;
  }

  if (data.length === 0) {
    return null;
  }

  return (
    <div className="table-wrap">
      <table>
        <thead>
          <tr>
            <th style={{ width: "60px" }}>S.No</th>
            {columns.map((col, index) => (
              <th key={index}>{col.header}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {data.map((item, rowIndex) => (
            <tr key={keyExtractor(item)}>
              <td>
                <strong>{startIndex + rowIndex}</strong>
              </td>
              {columns.map((col, colIndex) => {
                if (col.render) {
                  return <td key={colIndex}>{col.render(item)}</td>;
                }
                if (col.accessor) {
                  return <td key={colIndex}>{String(item[col.accessor])}</td>;
                }
                return <td key={colIndex}></td>;
              })}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
