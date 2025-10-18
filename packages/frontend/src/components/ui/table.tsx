import React from 'react';

type TableProps = React.HTMLAttributes<HTMLTableElement>;
export const Table: React.FC<TableProps> = ({ className, ...props }) => (
  <table className={['w-full text-sm', className].filter(Boolean).join(' ')} {...props} />
);

type THeadProps = React.HTMLAttributes<HTMLTableSectionElement>;
export const TableHeader: React.FC<THeadProps> = ({ className, ...props }) => (
  <thead className={['bg-gray-50', className].filter(Boolean).join(' ')} {...props} />
);

type TBodyProps = React.HTMLAttributes<HTMLTableSectionElement>;
export const TableBody: React.FC<TBodyProps> = ({ className, ...props }) => (
  <tbody className={className} {...props} />
);

type TRProps = React.HTMLAttributes<HTMLTableRowElement>;
export const TableRow: React.FC<TRProps> = ({ className, ...props }) => (
  <tr
    className={['border-b last:border-0 hover:bg-gray-50', className].filter(Boolean).join(' ')}
    {...props}
  />
);

type THProps = React.ThHTMLAttributes<HTMLTableCellElement>;
export const TableHead: React.FC<THProps> = ({ className, ...props }) => (
  <th
    className={[
      'px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase',
      className,
    ].filter(Boolean).join(' ')}
    {...props}
  />
);

type TDProps = React.TdHTMLAttributes<HTMLTableCellElement>;
export const TableCell: React.FC<TDProps> = ({ className, ...props }) => (
  <td className={['px-4 py-2 align-middle', className].filter(Boolean).join(' ')} {...props} />
);

export default Table;