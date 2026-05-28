import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { TIPOS_EQUIPAMENTO, TIPOS_SERVICO } from "@/lib/os-utils";
import { toast } from "sonner";
import { useAuth } from "@/lib/auth";

export const Route = createFileRoute("/_authenticated/os/nova")({ component: NovaOS });

function NovaOS() {
  const nav = useNavigate();
  const { user } = useAuth();
  const [tecnicos, setTecnicos] = useState<{ id: string; nome: string }[]>([]);
  const [form, setForm] = useState({
    cliente_nome: "", cliente_telefone: "", endereco: "",
    data_agendada: "", hora_agendada: "09:00",
    tipo_equipamento: "Split", tipo_servico: "Manutenção Corretiva",
    descricao_problema: "", tecnico_id: "", valor: "",
  });
  const [loading, setLoading] = useState(false);

  useEffect(() => { supabase.from("tecnicos").select("id,nome").eq("ativo", true).then(({ data }) => setTecnicos(data ?? [])); }, []);

  const set = (k: string, v: string) => setForm(f => ({ ...f, [k]: v }));

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    try {
      const dt = new Date(`${form.data_agendada}T${form.hora_agendada}:00`);
      const { data, error } = await supabase.from("ordens_servico").insert({
        cliente_nome: form.cliente_nome,
        cliente_telefone: form.cliente_telefone,
        endereco: form.endereco,
        data_agendada: dt.toISOString(),
        tipo_equipamento: form.tipo_equipamento,
        tipo_servico: form.tipo_servico,
        descricao_problema: form.descricao_problema || null,
        tecnico_id: form.tecnico_id || null,
        valor: form.valor ? parseFloat(form.valor) : 0,
        created_by: user?.id,
      }).select("id").single();
      if (error) throw error;
      toast.success("OS criada!");
      nav({ to: "/os/$id", params: { id: data.id } });
    } catch (err: any) { toast.error(err.message); }
    finally { setLoading(false); }
  }

  return (
    <form onSubmit={onSubmit} className="space-y-4">
      <h1 className="text-2xl font-bold">Nova OS</h1>

      <Field label="Nome do Cliente"><Input required value={form.cliente_nome} onChange={(e) => set("cliente_nome", e.target.value)} className="h-11" /></Field>
      <Field label="Telefone"><Input required value={form.cliente_telefone} onChange={(e) => set("cliente_telefone", e.target.value)} placeholder="(83) 99999-9999" className="h-11" /></Field>
      <Field label="Endereço completo"><Textarea required value={form.endereco} onChange={(e) => set("endereco", e.target.value)} rows={2} /></Field>

      <div className="grid grid-cols-2 gap-3">
        <Field label="Data"><Input type="date" required value={form.data_agendada} onChange={(e) => set("data_agendada", e.target.value)} className="h-11" /></Field>
        <Field label="Hora"><Input type="time" required value={form.hora_agendada} onChange={(e) => set("hora_agendada", e.target.value)} className="h-11" /></Field>
      </div>

      <Field label="Tipo de Equipamento">
        <Select value={form.tipo_equipamento} onValueChange={(v) => set("tipo_equipamento", v)}>
          <SelectTrigger className="h-11"><SelectValue /></SelectTrigger>
          <SelectContent>{TIPOS_EQUIPAMENTO.map(t => <SelectItem key={t} value={t}>{t}</SelectItem>)}</SelectContent>
        </Select>
      </Field>

      <Field label="Tipo de Serviço">
        <Select value={form.tipo_servico} onValueChange={(v) => set("tipo_servico", v)}>
          <SelectTrigger className="h-11"><SelectValue /></SelectTrigger>
          <SelectContent>{TIPOS_SERVICO.map(t => <SelectItem key={t} value={t}>{t}</SelectItem>)}</SelectContent>
        </Select>
      </Field>

      <Field label="Descrição do Problema"><Textarea value={form.descricao_problema} onChange={(e) => set("descricao_problema", e.target.value)} rows={3} /></Field>

      <Field label="Técnico Responsável">
        <Select value={form.tecnico_id} onValueChange={(v) => set("tecnico_id", v)}>
          <SelectTrigger className="h-11"><SelectValue placeholder="Selecionar técnico" /></SelectTrigger>
          <SelectContent>{tecnicos.map(t => <SelectItem key={t.id} value={t.id}>{t.nome}</SelectItem>)}</SelectContent>
        </Select>
      </Field>

      <Field label="Valor do Serviço (R$)"><Input type="number" step="0.01" value={form.valor} onChange={(e) => set("valor", e.target.value)} className="h-11" /></Field>

      <div className="flex gap-2 pt-2">
        <Button type="button" variant="outline" onClick={() => nav({ to: "/dashboard" })} className="flex-1 h-12">Cancelar</Button>
        <Button type="submit" disabled={loading} className="flex-1 h-12 text-base font-semibold">{loading ? "Salvando…" : "Criar OS"}</Button>
      </div>
    </form>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return <div className="space-y-1.5"><Label className="text-sm font-medium">{label}</Label>{children}</div>;
}
