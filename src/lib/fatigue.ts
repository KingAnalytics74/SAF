// Rules-based fatigue scoring (business rule 5 in CLAUDE.md): derived from
// shift history on every read, never stored. In production this should also
// fold in shift_change_log for reassignment history; for now it works off
// each staff member's assigned shift_groups, which is the up-to-date source
// of who is actually working when.

import type { RotaShift } from "@/lib/mock-data";
import type { Database } from "@/lib/database.types";

export type FatigueLevel = "low" | "medium" | "high";

const REST_HOURS_LOW_THRESHOLD = 11; // UK working time guidance for care rotas
const REST_HOURS_HIGH_THRESHOLD = 8;
const CONSECUTIVE_DAYS_MEDIUM = 5;
const CONSECUTIVE_DAYS_HIGH = 7;
const WEEKLY_HOURS_OVER_CAP_MEDIUM = 0; // any hours over contracted cap
const WEEKLY_HOURS_OVER_CAP_HIGH = 10;

function hoursBetween(aIso: string, bIso: string) {
  return (new Date(bIso).getTime() - new Date(aIso).getTime()) / (1000 * 60 * 60);
}

function shiftsForStaff(staffId: string, shifts: RotaShift[]) {
  return shifts
    .filter((s) => s.staff.some((member) => member.id === staffId))
    .sort((a, b) => new Date(a.start_time).getTime() - new Date(b.start_time).getTime());
}

function restHoursBefore(staffId: string, shift: RotaShift, shifts: RotaShift[]) {
  const prior = shiftsForStaff(staffId, shifts).filter(
    (s) => s.id !== shift.id && new Date(s.end_time) <= new Date(shift.start_time),
  );
  const last = prior.at(-1);
  if (!last) return Infinity;
  return hoursBetween(last.end_time, shift.start_time);
}

function consecutiveDaysBefore(staffId: string, shift: RotaShift, shifts: RotaShift[]) {
  const days = new Set(
    shiftsForStaff(staffId, shifts)
      .filter((s) => s.id !== shift.id && new Date(s.start_time) < new Date(shift.start_time))
      .map((s) => s.start_time.slice(0, 10)),
  );

  let count = 0;
  const cursor = new Date(shift.start_time);
  cursor.setDate(cursor.getDate() - 1);
  while (days.has(cursor.toISOString().slice(0, 10))) {
    count += 1;
    cursor.setDate(cursor.getDate() - 1);
  }
  return count;
}

function weeklyHoursIncluding(staffId: string, shift: RotaShift, shifts: RotaShift[]) {
  const windowStart = new Date(shift.start_time);
  windowStart.setDate(windowStart.getDate() - 6);

  return shiftsForStaff(staffId, shifts)
    .filter(
      (s) =>
        new Date(s.start_time) >= windowStart &&
        new Date(s.start_time) <= new Date(shift.start_time),
    )
    .reduce((total, s) => total + hoursBetween(s.start_time, s.end_time), 0);
}

export function staffFatigueForShift(
  staff: Database["public"]["Tables"]["staff"]["Row"],
  shift: RotaShift,
  allShifts: RotaShift[],
): FatigueLevel {
  const restHours = restHoursBefore(staff.id, shift, allShifts);
  const consecutiveDays = consecutiveDaysBefore(staff.id, shift, allShifts);
  const weeklyHours = weeklyHoursIncluding(staff.id, shift, allShifts);
  const hoursOverCap = weeklyHours - (staff.contracted_hours ?? weeklyHours);

  if (
    restHours < REST_HOURS_HIGH_THRESHOLD ||
    consecutiveDays >= CONSECUTIVE_DAYS_HIGH ||
    hoursOverCap > WEEKLY_HOURS_OVER_CAP_HIGH
  ) {
    return "high";
  }

  if (
    restHours < REST_HOURS_LOW_THRESHOLD ||
    consecutiveDays >= CONSECUTIVE_DAYS_MEDIUM ||
    hoursOverCap > WEEKLY_HOURS_OVER_CAP_MEDIUM
  ) {
    return "medium";
  }

  return "low";
}

const LEVEL_RANK: Record<FatigueLevel, number> = { low: 0, medium: 1, high: 2 };

export function shiftFatigue(shift: RotaShift, allShifts: RotaShift[]): FatigueLevel {
  if (shift.staff.length === 0) return "low";
  return shift.staff.reduce<FatigueLevel>((worst, member) => {
    const level = staffFatigueForShift(member, shift, allShifts);
    return LEVEL_RANK[level] > LEVEL_RANK[worst] ? level : worst;
  }, "low");
}
