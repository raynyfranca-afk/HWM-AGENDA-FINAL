export type OSStatus = "agendado" | "em_andamento" | "concluido" | "nao_realizado";

export interface OS {
  id: string;
  numero_os: number;
  cliente_nome: string;
  cliente_telefone: string;
  endereco: string;
  data_agendada: string;
  tipo_equipamento: string;
  tipo_servico: string;
  descricao_problema: string | null;
  tecnico_id: string | null;
  valor: number | null;
  status: OSStatus;
  chk_chegou: boolean;
  chk_diagnostico: boolean;
  chk_peca_trocada: boolean;
  chk_teste_ok: boolean;
  kg_gas: number | null;
  pressao_alta: string | null;
  pressao_baixa: string | null;
  amperagem: string | null;
  marca_modelo: string | null;
  numero_serie: string | null;
  forma_pagamento: string | null;
  garantia_ate: string | null;
  hora_finalizado: string | null;
  laudo: string | null;
  motivo_nao_realizado: string | null;
  assinatura_cliente: string | null;
  created_at: string;
}

/** Status efetivo considerando atraso (>30min) */
export function statusEfetivo(os: Pick<OS, "status" | "data_agendada">): OSStatus | "atrasado" | "alerta_andamento" {
  const now = Date.now();
  const agendada = new Date(os.data_agendada).getTime();
  if (os.status === "concluido") return "concluido";
  if (os.status === "nao_realizado") return "nao_realizado";
  if (os.status === "em_andamento") {
    // > 3h em andamento => alerta amarelo (já é amarelo, mas marcamos)
    if (now - agendada > 3 * 60 * 60 * 1000) return "alerta_andamento";
    return "em_andamento";
  }
  // agendado
  if (now - agendada > 30 * 60 * 1000) return "atrasado";
  return "agendado";
}

export function statusLabel(s: ReturnType<typeof statusEfetivo>): string {
  return {
    agendado: "Agendado",
    em_andamento: "Em Andamento",
    alerta_andamento: "Em Andamento (>3h)",
    concluido: "Concluído",
    nao_realizado: "Não Realizado",
    atrasado: "Atrasado",
  }[s];
}

export function statusColorClasses(s: ReturnType<typeof statusEfetivo>): string {
  switch (s) {
    case "concluido":
      return "border-l-4 border-l-success bg-success/5";
    case "em_andamento":
    case "alerta_andamento":
      return "border-l-4 border-l-warning bg-warning/5";
    case "atrasado":
      return "border-l-4 border-l-danger bg-danger/10";
    case "nao_realizado":
      return "border-l-4 border-l-neutral bg-muted/40";
    default:
      return "border-l-4 border-l-primary bg-card";
  }
}

export function statusBadgeClasses(s: ReturnType<typeof statusEfetivo>): string {
  switch (s) {
    case "concluido":
      return "bg-success text-success-foreground";
    case "em_andamento":
    case "alerta_andamento":
      return "bg-warning text-warning-foreground";
    case "atrasado":
      return "bg-danger text-danger-foreground";
    case "nao_realizado":
      return "bg-neutral text-neutral-foreground";
    default:
      return "bg-primary text-primary-foreground";
  }
}

export const TIPOS_EQUIPAMENTO = ["Split", "AC Janela", "Central", "Geladeira", "Freezer", "Câmara Fria", "Outro"];
export const TIPOS_SERVICO = ["Instalação", "Manutenção Preventiva", "Manutenção Corretiva", "Carga de Gás", "Limpeza", "Orçamento"];
export const FORMAS_PAGAMENTO = ["Pix", "Dinheiro", "Cartão Débito", "Cartão Crédito", "Boleto", "A Faturar"];
