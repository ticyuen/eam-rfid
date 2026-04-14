import { Backdrop, CircularProgress } from "@mui/material";
import { useUIStore } from "../store";

export default function GlobalLoading() {
  const loadingCount = useUIStore((state) => state.loadingCount);

  return (
    <Backdrop
      open={loadingCount > 0}
      sx={{ color: "#fff", zIndex: (theme) => theme.zIndex.drawer + 999 }}
    >
      <CircularProgress color="inherit" />
    </Backdrop>
  );
}