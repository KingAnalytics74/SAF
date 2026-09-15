// Business rules 1 and 2 from CLAUDE.md, surfaced read-only in the rota
// detail panel. The open-shift fill flow (Phase 1 task 5) enforces these
// server-side before writing an assignment; this is the same check reused
// to flag shifts that are already out of compliance.

import type { RotaShift } from "@/lib/mock-data";
import type { Database } from "@/lib/database.types";

type Client = Database["public"]["Tables"]["clients"]["Row"];
type Staff = Database["public"]["Tables"]["staff"]["Row"];

export interface ClientComplianceResult {
  client: Client;
  compliant: boolean;
  reason?: string;
}

export function checkClientGenderCompliance(
  client: Client,
  assignedStaff: Staff[],
): ClientComplianceResult {
  if (!client.gender_requirement) {
    return { client, compliant: true };
  }

  if (assignedStaff.length === 0) {
    return { client, compliant: true }; // nothing to flag on an unfilled shift
  }

  const matching = assignedStaff.filter((s) => s.gender === client.gender_requirement);

  if (assignedStaff.length === 1) {
    return matching.length === 1
      ? { client, compliant: true }
      : {
          client,
          compliant: false,
          reason: `Requires a ${client.gender_requirement} carer; assigned staff does not match.`,
        };
  }

  // Pairing rule: block only if *all* assigned staff are the opposite gender.
  return matching.length > 0
    ? { client, compliant: true }
    : {
        client,
        compliant: false,
        reason: `Requires at least one ${client.gender_requirement} carer among the assigned pair.`,
      };
}

export function checkShiftCompliance(shift: RotaShift): ClientComplianceResult[] {
  return shift.clients.map((client) => checkClientGenderCompliance(client, shift.staff));
}
