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
      const tables = ['activity_logs', 'blocker_alerts', 'devices', 'hotel_contacts', 'hotels'] as const;
      
      for (const table of tables) {
        const { error } = await supabase.from(table).delete().neq('id', '00000000-0000-0000-0000-000000000000');
        if (error) throw new Error(`Failed to delete from ${table}: ${error.message}`);
      }

      // Step 2: Generate hotel IDs
      const hotelIds = {
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

      // Step 3: Insert hotels
      const hotels = [
        // Onboarding (3)
        {
          id: hotelIds.pearl,
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
          id: hotelIds.seaside,
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
          id: hotelIds.mountain,
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
          id: hotelIds.urban,
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
          id: hotelIds.riverside,
          name: "The Riverside Hotel",
          phase: "pilot_live" as const,
          phase_started_at: daysAgo(21),
          created_at: daysAgo(45),
          onboarding_progress: 100,
          next_milestone: "Pilot Extension",
          notes: "LOW ORDER VOLUME - Need to investigate guest engagement.",
        },
        {
          id: hotelIds.lakefront,
          name: "Lakefront Inn",
          phase: "pilot_live" as const,
          phase_started_at: daysAgo(7),
          created_at: daysAgo(25),
          onboarding_progress: 100,
          next_milestone: "Mid-pilot Review",
          next_milestone_date: new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
        },
        {
          id: hotelIds.cityCenter,
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
          id: hotelIds.royal,
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
          id: hotelIds.grand,
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
          id: hotelIds.landmark,
          name: "The Landmark Hotel",
          phase: "contracted" as const,
          phase_started_at: daysAgo(45),
          created_at: daysAgo(100),
          onboarding_progress: 100,
          contract_value: 36000,
          arr: 36000,
        },
      ];

      const { error: hotelsError } = await supabase.from("hotels").insert(hotels);
      if (hotelsError) throw new Error(`Failed to insert hotels: ${hotelsError.message}`);

      // Step 4: Insert contacts
      const contacts = [
        { hotel_id: hotelIds.pearl, name: "Sarah Chen", email: "s.chen@pearlhotel.com", phone: "+1 555-0101", role: "General Manager", is_primary: true },
        { hotel_id: hotelIds.seaside, name: "Michael Torres", email: "m.torres@seasideresort.com", phone: "+1 555-0102", role: "F&B Director", is_primary: true },
        { hotel_id: hotelIds.mountain, name: "David Kim", email: "d.kim@mountainview.com", phone: "+1 555-0103", role: "Operations Manager", is_primary: true },
        { hotel_id: hotelIds.urban, name: "Emma Williams", email: "e.williams@urbanboutique.com", phone: "+1 555-0104", role: "Hotel Manager", is_primary: true },
        { hotel_id: hotelIds.riverside, name: "James Brown", email: "j.brown@riverside.com", phone: "+1 555-0105", role: "GM", is_primary: true },
        { hotel_id: hotelIds.lakefront, name: "Lisa Anderson", email: "l.anderson@lakefront.com", phone: "+1 555-0106", role: "Operations", is_primary: true },
        { hotel_id: hotelIds.cityCenter, name: "Robert Martinez", email: "r.martinez@citycenter.com", phone: "+1 555-0107", role: "Director", is_primary: true },
        { hotel_id: hotelIds.royal, name: "Jennifer Lee", email: "j.lee@royalplaza.com", phone: "+1 555-0108", role: "Regional Manager", is_primary: true },
        { hotel_id: hotelIds.grand, name: "William Johnson", email: "w.johnson@grandmet.com", phone: "+1 555-0109", role: "VP Operations", is_primary: true },
        { hotel_id: hotelIds.landmark, name: "Patricia Davis", email: "p.davis@landmark.com", phone: "+1 555-0110", role: "General Manager", is_primary: true },
      ];

      const { error: contactsError } = await supabase.from("hotel_contacts").insert(contacts);
      if (contactsError) throw new Error(`Failed to insert contacts: ${contactsError.message}`);

      // Step 5: Insert devices for contracted hotels
      const devices = [
        { hotel_id: hotelIds.royal, serial_number: "DZ-2024-001", device_type: "Tablet", status: "online" as const, install_date: daysAgo(60).split('T')[0], last_check_in: daysAgo(0) },
        { hotel_id: hotelIds.royal, serial_number: "DZ-2024-002", device_type: "Tablet", status: "online" as const, install_date: daysAgo(60).split('T')[0], last_check_in: daysAgo(0) },
        { hotel_id: hotelIds.royal, serial_number: "DZ-2024-003", device_type: "Kiosk", status: "online" as const, install_date: daysAgo(55).split('T')[0], last_check_in: daysAgo(0) },
        { hotel_id: hotelIds.grand, serial_number: "DZ-2024-004", device_type: "Tablet", status: "online" as const, install_date: daysAgo(90).split('T')[0], last_check_in: daysAgo(0) },
        { hotel_id: hotelIds.grand, serial_number: "DZ-2024-005", device_type: "Tablet", status: "online" as const, install_date: daysAgo(90).split('T')[0], last_check_in: daysAgo(0) },
        { hotel_id: hotelIds.grand, serial_number: "DZ-2024-006", device_type: "Tablet", status: "offline" as const, install_date: daysAgo(85).split('T')[0], last_check_in: daysAgo(3) },
        { hotel_id: hotelIds.grand, serial_number: "DZ-2024-007", device_type: "Kiosk", status: "online" as const, install_date: daysAgo(80).split('T')[0], last_check_in: daysAgo(0) },
        { hotel_id: hotelIds.landmark, serial_number: "DZ-2024-008", device_type: "Tablet", status: "online" as const, install_date: daysAgo(45).split('T')[0], last_check_in: daysAgo(0) },
        { hotel_id: hotelIds.landmark, serial_number: "DZ-2024-009", device_type: "Tablet", status: "maintenance" as const, install_date: daysAgo(45).split('T')[0], last_check_in: daysAgo(1) },
        { hotel_id: hotelIds.urban, serial_number: "DZ-2024-010", device_type: "Tablet", status: "online" as const, install_date: daysAgo(14).split('T')[0], last_check_in: daysAgo(0) },
        { hotel_id: hotelIds.riverside, serial_number: "DZ-2024-011", device_type: "Tablet", status: "online" as const, install_date: daysAgo(21).split('T')[0], last_check_in: daysAgo(0) },
      ];

      const { error: devicesError } = await supabase.from("devices").insert(devices);
      if (devicesError) throw new Error(`Failed to insert devices: ${devicesError.message}`);

      // Step 6: Insert blocker alert for Riverside (low order volume)
      const blockerAlerts = [
        {
          hotel_id: hotelIds.riverside,
          blocker_type: "automatic" as const,
          reason: "Low order volume detected - 15 orders in last 7 days (threshold: 50)",
          auto_rule: "low_order_volume",
        },
      ];

      const { error: blockersError } = await supabase.from("blocker_alerts").insert(blockerAlerts);
      if (blockersError) throw new Error(`Failed to insert blocker alerts: ${blockersError.message}`);

      // Step 7: Invalidate queries to refresh UI
      await queryClient.invalidateQueries({ queryKey: ["hotels-with-details"] });

      toast.success("Database purged and reseeded with 10 hotels!");
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
