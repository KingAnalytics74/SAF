// Placeholder rota data shaped like the real Supabase rows (see
// supabase/seed.sql), used until a live project is connected and
// src/lib/data/rota.ts is switched over to real queries.

import type { Database } from "@/lib/database.types";

type Staff = Database["public"]["Tables"]["staff"]["Row"];
type Client = Database["public"]["Tables"]["clients"]["Row"];
type ShiftGroup = Database["public"]["Tables"]["shift_groups"]["Row"];

export interface RotaShift extends ShiftGroup {
  staff: Staff[];
  clients: Client[];
}

const now = new Date();
function atHour(daysFromNow: number, hour: number) {
  const d = new Date(now);
  d.setDate(d.getDate() + daysFromNow);
  d.setHours(hour, 0, 0, 0);
  return d.toISOString();
}

export const mockStaff: Staff[] = [
  {
    id: "s1",
    auth_user_id: null,
    name: "Amara Johnson",
    gender: "F",
    role: "manager",
    contracted_hours: 37,
    certifications: ["medication", "first_aid"],
    created_at: now.toISOString(),
  },
  {
    id: "s2",
    auth_user_id: null,
    name: "David Okafor",
    gender: "M",
    role: "care_coordinator",
    contracted_hours: 37,
    certifications: ["medication"],
    created_at: now.toISOString(),
  },
  {
    id: "s3",
    auth_user_id: null,
    name: "Priya Shah",
    gender: "F",
    role: "staff",
    contracted_hours: 30,
    certifications: ["first_aid"],
    created_at: now.toISOString(),
  },
  {
    id: "s4",
    auth_user_id: null,
    name: "Tom Bracewell",
    gender: "M",
    role: "staff",
    contracted_hours: 30,
    certifications: [],
    created_at: now.toISOString(),
  },
  {
    id: "s5",
    auth_user_id: null,
    name: "Grace Adeyemi",
    gender: "F",
    role: "staff",
    contracted_hours: 20,
    certifications: ["medication"],
    created_at: now.toISOString(),
  },
];

export const mockClients: Client[] = [
  {
    id: "c1",
    name: "J. Whitfield",
    address: "4 Elm Court, Gracewood",
    gender_requirement: "F",
    is_minor: false,
    care_needs: "Mobility support, medication administration",
    created_at: now.toISOString(),
  },
  {
    id: "c2",
    name: "R. Marsh",
    address: "4 Elm Court, Gracewood",
    gender_requirement: null,
    is_minor: false,
    care_needs: "Personal care",
    created_at: now.toISOString(),
  },
  {
    id: "c3",
    name: "S. Okonkwo",
    address: "9 Birch House, Gracewood",
    gender_requirement: "M",
    is_minor: true,
    care_needs: "Waking night supervision",
    created_at: now.toISOString(),
  },
];

const staffById = Object.fromEntries(mockStaff.map((s) => [s.id, s]));
const clientById = Object.fromEntries(mockClients.map((c) => [c.id, c]));

function shift(
  id: string,
  shift_type: ShiftGroup["shift_type"],
  daysFromNow: number,
  startHour: number,
  endHour: number,
  status: ShiftGroup["status"],
  staffIds: string[],
  clientIds: string[],
): RotaShift {
  return {
    id,
    shift_type,
    start_time: atHour(daysFromNow, startHour),
    end_time: endHour <= startHour ? atHour(daysFromNow + 1, endHour) : atHour(daysFromNow, endHour),
    status,
    created_at: now.toISOString(),
    staff: staffIds.map((sid) => staffById[sid]),
    clients: clientIds.map((cid) => clientById[cid]),
  };
}

export const mockShiftGroups: RotaShift[] = [
  shift("g1", "day", 0, 8, 20, "filled", ["s3"], ["c1", "c2"]),
  shift("g2", "waking_night", 0, 20, 8, "open", [], ["c3"]),
  shift("g3", "day", 1, 8, 20, "filled", ["s4", "s5"], ["c1"]),
  shift("g4", "waking_night", 1, 20, 8, "filled", ["s4"], ["c3"]),
  shift("g5", "day", 2, 8, 20, "filled", ["s3", "s5"], ["c1", "c2"]),
  shift("g6", "sleep_in", 2, 20, 8, "filled", ["s3"], ["c3"]),
  shift("g7", "day", 3, 8, 20, "open", [], ["c1", "c2"]),
];
