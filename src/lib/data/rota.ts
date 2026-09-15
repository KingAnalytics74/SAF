// Swap this for a real Supabase query (shift_groups joined through
// shift_group_staff/shift_group_clients) once a live project is connected.
// The shape returned here (RotaShift[]) is what the rota page expects
// either way.

import { mockShiftGroups, type RotaShift } from "@/lib/mock-data";

export async function getRotaShifts(): Promise<RotaShift[]> {
  return mockShiftGroups;
}
