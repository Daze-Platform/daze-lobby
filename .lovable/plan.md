
# Add Documents Tab to Client Portal

This plan adds a Documents section to the client portal where clients can access documents uploaded by the Daze team (contracts, agreements, brand guidelines, etc.).

## Overview

**Client Portal Changes:**
- Add "Documents" to the portal header navigation
- Create a new Documents view showing a read-only table of uploaded files
- Clients can view and download documents but cannot upload or delete

**Control Tower Already Has:**
- Document upload capability in the Client Detail Panel (Documents tab)
- This is where admins upload required documents for each client

## Files to Create

### 1. Portal Documents View (`src/components/portal/PortalDocuments.tsx`)
A read-only document library for clients showing:
- Document name with icon
- Category badge (Legal, Brand, Contract, etc.)
- Upload date
- Download button
- Empty state when no documents exist

Uses the existing `documents` table query filtered by `client_id`.

### 2. Portal Header Component (`src/components/portal/PortalHeader.tsx`)
Extract the header from Portal.tsx into a reusable component with:
- Logo
- Navigation tabs: **Onboarding** | **Documents**
- Admin switcher (when applicable)
- Activity feed button
- User menu / Sign out

## Files to Modify

### 1. Portal.tsx
- Import the new `PortalHeader` component
- Add state to track active view (`onboarding` | `documents`)
- Conditionally render either the onboarding content or the new documents view
- Pass navigation state to header

### 2. Database Migration (New SQL)
Fix the storage RLS policies that still reference the old `client_hotels` table:

```sql
-- Drop old policies
DROP POLICY IF EXISTS "Clients can view their hotel documents in storage" 
  ON storage.objects;
DROP POLICY IF EXISTS "Clients can upload their hotel documents to storage" 
  ON storage.objects;

-- Recreate with correct table reference
CREATE POLICY "Clients can view their hotel documents in storage"
ON storage.objects FOR SELECT
USING (
  bucket_id = 'hotel-documents'
  AND (storage.foldername(name))[1] IN (
    SELECT client_id::text FROM user_clients WHERE user_id = auth.uid()
  )
);
```

Note: We will NOT give clients upload permission - documents are admin-uploaded only.

## User Experience

### Client Portal Flow
1. Client logs in and sees their onboarding checklist (current behavior)
2. New "Documents" tab in header navigation
3. Clicking Documents shows their document library
4. They can download any document uploaded by the Daze team
5. Clean empty state if no documents have been uploaded yet

### Admin Flow (Already Works)
1. Admin opens Client Detail Panel from Kanban board
2. Goes to "Docs" tab
3. Drag-and-drop upload with category selection
4. Documents appear in client's portal immediately

## Visual Design

The Documents view will match the existing portal styling:
- Same card layout as the onboarding section
- Table with subtle borders matching existing patterns
- Category badges using the same color scheme as DocumentUploadSection
- Download button styled like existing action buttons

## Navigation Structure

**Desktop Header:**
```
[Logo] ─── Onboarding | Documents ─── [Activity] [User Menu]
```

**Mobile Bottom Nav:**
```
[Admin Switcher] [Onboarding] [Documents] [Activity] [Sign Out]
```

---

## Technical Details

### Document Query (Client-Side)
```typescript
const { data: documents } = useQuery({
  queryKey: ["portal-documents", clientId],
  queryFn: async () => {
    const { data, error } = await supabase
      .from("documents")
      .select("*")
      .eq("client_id", clientId)
      .order("created_at", { ascending: false });
    if (error) throw error;
    return data;
  },
  enabled: !!clientId,
});
```

### Download Handler
Uses signed URLs from the `hotel-documents` bucket (private bucket).

### Security Model
- Clients: READ-ONLY access to their documents (view/download)
- Admins: Full CRUD access via existing DocumentUploadSection
- Storage: RLS ensures clients only see their own folder
