// Hand-written to match supabase/migrations/0001_init.sql. Regenerate with
// `supabase gen types typescript` once a live project exists and this
// drifts from the real schema.

export type Gender = "M" | "F";
export type StaffRole = "staff" | "care_coordinator" | "manager";
export type ShiftType = "day" | "sleep_in" | "waking_night";
export type ShiftStatus = "open" | "filled" | "cancelled";
export type ShiftChangeAction =
  | "created"
  | "reassigned"
  | "cancelled"
  | "swap_requested"
  | "swap_approved"
  | "swap_rejected"
  | "assigned_investigation";
export type SwapStatus = "pending" | "approved" | "rejected";

export interface Database {
  public: {
    Tables: {
      staff: {
        Row: {
          id: string;
          auth_user_id: string | null;
          name: string;
          gender: Gender;
          role: StaffRole;
          contracted_hours: number | null;
          certifications: string[] | null;
          created_at: string;
        };
        Insert: Partial<Database["public"]["Tables"]["staff"]["Row"]> & {
          name: string;
          gender: Gender;
          role: StaffRole;
        };
        Update: Partial<Database["public"]["Tables"]["staff"]["Row"]>;
      };
      clients: {
        Row: {
          id: string;
          name: string;
          address: string | null;
          gender_requirement: Gender | null;
          is_minor: boolean;
          care_needs: string | null;
          created_at: string;
        };
        Insert: Partial<Database["public"]["Tables"]["clients"]["Row"]> & {
          name: string;
        };
        Update: Partial<Database["public"]["Tables"]["clients"]["Row"]>;
      };
      shift_groups: {
        Row: {
          id: string;
          shift_type: ShiftType;
          start_time: string;
          end_time: string;
          status: ShiftStatus;
          created_at: string;
        };
        Insert: Partial<Database["public"]["Tables"]["shift_groups"]["Row"]> & {
          shift_type: ShiftType;
          start_time: string;
          end_time: string;
        };
        Update: Partial<Database["public"]["Tables"]["shift_groups"]["Row"]>;
      };
      shift_group_staff: {
        Row: { shift_group_id: string; staff_id: string };
        Insert: { shift_group_id: string; staff_id: string };
        Update: Partial<{ shift_group_id: string; staff_id: string }>;
      };
      shift_group_clients: {
        Row: { shift_group_id: string; client_id: string };
        Insert: { shift_group_id: string; client_id: string };
        Update: Partial<{ shift_group_id: string; client_id: string }>;
      };
      staffing_requirements: {
        Row: {
          id: string;
          client_id: string;
          time_slot: string;
          required_staff_count: number;
        };
        Insert: Partial<Database["public"]["Tables"]["staffing_requirements"]["Row"]> & {
          client_id: string;
          time_slot: string;
          required_staff_count: number;
        };
        Update: Partial<Database["public"]["Tables"]["staffing_requirements"]["Row"]>;
      };
      shift_change_log: {
        Row: {
          id: string;
          shift_group_id: string;
          changed_by: string | null;
          actor_role: string;
          action: ShiftChangeAction;
          previous_staff_id: string | null;
          new_staff_id: string | null;
          reason: string | null;
          created_at: string;
        };
        Insert: Partial<Database["public"]["Tables"]["shift_change_log"]["Row"]> & {
          shift_group_id: string;
          actor_role: string;
          action: ShiftChangeAction;
        };
        Update: Partial<Database["public"]["Tables"]["shift_change_log"]["Row"]>;
      };
      swap_requests: {
        Row: {
          id: string;
          shift_group_id: string;
          from_staff_id: string;
          to_staff_id: string | null;
          reason: string | null;
          status: SwapStatus;
          requested_at: string;
          decided_by: string | null;
          decided_at: string | null;
        };
        Insert: Partial<Database["public"]["Tables"]["swap_requests"]["Row"]> & {
          shift_group_id: string;
          from_staff_id: string;
        };
        Update: Partial<Database["public"]["Tables"]["swap_requests"]["Row"]>;
      };
    };
  };
}
