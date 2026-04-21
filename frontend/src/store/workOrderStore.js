import { create } from "zustand";
import { persist } from "zustand/middleware";
import { useAuthStore } from "./authStore";
import { fetchWorkOrders as fetchWOApi, mapWorkOrders } from "../api/workOrder";
import { WorkOrderStatus } from "../constants";

const useWorkOrderStore = create(
  persist(
    (set, get) => ({
      workOrders: [],
      workOrderScanMap: {}, // workOrderId -> workOrderScanUUID
      isLoaded: false, // prevent duplicate calls

      setWorkOrders: (orders) =>
        set({
          workOrders: orders,
          isLoaded: true,
        }),

      setWorkOrderScanUUID: (workOrderId, uuid) =>
        set((state) => ({
          workOrderScanMap: {
            ...state.workOrderScanMap,
            [workOrderId]: uuid
          }
        })),

      getWorkOrderScanUUID: (workOrderId) => get().workOrderScanMap?.[workOrderId],

      fetchWorkOrders: async () => {
        const { token } = useAuthStore.getState();

        if (!token) {
          console.warn("No token, skipping work order fetch");
          return;
        }

        // if (get().isLoaded) return;

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

      updateZoneStatus: (workOrderId, zoneId, scanType) =>
        set((state) => ({
          workOrders: state.workOrders.map((wo) => {
            if (wo.id !== workOrderId) return wo;

            return {
              ...wo,
              zone: wo.zone.map((z) => {
                if (z.id !== zoneId) return z;

                let newStatus = Number(z.status) || 0;

                if (scanType === "firstScan") newStatus = 1;
                if (scanType === "secondScan") newStatus = 2;

                return {
                  ...z,
                  status: newStatus,
                };
              }),
            };
          }),
        })),

      completeZoneScan: (workOrderId, zone, scanType, assets) =>
        set((state) => ({
          workOrders: state.workOrders.map((wo) => {
            if (wo.id !== workOrderId) return wo;

            const prevZone = wo.zoneResults?.[zone] || {};

            return {
              ...wo,
              zoneResults: {
                ...(wo.zoneResults || {}),
                [zone]: {
                  ...prevZone,
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
        workOrders: state.workOrders,
        workOrderScanMap: state.workOrderScanMap,
      })
    }
  )
);

export default useWorkOrderStore;