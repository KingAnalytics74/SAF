import Link from "next/link";
import { redirect } from "next/navigation";
import { getCurrentStaff } from "@/lib/auth";
import { signOut } from "@/app/login/actions";
import { isSupabaseConfigured } from "@/lib/supabase/is-configured";
import { mockStaff } from "@/lib/mock-data";

const ROLE_LABEL: Record<string, string> = {
  staff: "Staff",
  care_coordinator: "Care Coordinator",
  manager: "Manager",
};

export default async function AppLayout({ children }: { children: React.ReactNode }) {
  const previewMode = !isSupabaseConfigured();
  const staff = previewMode ? mockStaff[0] : await getCurrentStaff();

  if (!staff) {
    redirect("/login");
  }

  return (
    <div className="flex flex-1 flex-col bg-zinc-50">
      {previewMode && (
        <div className="bg-amber-400 px-6 py-1.5 text-center text-xs font-medium text-amber-950">
          Preview mode — no Supabase project connected, showing mock data and no real login
        </div>
      )}
      <header className="flex items-center justify-between border-b border-zinc-200 bg-white px-6 py-3">
        <div className="flex items-center gap-6">
          <span className="text-sm font-semibold text-zinc-900">Saf</span>
          <nav className="flex items-center gap-4 text-sm text-zinc-600">
            <Link href="/rota" className="hover:text-zinc-900">
              Rota
            </Link>
          </nav>
        </div>
        <div className="flex items-center gap-3 text-sm text-zinc-600">
          <span>
            {staff.name} · {ROLE_LABEL[staff.role]}
          </span>
          {!previewMode && (
            <form action={signOut}>
              <button type="submit" className="text-zinc-500 hover:text-zinc-900">
                Sign out
              </button>
            </form>
          )}
        </div>
      </header>
      <main className="flex flex-1 flex-col">{children}</main>
    </div>
  );
}
