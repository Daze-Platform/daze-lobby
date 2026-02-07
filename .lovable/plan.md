# Control Tower Sidebar & Client Ingestion Overhaul

## ✅ COMPLETED

### Summary of Changes

#### 1. Sidebar Navigation
- Created `DashboardSidebar.tsx` with collapsible sidebar
- Navigation items: Dashboard, Clients, Blockers, Devices, Revenue
- Icons: LayoutDashboard, Users, AlertTriangle, Tablet, DollarSign
- Dynamic badge counts from database queries
- Ocean Blue (#0EA5E9) for active nav states
- Hover-lift effects on nav items

#### 2. Terminology Update
- Changed "Hotels" → "Clients" across Dashboard
- Updated stat cards: "Total Clients" instead of "Total Hotels"
- Updated lifecycle board: "Client Lifecycle" header

#### 3. Property Name Field (Pilot Agreement)
- Added mandatory "Property Name" field to ReviewSignModal
- Positioned after "Legal Entity Name"
- Maps to `hotels.name` column on signing
- Includes helper text explaining its purpose

#### 4. Automation
- When Pilot Agreement is signed, the property_name updates the hotel record
- Sidebar "Clients" count dynamically reflects all hotel records
- Blockers and Devices counts also update in real-time

### Files Created
- `src/components/layout/DashboardSidebar.tsx`

### Files Modified
- `src/components/layout/DashboardLayout.tsx` - Added sidebar integration
- `src/pages/Dashboard.tsx` - Changed Hotels → Clients terminology
- `src/components/portal/ReviewSignModal.tsx` - Added Property Name field
- `src/components/portal/steps/LegalStep.tsx` - Updated interface
- `src/components/portal/TaskAccordion.tsx` - Updated interface
- `src/hooks/useClientPortal.ts` - Added property_name handling
- `src/pages/PortalPreview.tsx` - Demo mode property_name support
