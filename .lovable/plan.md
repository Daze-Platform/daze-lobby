

## Replace Generic POS Instructions with Toast-Specific Instructions

### Current State

The Toast-specific 3-step instructions were already added in the previous update. When a user selects "Toast" as their POS provider, they should see:

1. Activate Standard API Access (Toast Web Dashboard)
2. Generate Daze Platform Credentials (Create New Integration)
3. Link to Daze Lobby (Client ID, Client Secret, Location GUID)

The screenshot you shared shows the **generic fallback** instructions ("Next Steps for Integration" with 4 generic steps). These only appear when a provider **other than Toast** is selected (or no provider-specific instructions exist).

### What Needs to Happen

If you are seeing the old 4-step generic instructions when Toast is selected, the most likely cause is that the POS provider data for this client is not saved as `"toast"` in the database, so the fallback is being used. We should:

1. **Verify Toast is rendering correctly** -- Navigate to the portal with Toast selected and confirm the new instructions appear.
2. **If the issue persists**, check the admin-set provider value in the database matches `"toast"` exactly (the `onboarding_tasks` table, `task_key = "pos"`, `data->provider`).

### No Code Changes Needed

The implementation from the previous update already ensures that selecting Toast shows the new 3-step instructions instead of the generic 4-step fallback. The generic fallback remains for all other POS providers (NCR Aloha, Micros, etc.) which is correct behavior.

### Recommended Next Step

Test this by navigating to the portal, selecting Toast as the POS provider, and confirming you see "Toast POS: Custom Integration Setup" with the 3 detailed steps plus the email template below it.

