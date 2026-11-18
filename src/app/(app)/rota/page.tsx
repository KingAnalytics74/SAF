import { getRotaShifts } from "@/lib/data/rota";
import { RotaGrid } from "./rota-grid";

export default async function RotaPage() {
  const shifts = await getRotaShifts();

  return (
    <div className="flex flex-1 flex-col">
      <div className="border-b border-zinc-200 bg-white px-6 py-4">
        <h1 className="text-lg font-semibold text-zinc-900">Rota</h1>
        <p className="text-sm text-zinc-500">Click a shift for staffing and compliance detail.</p>
      </div>
      <RotaGrid shifts={shifts} />
    </div>
  );
}
