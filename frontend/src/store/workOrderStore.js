import { create } from "zustand";
import { persist } from "zustand/middleware";
import { useAuthStore } from "./authStore";
import { fetchWorkOrders as fetchWOApi, mapWorkOrders } from "../api/workOrder";
import { WorkOrderStatus } from "../constants";

// Refresh logic
// set({ isLoaded: false });
// fetchWorkOrders();

const useWorkOrderStore = create(
  persist(
    (set, get) => ({
      workOrders: [],
      isLoaded: false, // ✅ prevent duplicate calls

      setWorkOrders: (orders) =>
        set({
          workOrders: orders,
          isLoaded: true,
        }),

      fetchWorkOrders: async () => {
        const { token } = useAuthStore.getState();

        if (!token) {
          console.warn("No token, skipping work order fetch");
          return;
        }

        if (get().isLoaded) return;

        try {
          const raw = await fetchWOApi();
          const mapped = mapWorkOrders(raw);

          set({
            workOrders: mapped,
            isLoaded: true,
          });
        } catch (err) {
          console.error("Fetch work orders failed:", err);
        }
      },

      updateStatus: (id, status) =>
        set((state) => ({
          workOrders: state.workOrders.map((wo) =>
            wo.id === id
              ? { ...wo, status }
              : wo
          ),
        })),

      completeLocationScan: (workOrderId, location, scanType, assets) =>
        set((state) => ({
          workOrders: state.workOrders.map((wo) => {
            if (wo.id !== workOrderId) return wo;

            const prevLocation = wo.locationResults?.[location] || {};

            return {
              ...wo,
              locationResults: {
                ...(wo.locationResults || {}),
                [location]: {
                  ...prevLocation,
                  [scanType]: {
                    completed: true,
                    assets, // STORE REAL SCANNED DATA HERE
                  },
                },
              },
            };
          }),
        })),

      clearWorkOrders: () =>
        set({
          workOrders: [],
          isLoaded: false, // reset flag
        }),
    }),
    {
      name: "work-order-storage",
      partialize: (state) => ({
        workOrders: state.workOrders
      })
    }
  )
);

export default useWorkOrderStore;