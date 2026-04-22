import { create } from "zustand";

export const useUIStore = create((set) => ({
  loadingCount: 0,
  startLoading: () =>
    set((state) => ({
      loadingCount: state.loadingCount + 1,
    })),
  stopLoading: () =>
    set((state) => ({
      loadingCount: Math.max(0, state.loadingCount - 1),
    })),

  snackbar: {
    open: false,
    message: "",
    severity: "info", // success | error | warning | info
  },

  showSnackbar: (message, severity = "info") =>
    set({
      snackbar: {
        open: true,
        message,
        severity,
      },
    }),

  closeSnackbar: () =>
    set((state) => ({
      snackbar: { ...state.snackbar, open: false },
    })),
}));