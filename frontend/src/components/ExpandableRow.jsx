import {
  TableRow,
  TableCell,
  Collapse,
  Box,
  IconButton
} from "@mui/material";

import KeyboardArrowDownIcon from "@mui/icons-material/KeyboardArrowDown";
import KeyboardArrowUpIcon from "@mui/icons-material/KeyboardArrowUp";

export default function ExpandableRow({
  row,
  columns,
  expanded,
  toggleRow,
  renderExpanded,
  rowColor,
  onInspect
}) {

  const extraCols = (renderExpanded ? 1 : 0) + (onInspect ? 1 : 0);
  const backgroundColor = rowColor ? rowColor(row) : "inherit";

  return (
    <>
      <TableRow
        sx={{
          cursor: "pointer",
          backgroundColor
        }}
        onClick={() => toggleRow(row.id)}
      >

        {columns.map(col => (
          <TableCell
            key={col.field}
            sx={{ minWidth: col.minWidth ?? "auto", padding: '6px 14px' }}
          >
            {col.renderCell ? col.renderCell(row) : row[col.field] ?? "-"}
          </TableCell>
        ))}

        {renderExpanded && (
          <TableCell sx={{ p: 0 }}>
            {expanded
              ? <KeyboardArrowUpIcon fontSize="small"/>
              : <KeyboardArrowDownIcon fontSize="small"/>
            }
          </TableCell>
        )}

        {onInspect && (
          <TableCell>
            <IconButton
              size="small"
              onClick={(e) => {
                e.stopPropagation();
                onInspect(row);
              }}
            >
              🔍
            </IconButton>
          </TableCell>
        )}

      </TableRow>

      {renderExpanded && expanded && (
        <TableRow>
          <TableCell colSpan={columns.length + extraCols} sx={{ p: 0 }}>
            <Collapse in={expanded} timeout="auto" unmountOnExit>
              <Box sx={{ p: 2, backgroundColor }}>
                {renderExpanded(row)}
              </Box>
            </Collapse>
          </TableCell>
        </TableRow>
      )}
    </>
  );
}