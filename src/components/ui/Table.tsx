import React from 'react';
import clsx from 'clsx';

interface Column<T> {
  header: string;
  accessor: keyof T | string;
  cell?: (value: any, row: T) => React.ReactNode;
}

interface TableProps<T> {
  columns: Column<T>[];
  data: T[];
}

export function Table<T extends Record<string, any>>({ columns, data }: TableProps<T>) {
  return (
    <div className="overflow-hidden shadow ring-1 ring-black ring-opacity-5 sm:rounded-lg">
      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-300">
          <thead className="bg-gray-50">
            <tr>
              {columns.map((column, index) => (
                <th
                  key={`header-${column.accessor.toString()}-${index}`}
                  className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900"
                >
                  {column.header}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200 bg-white">
            {data.map((row, rowIndex) => (
              <tr key={row.id || `row-${rowIndex}`}>
                {columns.map((column, columnIndex) => {
                  const value = row[column.accessor as keyof T];
                  return (
                    <td
                      key={`${row.id}-${column.accessor.toString()}-${columnIndex}`}
                      className={clsx(
                        "whitespace-nowrap px-3 py-4 text-sm",
                        typeof value === 'number' ? "text-right" : "text-left"
                      )}
                    >
                      {column.cell ? column.cell(value, row) : value}
                    </td>
                  );
                })}
              </tr>
            ))}
            {data.length === 0 && (
              <tr>
                <td 
                  colSpan={columns.length}
                  className="px-3 py-8 text-sm text-gray-500 text-center"
                >
                  Nenhum registro encontrado
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}