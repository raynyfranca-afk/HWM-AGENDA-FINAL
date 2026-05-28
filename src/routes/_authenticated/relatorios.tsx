import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { fmtMoeda, fmtData } from "@/lib/format";
import { statusEfetivo, type OS } from "@/lib/os-utils";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import * as XLSX from "xlsx";

export const Route = createFileRoute("/_authenticated/relatorios")({ component: Relatorios });

function Relatorios() {
  const hoje = new Date();
  const inicio = new Date(hoje.getFullYear(), hoje.getMonth(), 1).toISOString().slice(0, 10);
  const fim = hoje.toISOString().slice(0, 10);

  const [oss, setOss] = useState<OS[]>([]);
  const [tecnicos, setTecnicos] = useState<{ id: string; nome: string }[]>([]);
  const [filtros, setFiltros] = useState({ inicio, fim, tecnico_id: "todos" });

  useEffect(() => {
    (async () => {
      const [{ data: os }, { data: tec }] = await Promise.all([
        supabase.from("ordens_servico").select("*"),
        supabase.from("tecnicos").select("id,nome"),
      ]);
      setOss((os as OS[]) ?? []);
      setTecnicos(tec ?? []);
    })();
  }, []);

  const filtradas = useMemo(() => {
    const ini = new Date(filtros.inicio + "T00:00:00").getTime();
    const fim2 = new Date(filtros.fim + "T23:59:59").getTime();
    return oss.filter(o => {
      const t = new Date(o.data_agendada).getTime();
      if (t < ini || t > fim2) return false;
      if (filtros.tecnico_id !== "todos" && o.tecnico_id !== filtros.tecnico_id) return false;
      return true;
    });
  }, [oss, filtros]);

  const metricas = useMemo(() => {
    const total = filtradas.length;
    const concluidas = filtradas.filter(o => o.status === "concluido").length;
    const fat = filtradas.filter(o => o.status === "concluido").reduce((a, o) => a + (Number(o.valor) || 0), 0);
    const gas = filtradas.reduce((a, o) => a + (Number(o.kg_gas) || 0), 0);
    const atrasadas = filtradas.filter(o => statusEfetivo(o) === "atrasado").length;
    return { total, concluidas, taxa: total ? (concluidas / total) * 100 : 0, fat, gas, atrasadas };
  }, [filtradas]);

  function exportarExcel() {
    const ws = XLSX.utils.json_to_sheet(filtradas.map(o => ({
      OS: o.numero_os, Cliente: o.cliente_nome, Endereço: o.endereco,
      Data: fmtData(o.data_agendada), Equipamento: o.tipo_equipamento, Serviço: o.tipo_servico,
      Status: o.status, Valor: o.valor, "Kg Gás": o.kg_gas ?? "",
    })));
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Relatório");
    XLSX.writeFile(wb, `relatorio-hwm-${filtros.inicio}-${filtros.fim}.xlsx`);
  }

  function exportarPDF() {
    const doc = new jsPDF();
    doc.setFontSize(16); doc.text("HWM Refrigeração — Relatório", 14, 18);
    doc.setFontSize(10); doc.text(`Período: ${fmtData(filtros.inicio)} a ${fmtData(filtros.fim)}`, 14, 26);
    doc.text(`Total OS: ${metricas.total} | Concluídas: ${metricas.concluidas} (${metricas.taxa.toFixed(1)}%)`, 14, 32);
    doc.text(`Faturamento: ${fmtMoeda(metricas.fat)} | Gás: ${metricas.gas.toFixed(2)} kg | Atrasadas: ${metricas.atrasadas}`, 14, 38);
    autoTable(doc, {
      startY: 44,
      head: [["OS", "Cliente", "Data", "Serviço", "Status", "Valor"]],
      body: filtradas.map(o => [String(o.numero_os).padStart(4, "0"), o.cliente_nome, fmtData(o.data_agendada), o.tipo_servico, o.status, fmtMoeda(o.valor ?? 0)]),
    });
    doc.save(`relatorio-hwm-${filtros.inicio}-${filtros.fim}.pdf`);
  }

  return (
    <div className="space-y-5">
      <h1 className="text-2xl font-bold">Relatórios</h1>

      <div className="grid grid-cols-2 gap-3 bg-card border rounded-xl p-4">
        <Field label="De"><Input type="date" value={filtros.inicio} onChange={(e) => setFiltros(f => ({ ...f, inicio: e.target.value }))} className="h-11" /></Field>
        <Field label="Até"><Input type="date" value={filtros.fim} onChange={(e) => setFiltros(f => ({ ...f, fim: e.target.value }))} className="h-11" /></Field>
        <div className="col-span-2">
          <Field label="Técnico">
            <Select value={filtros.tecnico_id} onValueChange={(v) => setFiltros(f => ({ ...f, tecnico_id: v }))}>
              <SelectTrigger className="h-11"><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="todos">Todos</SelectItem>
                {tecnicos.map(t => <SelectItem key={t.id} value={t.id}>{t.nome}</SelectItem>)}
              </SelectContent>
            </Select>
          </Field>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <Metric label="Total de OS" value={String(metricas.total)} />
        <Metric label="Taxa de Conclusão" value={`${metricas.taxa.toFixed(0)}%`} />
        <Metric label="Faturamento" value={fmtMoeda(metricas.fat)} />
        <Metric label="Gás Usado" value={`${metricas.gas.toFixed(2)} kg`} />
        <Metric label="Concluídas" value={String(metricas.concluidas)} accent="success" />
        <Metric label="Atrasadas" value={String(metricas.atrasadas)} accent="danger" />
      </div>

      <div className="grid grid-cols-2 gap-2">
        <Button onClick={exportarPDF} className="h-12">Exportar PDF</Button>
        <Button onClick={exportarExcel} variant="outline" className="h-12">Exportar Excel</Button>
      </div>
    </div>
  );
}

function Metric({ label, value, accent }: { label: string; value: string; accent?: "success" | "danger" }) {
  const c = accent === "success" ? "text-success" : accent === "danger" ? "text-danger" : "text-primary";
  return (
    <div className="bg-card border rounded-xl p-4">
      <div className="text-xs text-muted-foreground uppercase tracking-wide">{label}</div>
      <div className={`text-2xl font-bold mt-1 ${c}`}>{value}</div>
    </div>
  );
}
function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return <div className="space-y-1"><Label className="text-xs text-muted-foreground">{label}</Label>{children}</div>;
}
