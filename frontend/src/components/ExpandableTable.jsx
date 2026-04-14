import { useState } from "react";
import {
  Table,
  TableBody,
  TableContainer,
  TableHead,
  TableRow,
  TableCell,
  Paper
} from "@mui/material";

import ExpandableRow from "./ExpandableRow";

export default function ExpandableTable({
  columns,
  rows,
  renderExpanded,
  rowColor,
  onInspect,
  resetKey
}) {

  const [expandedRow, setExpandedRow] = useState(null);

  const toggleRow = (id) => {
    setExpandedRow(prev => prev === id ? null : id);
  };

  return (
    <TableContainer component={Paper}>
      <Table size="small">
        { rows.length === 0 && <caption>No data available</caption> }
        <TableHead>
          <TableRow>
            {columns.map(col => (
              <TableCell key={col.field}>
                {col.headerName}
              </TableCell>
            ))}

            {renderExpanded && <TableCell />}
            {onInspect && <TableCell />}
          </TableRow>
        </TableHead>

        <TableBody>
          {rows.map((row, index) => {
            return (
              <ExpandableRow
                key={row.id ?? index}
                row={row}
                columns={columns}
                expanded={expandedRow === row.id}
                toggleRow={toggleRow}
                renderExpanded={renderExpanded}
                rowColor={rowColor}
                onInspect={onInspect}
              />
            );
          })}
        </TableBody>
      </Table>
    </TableContainer>
  );
}