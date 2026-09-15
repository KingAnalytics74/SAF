"use client";

import { useMemo, useState } from "react";
import type { RotaShift } from "@/lib/mock-data";
import { shiftFatigue, staffFatigueForShift, type FatigueLevel } from "@/lib/fatigue";
import { checkShiftCompliance } from "@/lib/staffing-rules";

const FATIGUE_STYLES: Record<FatigueLevel, { border: string; bg: string; dot: string; label: string }> = {
  low: { border: "border-emerald-300", bg: "bg-emerald-50", dot: "bg-emerald-500", label: "Low fatigue" },
  medium: { border: "border-amber-300", bg: "bg-amber-50", dot: "bg-amber-500", label: "Medium fatigue" },
  high: { border: "border-red-300", bg: "bg-red-50", dot: "bg-red-500", label: "High fatigue" },
};

const SHIFT_TYPE_LABEL: Record<RotaShift["shift_type"], string> = {
  day: "Day",
  sleep_in: "Sleep-in",
  waking_night: "Waking night",
};

const WEEKDAYS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
const MONTHS = [
  "Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec",
];

function dayKey(iso: string) {
  return iso.slice(0, 10);
}

// Formats manually (not with toLocaleDateString) because Intl output for the
// same locale can differ between the Node SSR runtime and the browser,
// which causes hydration mismatches.
function formatDay(iso: string) {
  const d = new Date(iso);
  return `${WEEKDAYS[d.getDay()]} ${d.getDate()} ${MONTHS[d.getMonth()]}`;
}

function formatTime(iso: string) {
  const d = new Date(iso);
  return `${String(d.getHours()).padStart(2, "0")}:${String(d.getMinutes()).padStart(2, "0")}`;
}

export function RotaGrid({ shifts }: { shifts: RotaShift[] }) {
  const [selectedId, setSelectedId] = useState<string | null>(null);

  const days = useMemo(() => {
    const map = new Map<string, RotaShift[]>();
    for (const shift of shifts) {
      const key = dayKey(shift.start_time);
      map.set(key, [...(map.get(key) ?? []), shift]);
    }
    return [...map.entries()].sort(([a], [b]) => a.localeCompare(b));
  }, [shifts]);

  const selectedShift = shifts.find((s) => s.id === selectedId) ?? null;

  return (
    <div className="flex flex-1">
      <div className="flex flex-1 gap-4 overflow-x-auto p-6">
        {days.map(([key, dayShifts]) => (
          <div key={key} className="flex w-64 flex-shrink-0 flex-col gap-2">
            <h2 className="text-sm font-semibold text-zinc-700">{formatDay(dayShifts[0].start_time)}</h2>
            {dayShifts.map((shift) => {
              const fatigue = shiftFatigue(shift, shifts);
              const style = FATIGUE_STYLES[fatigue];
              const isOpen = shift.status === "open";
              return (
                <button
                  key={shift.id}
                  onClick={() => setSelectedId(shift.id)}
                  className={`flex flex-col gap-1 rounded-md border px-3 py-2 text-left text-sm shadow-sm transition-colors ${
                    isOpen ? "border-dashed border-zinc-300 bg-white" : `${style.border} ${style.bg}`
                  } ${selectedId === shift.id ? "ring-2 ring-zinc-400" : ""}`}
                >
                  <div className="flex items-center justify-between">
                    <span className="font-medium text-zinc-900">{SHIFT_TYPE_LABEL[shift.shift_type]}</span>
                    {!isOpen && (
                      <span className={`h-2 w-2 rounded-full ${style.dot}`} title={style.label} />
                    )}
                  </div>
                  <span className="text-xs text-zinc-500">
                    {formatTime(shift.start_time)}–{formatTime(shift.end_time)}
                  </span>
                  {isOpen ? (
                    <span className="text-xs font-medium text-red-600">Open — unfilled</span>
                  ) : (
                    <span className="text-xs text-zinc-600">
                      {shift.staff.map((s) => s.name).join(", ")}
                    </span>
                  )}
                </button>
              );
            })}
          </div>
        ))}
      </div>

      {selectedShift && (
        <ShiftDetailPanel
          shift={selectedShift}
          allShifts={shifts}
          onClose={() => setSelectedId(null)}
        />
      )}
    </div>
  );
}

function ShiftDetailPanel({
  shift,
  allShifts,
  onClose,
}: {
  shift: RotaShift;
  allShifts: RotaShift[];
  onClose: () => void;
}) {
  const compliance = checkShiftCompliance(shift);

  return (
    <aside className="flex w-80 flex-shrink-0 flex-col gap-4 border-l border-zinc-200 bg-white p-5">
      <div className="flex items-start justify-between">
        <div>
          <h3 className="text-base font-semibold text-zinc-900">{SHIFT_TYPE_LABEL[shift.shift_type]} shift</h3>
          <p className="text-sm text-zinc-500">
            {formatDay(shift.start_time)}, {formatTime(shift.start_time)}–{formatTime(shift.end_time)}
          </p>
        </div>
        <button onClick={onClose} className="text-sm text-zinc-400 hover:text-zinc-700">
          Close
        </button>
      </div>

      <div>
        <h4 className="text-xs font-semibold uppercase tracking-wide text-zinc-500">Staff</h4>
        {shift.staff.length === 0 ? (
          <p className="mt-1 text-sm text-red-600">No staff assigned</p>
        ) : (
          <ul className="mt-1 flex flex-col gap-1">
            {shift.staff.map((member) => {
              const level = staffFatigueForShift(member, shift, allShifts);
              const style = FATIGUE_STYLES[level];
              return (
                <li key={member.id} className="flex items-center justify-between text-sm">
                  <span className="text-zinc-800">
                    {member.name} <span className="text-zinc-400">({member.gender})</span>
                  </span>
                  <span className="flex items-center gap-1 text-xs text-zinc-500">
                    <span className={`h-2 w-2 rounded-full ${style.dot}`} />
                    {style.label}
                  </span>
                </li>
              );
            })}
          </ul>
        )}
      </div>

      <div>
        <h4 className="text-xs font-semibold uppercase tracking-wide text-zinc-500">Clients</h4>
        <ul className="mt-1 flex flex-col gap-2">
          {compliance.map(({ client, compliant, reason }) => (
            <li key={client.id} className="text-sm">
              <div className="flex items-center justify-between">
                <span className="text-zinc-800">{client.name}</span>
                {client.gender_requirement && (
                  <span className="text-xs text-zinc-500">Requires {client.gender_requirement}</span>
                )}
              </div>
              {!compliant && <p className="mt-0.5 text-xs text-red-600">{reason}</p>}
            </li>
          ))}
        </ul>
      </div>
    </aside>
  );
}
