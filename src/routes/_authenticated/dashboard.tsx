import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { OSCard } from "@/components/os-card";
import { AtrasadosBanner } from "@/components/atrasados-banner";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Plus, Search } from "lucide-react";
import { statusEfetivo, type OS } from "@/lib/os-utils";
import { startOfDay, endOfDay, startOfWeek, endOfWeek, isAfter } from "date-fns";

export const Route = createFileRoute("/_authenticated/dashboard")({ component: Dashboard });

type Filtro = "hoje" | "semana" | "atrasados" | "concluidos" | "nao_realizados" | "em_andamento" | "todos";
const FILTROS: { id: Filtro; label: string }[] = [
  { id: "hoje", label: "Hoje" },
  { id: "semana", label: "Esta Semana" },
  { id: "atrasados", label: "Atrasados" },
  { id: "em_andamento", label: "Em Andamento" },
  { id: "concluidos", label: "Concluídos" },
  { id: "nao_realizados", label: "Não Realizados" },
  { id: "todos", label: "Todos" },
];

function Dashboard() {
  const [oss, setOss] = useState<OS[]>([]);
  const [tecnicos, setTecnicos] = useState<Record<string, string>>({});
  const [filtro, setFiltro] = useState<Filtro>("hoje");
  const [busca, setBusca] = useState("");

  useEffect(() => {
    (async () => {
      const [{ data: os }, { data: tec }] = await Promise.all([
        supabase.from("ordens_servico").select("*").order("data_agendada", { ascending: true }),
        supabase.from("tecnicos").select("id,nome"),
      ]);
      setOss((os as OS[]) ?? []);
      setTecnicos(Object.fromEntries((tec ?? []).map((t: any) => [t.id, t.nome])));
    })();
  }, []);

  const atrasados = useMemo(() => oss.filter(o => statusEfetivo(o) === "atrasado"), [oss]);

  const filtrados = useMemo(() => {
    const now = new Date();
    const today0 = startOfDay(now), today1 = endOfDay(now);
    const week0 = startOfWeek(now, { weekStartsOn: 1 }), week1 = endOfWeek(now, { weekStartsOn: 1 });
    let arr = oss;
    switch (filtro) {
      case "hoje": arr = arr.filter(o => { const d = new Date(o.data_agendada); return d >= today0 && d <= today1; }); break;
      case "semana": arr = arr.filter(o => { const d = new Date(o.data_agendada); return d >= week0 && d <= week1; }); break;
      case "atrasados": arr = arr.filter(o => statusEfetivo(o) === "atrasado"); break;
      case "em_andamento": arr = arr.filter(o => o.status === "em_andamento"); break;
      case "concluidos": arr = arr.filter(o => o.status === "concluido"); break;
      case "nao_realizados": arr = arr.filter(o => o.status === "nao_realizado"); break;
    }
    if (busca.trim()) {
      const q = busca.toLowerCase();
      arr = arr.filter(o => o.cliente_nome.toLowerCase().includes(q) || o.endereco.toLowerCase().includes(q) || String(o.numero_os).includes(q));
    }
    return arr;
  }, [oss, filtro, busca]);

  return (
    <div className="space-y-4">
      <AtrasadosBanner count={atrasados.length} />

      <div className="flex items-center gap-2">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input placeholder="Buscar cliente, endereço ou OS…" className="h-11 pl-9" value={busca} onChange={(e) => setBusca(e.target.value)} />
        </div>
        <Link to="/os/nova">
          <Button size="lg" className="h-11"><Plus className="h-5 w-5 mr-1" />Nova</Button>
        </Link>
      </div>

      <div className="flex gap-2 overflow-x-auto pb-1 -mx-4 px-4 scrollbar-none">
        {FILTROS.map(f => (
          <button key={f.id} onClick={() => setFiltro(f.id)}
            className={`shrink-0 px-4 h-10 rounded-full text-sm font-medium transition-colors ${filtro === f.id ? "bg-primary text-primary-foreground" : "bg-muted text-foreground/70"}`}>
            {f.label}
          </button>
        ))}
      </div>

      <div className="space-y-3">
        {filtrados.length === 0 ? (
          <div className="text-center py-12 text-muted-foreground">Nenhuma OS encontrada.</div>
        ) : filtrados.map(os => <OSCard key={os.id} os={os} tecnicoNome={os.tecnico_id ? tecnicos[os.tecnico_id] : undefined} />)}
      </div>
    </div>
  );
}
