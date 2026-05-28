import { AlertTriangle } from "lucide-react";

export function AtrasadosBanner({ count }: { count: number }) {
  if (count <= 0) return null;
  return (
    <div className="sticky top-0 z-30 -mx-4 px-4 py-3 bg-danger text-danger-foreground flex items-center gap-2 shadow-md">
      <AlertTriangle className="h-5 w-5 shrink-0" />
      <p className="font-semibold text-sm">Você tem {count} {count === 1 ? "serviço atrasado" : "serviços atrasados"}</p>
    </div>
  );
}
