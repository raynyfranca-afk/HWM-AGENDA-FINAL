import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { startOfWeek, addDays, format, isSameDay, addWeeks, subWeeks } from "date-fns";
import { ptBR } from "date-fns/locale";
import { Button } from "@/components/ui/button";
import { ChevronLeft, ChevronRight, Plus } from "lucide-react";
import { statusEfetivo, statusBadgeClasses, type OS } from "@/lib/os-utils";
import { fmtHora } from "@/lib/format";

export const Route = createFileRoute("/_authenticated/agenda")({ component: Agenda });

function Agenda() {
  const [oss, setOss] = useState<OS[]>([]);
  const [base, setBase] = useState(() => startOfWeek(new Date(), { weekStartsOn: 1 }));

  useEffect(() => {
    supabase.from("ordens_servico").select("*").order("data_agendada", { ascending: true })
      .then(({ data }) => setOss((data as OS[]) ?? []));
  }, []);

  const dias = useMemo(() => Array.from({ length: 7 }, (_, i) => addDays(base, i)), [base]);

  async function moverPara(osId: string, novaData: Date) {
    const original = oss.find(o => o.id === osId);
    if (!original) return;
    const old = new Date(original.data_agendada);
    novaData.setHours(old.getHours(), old.getMinutes(), 0, 0);
    setOss(prev => prev.map(o => o.id === osId ? { ...o, data_agendada: novaData.toISOString() } : o));
    await supabase.from("ordens_servico").update({ data_agendada: novaData.toISOString() }).eq("id", osId);
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between gap-2">
        <div className="flex items-center gap-1">
          <Button size="icon" variant="outline" onClick={() => setBase(b => subWeeks(b, 1))}><ChevronLeft /></Button>
          <div className="px-3 font-medium text-sm">
            {format(dias[0], "dd MMM", { locale: ptBR })} – {format(dias[6], "dd MMM yyyy", { locale: ptBR })}
          </div>
          <Button size="icon" variant="outline" onClick={() => setBase(b => addWeeks(b, 1))}><ChevronRight /></Button>
        </div>
        <Link to="/os/nova"><Button><Plus className="h-4 w-4 mr-1" />Nova OS</Button></Link>
      </div>

      <div className="space-y-3">
        {dias.map(dia => {
          const items = oss.filter(o => isSameDay(new Date(o.data_agendada), dia))
            .sort((a, b) => +new Date(a.data_agendada) - +new Date(b.data_agendada));
          return (
            <div key={dia.toISOString()} onDragOver={(e) => e.preventDefault()}
              onDrop={(e) => { const id = e.dataTransfer.getData("os-id"); if (id) moverPara(id, new Date(dia)); }}
              className="rounded-xl border bg-card p-3">
              <div className="flex items-center justify-between mb-2">
                <div className="font-semibold capitalize">{format(dia, "EEEE", { locale: ptBR })}</div>
                <div className="text-xs text-muted-foreground">{format(dia, "dd/MM")}</div>
              </div>
              {items.length === 0 ? <div className="text-xs text-muted-foreground py-2">Sem agendamentos</div> :
                <div className="space-y-2">
                  {items.map(os => {
                    const s = statusEfetivo(os);
                    return (
                      <Link key={os.id} to="/os/$id" params={{ id: os.id }}
                        draggable onDragStart={(e) => e.dataTransfer.setData("os-id", os.id)}
                        className="flex items-center gap-3 p-2 rounded-lg bg-muted/40 hover:bg-muted cursor-move">
                        <span className="font-mono text-xs w-12">{fmtHora(os.data_agendada)}</span>
                        <span className="flex-1 truncate text-sm font-medium">{os.cliente_nome}</span>
                        <span className={`text-[10px] px-2 py-0.5 rounded-full ${statusBadgeClasses(s)}`}>{os.tipo_equipamento}</span>
                      </Link>
                    );
                  })}
                </div>
              }
            </div>
          );
        })}
      </div>
      <p className="text-xs text-muted-foreground text-center">Arraste uma OS para outro dia para reagendar.</p>
    </div>
  );
}
