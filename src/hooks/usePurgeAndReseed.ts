import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";

export function usePurgeAndReseed() {
  const [isPurging, setIsPurging] = useState(false);
  const queryClient = useQueryClient();

  const purgeAndReseed = async () => {
    setIsPurging(true);
    
    try {
      // Step 1: Delete all data in order (respecting foreign key constraints)
      const tables = ['activity_logs', 'blocker_alerts', 'devices', 'client_contacts', 'clients'] as const;
      
      for (const table of tables) {
        const { error } = await supabase.from(table).delete().neq('id', '00000000-0000-0000-0000-000000000000');
        if (error) throw new Error(`Failed to delete from ${table}: ${error.message}`);
      }

      // Step 2: Generate client IDs
      const clientIds = {
        pearl: crypto.randomUUID(),
        seaside: crypto.randomUUID(),
        mountain: crypto.randomUUID(),
        urban: crypto.randomUUID(),
        riverside: crypto.randomUUID(),
        lakefront: crypto.randomUUID(),
        cityCenter: crypto.randomUUID(),
        royal: crypto.randomUUID(),
        grand: crypto.randomUUID(),
        landmark: crypto.randomUUID(),
      };

      const now = new Date();
      const daysAgo = (days: number) => new Date(now.getTime() - days * 24 * 60 * 60 * 1000).toISOString();

      // Step 3: Insert clients
      const clients = [
        // Onboarding (3)
        {
          id: clientIds.pearl,
          name: "The Pearl Hotel",
          phase: "onboarding" as const,
          phase_started_at: daysAgo(5),
          created_at: daysAgo(5),
          onboarding_progress: 45,
          next_milestone: "Menu Ingestion",
          next_milestone_date: new Date(now.getTime() + 3 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
          notes: "Boutique hotel in downtown area. Very responsive team.",
        },
        {
          id: clientIds.seaside,
          name: "Seaside Resort & Spa",
          phase: "onboarding" as const,
          phase_started_at: daysAgo(3),
          created_at: daysAgo(3),
          onboarding_progress: 20,
          next_milestone: "Hardware Installation",
          next_milestone_date: new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
          notes: "Large resort property with multiple F&B outlets.",
        },
        {
          id: clientIds.mountain,
          name: "Mountain View Lodge",
          phase: "onboarding" as const,
          phase_started_at: daysAgo(18),
          created_at: daysAgo(18),
          updated_at: daysAgo(10), // Stale - triggers alert
          onboarding_progress: 30,
          next_milestone: "Staff Training",
          notes: "STALLED - No response from property manager for 10 days.",
        },
        // Pilot Live (4)
        {
          id: clientIds.urban,
          name: "Urban Boutique Hotel",
          phase: "pilot_live" as const,
          phase_started_at: daysAgo(14),
          created_at: daysAgo(30),
          onboarding_progress: 100,
          next_milestone: "Contract Review",
          next_milestone_date: new Date(now.getTime() + 14 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
          notes: "Pilot going well. Good order volume.",
        },
        {
          id: clientIds.riverside,
          name: "The Riverside Hotel",
          phase: "pilot_live" as const,
          phase_started_at: daysAgo(21),
          created_at: daysAgo(45),
          onboarding_progress: 100,
          next_milestone: "Pilot Extension",
          notes: "LOW ORDER VOLUME - Need to investigate guest engagement.",
        },
        {
          id: clientIds.lakefront,
          name: "Lakefront Inn",
          phase: "pilot_live" as const,
          phase_started_at: daysAgo(7),
          created_at: daysAgo(25),
          onboarding_progress: 100,
          next_milestone: "Mid-pilot Review",
          next_milestone_date: new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
        },
        {
          id: clientIds.cityCenter,
          name: "City Center Hotel",
          phase: "pilot_live" as const,
          phase_started_at: daysAgo(10),
          created_at: daysAgo(35),
          onboarding_progress: 100,
          next_milestone: "Contract Negotiation",
          next_milestone_date: new Date(now.getTime() + 21 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
        },
        // Contracted (3)
        {
          id: clientIds.royal,
          name: "Royal Plaza Hotel",
          phase: "contracted" as const,
          phase_started_at: daysAgo(60),
          created_at: daysAgo(120),
          onboarding_progress: 100,
          contract_value: 48000,
          arr: 48000,
          notes: "Flagship property. Excellent performance.",
        },
        {
          id: clientIds.grand,
          name: "Grand Metropolitan",
          phase: "contracted" as const,
          phase_started_at: daysAgo(90),
          created_at: daysAgo(180),
          onboarding_progress: 100,
          contract_value: 72000,
          arr: 72000,
          notes: "Premium contract. Multiple device locations.",
        },
        {
          id: clientIds.landmark,
          name: "The Landmark Hotel",
          phase: "contracted" as const,
          phase_started_at: daysAgo(45),
          created_at: daysAgo(100),
          onboarding_progress: 100,
          contract_value: 36000,
          arr: 36000,
        },
      ];

      const { error: clientsError } = await supabase.from("clients").insert(clients);
      if (clientsError) throw new Error(`Failed to insert clients: ${clientsError.message}`);

      // Step 4: Insert contacts
      const contacts = [
        { client_id: clientIds.pearl, name: "Sarah Chen", email: "s.chen@pearlhotel.com", phone: "+1 555-0101", role: "General Manager", is_primary: true },
        { client_id: clientIds.seaside, name: "Michael Torres", email: "m.torres@seasideresort.com", phone: "+1 555-0102", role: "F&B Director", is_primary: true },
        { client_id: clientIds.mountain, name: "David Kim", email: "d.kim@mountainview.com", phone: "+1 555-0103", role: "Operations Manager", is_primary: true },
        { client_id: clientIds.urban, name: "Emma Williams", email: "e.williams@urbanboutique.com", phone: "+1 555-0104", role: "Hotel Manager", is_primary: true },
        { client_id: clientIds.riverside, name: "James Brown", email: "j.brown@riverside.com", phone: "+1 555-0105", role: "GM", is_primary: true },
        { client_id: clientIds.lakefront, name: "Lisa Anderson", email: "l.anderson@lakefront.com", phone: "+1 555-0106", role: "Operations", is_primary: true },
        { client_id: clientIds.cityCenter, name: "Robert Martinez", email: "r.martinez@citycenter.com", phone: "+1 555-0107", role: "Director", is_primary: true },
        { client_id: clientIds.royal, name: "Jennifer Lee", email: "j.lee@royalplaza.com", phone: "+1 555-0108", role: "Regional Manager", is_primary: true },
        { client_id: clientIds.grand, name: "William Johnson", email: "w.johnson@grandmet.com", phone: "+1 555-0109", role: "VP Operations", is_primary: true },
        { client_id: clientIds.landmark, name: "Patricia Davis", email: "p.davis@landmark.com", phone: "+1 555-0110", role: "General Manager", is_primary: true },
      ];

      const { error: contactsError } = await supabase.from("client_contacts").insert(contacts);
      if (contactsError) throw new Error(`Failed to insert contacts: ${contactsError.message}`);

      // Step 5: Insert devices for contracted clients
      const devices = [
        { client_id: clientIds.royal, serial_number: "DZ-2024-001", device_type: "Tablet", status: "online" as const, install_date: daysAgo(60).split('T')[0], last_check_in: daysAgo(0) },
        { client_id: clientIds.royal, serial_number: "DZ-2024-002", device_type: "Tablet", status: "online" as const, install_date: daysAgo(60).split('T')[0], last_check_in: daysAgo(0) },
        { client_id: clientIds.royal, serial_number: "DZ-2024-003", device_type: "Kiosk", status: "online" as const, install_date: daysAgo(55).split('T')[0], last_check_in: daysAgo(0) },
        { client_id: clientIds.grand, serial_number: "DZ-2024-004", device_type: "Tablet", status: "online" as const, install_date: daysAgo(90).split('T')[0], last_check_in: daysAgo(0) },
        { client_id: clientIds.grand, serial_number: "DZ-2024-005", device_type: "Tablet", status: "online" as const, install_date: daysAgo(90).split('T')[0], last_check_in: daysAgo(0) },
        { client_id: clientIds.grand, serial_number: "DZ-2024-006", device_type: "Tablet", status: "offline" as const, install_date: daysAgo(85).split('T')[0], last_check_in: daysAgo(3) },
        { client_id: clientIds.grand, serial_number: "DZ-2024-007", device_type: "Kiosk", status: "online" as const, install_date: daysAgo(80).split('T')[0], last_check_in: daysAgo(0) },
        { client_id: clientIds.landmark, serial_number: "DZ-2024-008", device_type: "Tablet", status: "online" as const, install_date: daysAgo(45).split('T')[0], last_check_in: daysAgo(0) },
        { client_id: clientIds.landmark, serial_number: "DZ-2024-009", device_type: "Tablet", status: "maintenance" as const, install_date: daysAgo(45).split('T')[0], last_check_in: daysAgo(1) },
        { client_id: clientIds.urban, serial_number: "DZ-2024-010", device_type: "Tablet", status: "online" as const, install_date: daysAgo(14).split('T')[0], last_check_in: daysAgo(0) },
        { client_id: clientIds.riverside, serial_number: "DZ-2024-011", device_type: "Tablet", status: "online" as const, install_date: daysAgo(21).split('T')[0], last_check_in: daysAgo(0) },
      ];

      const { error: devicesError } = await supabase.from("devices").insert(devices);
      if (devicesError) throw new Error(`Failed to insert devices: ${devicesError.message}`);

      // Step 6: Insert task-based blocker alerts
      const blockerAlerts = [
        {
          client_id: clientIds.riverside,
          blocker_type: "automatic" as const,
          reason: "Pilot Agreement not signed - client has not completed the legal step",
          auto_rule: "incomplete_legal",
        },
        {
          client_id: clientIds.mountain,
          blocker_type: "automatic" as const,
          reason: "Brand identity incomplete - no logos uploaded yet",
          auto_rule: "incomplete_brand",
        },
      ];

      const { error: blockersError } = await supabase.from("blocker_alerts").insert(blockerAlerts);
      if (blockersError) throw new Error(`Failed to insert blocker alerts: ${blockersError.message}`);

      // Step 7: Invalidate queries to refresh UI
      await queryClient.invalidateQueries({ queryKey: ["clients-with-details"] });

      toast.success("Database purged and reseeded with 10 clients!");
    } catch (error) {
      console.error("Purge and reseed failed:", error);
      toast.error(error instanceof Error ? error.message : "Failed to purge and reseed");
      throw error;
    } finally {
      setIsPurging(false);
    }
  };

  return { purgeAndReseed, isPurging };
}
