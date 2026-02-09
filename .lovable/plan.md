
## Add "New Device" Button in Client Detail Panel

**What it does:** Adds a "New Device" button inside the **Devices tab** of the Client Detail slide-over panel. Clicking it opens a modal where admins can select a device type, quantity, and ownership -- pre-assigned to the current client.

---

### 1. New Modal Component (`src/components/modals/NewDeviceModal.tsx`)

A streamlined single-step modal (simpler than NewClientModal since the client is already known):

- **Device Type** dropdown: Tablet, Kiosk, Handheld, Printer
- **Quantity** number input (1-50, default 1)
- **Ownership** toggle: Daze-owned (default) vs Property-owned
- **Initial Status** selector: Online / Offline (default Offline)

The `clientId` is passed as a prop, so devices are automatically assigned to that client. Serial numbers are auto-generated in `DZ-{YEAR}-{NNN}` format by querying the highest existing serial.

**On Submit:**
- Inserts `quantity` rows into the `devices` table
- Invalidates `["devices"]` and `["devices-count"]` queries
- Shows a success toast

### 2. Client Detail Panel Update (`src/components/dashboard/ClientDetailPanel.tsx`)

- Replace the static mock devices list in the Devices tab with real data from the database (query `devices` table filtered by `client_id`)
- Add a "New Device" button at the top of the Devices tab that opens the `NewDeviceModal` with the current client's ID pre-filled
- Show an empty state when no devices are assigned to the client

---

### Technical Details

**New file:** `src/components/modals/NewDeviceModal.tsx`
- Uses same UI primitives as `NewClientModal`: `Dialog`, `Button`, `Input`, `Label`, `Select`, `Badge`
- Phosphor icons for device types (`DeviceTablet`, `Desktop`, `DeviceMobile`, `Printer`)
- Props: `open`, `onOpenChange`, `clientId`, `clientName`
- Uses `useMutation` with `supabase.from("devices").insert(...)` for batch insert
- Serial number generation: queries max existing `DZ-` serial, increments sequentially

**Modified file:** `src/components/dashboard/ClientDetailPanel.tsx`
- Import `NewDeviceModal` and add `isNewDeviceOpen` state
- In the Devices `TabsContent`, add a header row with the client name and a "New Device" button
- Replace `mockDevices` usage with a `useQuery` call: `supabase.from("devices").select("*").eq("client_id", hotel.id)`
- Keep the existing `DeviceCard` component but adapt it to use the real `DeviceWithClient` interface from `useDevices.ts`
- Add empty state UI when no devices exist for this client
