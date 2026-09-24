"use client";

import type { ReactNode } from "react";

type TableColumn<T extends Record<string, unknown>> = {
  key: keyof T;
  header: string;
  render?: (value: T[keyof T], row: T) => ReactNode;
};

type TableProps<T extends Record<string, unknown>> = {
  columns: TableColumn<T>[];
  rows: T[];
};

export function Table<T extends Record<string, unknown>>({ columns, rows }: TableProps<T>) {
  return (
    <table className="min-w-full border-separate border-spacing-0 text-left text-sm text-slate-300">
      <thead>
        <tr className="bg-[#081725] text-slate-400">
          {columns.map((column) => (
            <th key={String(column.key)} className="border-b border-slate-700/80 px-4 py-3 font-medium">
              {column.header}
            </th>
          ))}
        </tr>
      </thead>
      <tbody>
        {rows.map((row, rowIndex) => (
          <tr key={rowIndex} className="border-b border-slate-700/80 transition hover:bg-[#0a1726]">
            {columns.map((column) => {
              const value = row[column.key];

              return (
                <td key={String(column.key)} className="border-b border-slate-700/80 px-4 py-3 align-middle text-slate-200">
                  {column.render ? column.render(value, row) : String(value ?? "-")}
                </td>
              );
            })}
          </tr>
        ))}
      </tbody>
    </table>
  );
}
