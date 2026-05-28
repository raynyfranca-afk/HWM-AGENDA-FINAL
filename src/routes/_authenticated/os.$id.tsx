import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Phone, Navigation, ArrowLeft, Camera, X } from "lucide-react";
import { fmtData, fmtHora, fmtMoeda } from "@/lib/format";
import { statusEfetivo, statusLabel, statusBadgeClasses, FORMAS_PAGAMENTO, type OS } from "@/lib/os-utils";
import { SignaturePad } from "@/components/signature-pad";
import { toast } from "sonner";

export const Route = createFileRoute("/_authenticated/os/$id")({ component: OSDetail });

function OSDetail() {
  const { id } = Route.useParams();
  const nav = useNavigate();
  const [os, setOs] = useState<OS | null>(null);
  const [fotos, setFotos] = useState<{ id: string; url: string; tipo: string }[]>([]);
  const [motivo, setMotivo] = useState("");
  const [mostrarMotivo, setMostrarMotivo] = useState(false);
  const [saving, setSaving] = useState(false);

  useEffect(() => { load(); }, [id]);

  async function load() {
    const [{ data: o }, { data: f }] = await Promise.all([
      supabase.from("ordens_servico").select("*").eq("id", id).maybeSingle(),
      supabase.from("os_fotos").select("*").eq("os_id", id),
    ]);
    setOs(o as OS | null);
    setMotivo((o as any)?.motivo_nao_realizado ?? "");
    if (f) {
      const sig = await Promise.all(f.map(async (x: any) => {
        const { data } = await supabase.storage.from("os-fotos").createSignedUrl(x.url, 3600);
        return { id: x.id, url: data?.signedUrl ?? "", tipo: x.tipo };
      }));
      setFotos(sig);
    }
  }

  if (!os) return <div className="text-center py-12 text-muted-foreground">Carregando…</div>;
  const s = statusEfetivo(os);
  const enderecoEnc = encodeURIComponent(os.endereco);

  async function update(patch: Partial<OS>) {
    setOs(o => o ? { ...o, ...patch } as OS : o);
    await supabase.from("ordens_servico").update(patch as any).eq("id", id);
  }

  async function concluir() {
    setSaving(true);
    await supabase.from("ordens_servico").update({
      status: "concluido", hora_finalizado: new Date().toISOString(),
    }).eq("id", id);
    toast.success("OS concluída!");
    await load();
    setSaving(false);
  }
  async function emAndamento() {
    setSaving(true);
    await update({ status: "em_andamento" });
    toast.success("OS em andamento");
    setSaving(false);
  }
  async function naoRealizado() {
    if (!motivo.trim()) { setMostrarMotivo(true); toast.error("Informe o motivo"); return; }
    setSaving(true);
    await supabase.from("ordens_servico").update({ status: "nao_realizado", motivo_nao_realizado: motivo }).eq("id", id);
    toast.success("OS marcada como não realizada");
    await load();
    setMostrarMotivo(false);
    setSaving(false);
  }

  async function uploadFoto(file: File, tipo: "antes" | "depois") {
    const path = `${id}/${Date.now()}-${file.name}`;
    const { error } = await supabase.storage.from("os-fotos").upload(path, file);
    if (error) { toast.error(error.message); return; }
    await supabase.from("os_fotos").insert({ os_id: id, url: path, tipo });
    await load();
  }

  async function removerFoto(fotoId: string) {
    await supabase.from("os_fotos").delete().eq("id", fotoId);
    await load();
  }

  return (
    <div className="space-y-5 pb-8">
      <button onClick={() => nav({ to: "/dashboard" })} className="flex items-center gap-1 text-sm text-muted-foreground"><ArrowLeft className="h-4 w-4" />Voltar</button>

      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <div className="font-mono text-xs text-muted-foreground">OS #{String(os.numero_os).padStart(4, "0")}</div>
          <span className={`text-xs font-semibold px-2 py-1 rounded-full ${statusBadgeClasses(s)}`}>{statusLabel(s)}</span>
        </div>
        <h1 className="text-2xl font-bold leading-tight">{os.cliente_nome}</h1>
        <div className="text-sm text-foreground/80">{os.endereco}</div>
        <div className="text-sm text-muted-foreground">📅 {fmtData(os.data_agendada)} às {fmtHora(os.data_agendada)} · {os.tipo_equipamento} · {os.tipo_servico}</div>
      </div>

      <div className="flex gap-2">
        <a href={`tel:${os.cliente_telefone.replace(/\D/g, "")}`} className="flex-1 inline-flex items-center justify-center gap-2 h-12 rounded-lg bg-primary text-primary-foreground font-semibold"><Phone className="h-5 w-5" />Ligar</a>
        <a href={`https://waze.com/ul?q=${enderecoEnc}`} target="_blank" rel="noreferrer" className="flex-1 inline-flex items-center justify-center gap-2 h-12 rounded-lg bg-accent text-accent-foreground font-semibold"><Navigation className="h-5 w-5" />Navegar</a>
      </div>

      <Section title="Checklist">
        {([
          ["chk_chegou", "Chegou no local"],
          ["chk_diagnostico", "Diagnóstico"],
          ["chk_peca_trocada", "Peça trocada"],
          ["chk_teste_ok", "Teste OK"],
        ] as const).map(([k, label]) => (
          <label key={k} className="flex items-center gap-3 p-3 rounded-lg bg-muted/40">
            <Checkbox checked={!!(os as any)[k]} onCheckedChange={(v) => update({ [k]: !!v } as any)} className="h-6 w-6" />
            <span className="font-medium">{label}</span>
          </label>
        ))}
      </Section>

      <Section title="Dados Técnicos">
        <div className="grid grid-cols-2 gap-3">
          <Field label="Kg de Gás"><Input type="number" step="0.01" defaultValue={os.kg_gas ?? ""} onBlur={(e) => update({ kg_gas: e.target.value ? parseFloat(e.target.value) : null })} className="h-11" /></Field>
          <Field label="Amperagem"><Input defaultValue={os.amperagem ?? ""} onBlur={(e) => update({ amperagem: e.target.value || null })} className="h-11" /></Field>
          <Field label="Pressão Alta"><Input defaultValue={os.pressao_alta ?? ""} onBlur={(e) => update({ pressao_alta: e.target.value || null })} className="h-11" /></Field>
          <Field label="Pressão Baixa"><Input defaultValue={os.pressao_baixa ?? ""} onBlur={(e) => update({ pressao_baixa: e.target.value || null })} className="h-11" /></Field>
        </div>
        <Field label="Marca / Modelo"><Input defaultValue={os.marca_modelo ?? ""} onBlur={(e) => update({ marca_modelo: e.target.value || null })} className="h-11" /></Field>
        <Field label="Nº Série"><Input defaultValue={os.numero_serie ?? ""} onBlur={(e) => update({ numero_serie: e.target.value || null })} className="h-11" /></Field>
      </Section>

      <Section title="Financeiro & Garantia">
        <Field label="Valor do Serviço"><Input type="number" step="0.01" defaultValue={os.valor ?? ""} onBlur={(e) => update({ valor: e.target.value ? parseFloat(e.target.value) : 0 })} className="h-11" /></Field>
        <Field label="Forma de Pagamento">
          <Select value={os.forma_pagamento ?? ""} onValueChange={(v) => update({ forma_pagamento: v })}>
            <SelectTrigger className="h-11"><SelectValue placeholder="Selecionar…" /></SelectTrigger>
            <SelectContent>{FORMAS_PAGAMENTO.map(f => <SelectItem key={f} value={f}>{f}</SelectItem>)}</SelectContent>
          </Select>
        </Field>
        <Field label="Garantia até"><Input type="date" defaultValue={os.garantia_ate ?? ""} onBlur={(e) => update({ garantia_ate: e.target.value || null })} className="h-11" /></Field>
        {os.hora_finalizado && <p className="text-xs text-muted-foreground">Finalizado em {fmtData(os.hora_finalizado)} às {fmtHora(os.hora_finalizado)}</p>}
      </Section>

      <Section title="Laudo Técnico">
        <Textarea rows={4} placeholder="O que foi feito / O que falta fazer" defaultValue={os.laudo ?? ""} onBlur={(e) => update({ laudo: e.target.value || null })} />
      </Section>

      <Section title="Fotos (até 5)">
        <div className="grid grid-cols-3 gap-2">
          {fotos.map(f => (
            <div key={f.id} className="relative aspect-square rounded-lg overflow-hidden bg-muted">
              <img src={f.url} alt={f.tipo} className="w-full h-full object-cover" />
              <span className="absolute bottom-1 left-1 text-[10px] px-1.5 py-0.5 rounded bg-black/60 text-white capitalize">{f.tipo}</span>
              <button onClick={() => removerFoto(f.id)} className="absolute top-1 right-1 bg-black/60 text-white rounded-full p-1"><X className="h-3 w-3" /></button>
            </div>
          ))}
          {fotos.length < 5 && (
            <>
              <label className="aspect-square rounded-lg border-2 border-dashed border-input flex flex-col items-center justify-center text-xs text-muted-foreground cursor-pointer hover:bg-muted/40">
                <Camera className="h-5 w-5 mb-1" />Antes
                <input type="file" accept="image/*" capture="environment" className="hidden" onChange={(e) => e.target.files?.[0] && uploadFoto(e.target.files[0], "antes")} />
              </label>
              <label className="aspect-square rounded-lg border-2 border-dashed border-input flex flex-col items-center justify-center text-xs text-muted-foreground cursor-pointer hover:bg-muted/40">
                <Camera className="h-5 w-5 mb-1" />Depois
                <input type="file" accept="image/*" capture="environment" className="hidden" onChange={(e) => e.target.files?.[0] && uploadFoto(e.target.files[0], "depois")} />
              </label>
            </>
          )}
        </div>
      </Section>

      <Section title="Assinatura do Cliente">
        <SignaturePad value={os.assinatura_cliente} onChange={(v) => update({ assinatura_cliente: v })} />
      </Section>

      {(mostrarMotivo || os.status === "nao_realizado") && (
        <Section title="Motivo (Não Realizado)">
          <Textarea rows={3} value={motivo} onChange={(e) => setMotivo(e.target.value)} placeholder="Explique o motivo…" />
        </Section>
      )}

      <div className="grid grid-cols-1 gap-2 pt-2 sticky bottom-20 bg-background/95 backdrop-blur py-3 -mx-4 px-4 border-t">
        <Button onClick={concluir} disabled={saving} className="h-14 text-base font-bold bg-success hover:bg-success/90 text-success-foreground">✓ Concluir OS</Button>
        <div className="grid grid-cols-2 gap-2">
          <Button onClick={emAndamento} disabled={saving} variant="outline" className="h-12 font-semibold border-warning text-warning-foreground bg-warning/20 hover:bg-warning/30">Em Andamento</Button>
          <Button onClick={naoRealizado} disabled={saving} variant="outline" className="h-12 font-semibold">Não Realizado</Button>
        </div>
      </div>

      <div className="text-center text-xs text-muted-foreground pt-2">{os.valor ? fmtMoeda(os.valor) : ""}</div>
    </div>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="space-y-2 bg-card border rounded-xl p-4">
      <h2 className="font-semibold text-sm uppercase tracking-wide text-muted-foreground">{title}</h2>
      <div className="space-y-3">{children}</div>
    </section>
  );
}
function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return <div className="space-y-1"><Label className="text-xs text-muted-foreground">{label}</Label>{children}</div>;
}
