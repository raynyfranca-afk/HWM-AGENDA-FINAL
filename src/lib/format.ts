import { format, parseISO } from "date-fns";
import { ptBR } from "date-fns/locale";

export const fmtData = (d: string | Date) => format(typeof d === "string" ? parseISO(d) : d, "dd/MM/yyyy", { locale: ptBR });
export const fmtHora = (d: string | Date) => format(typeof d === "string" ? parseISO(d) : d, "HH:mm", { locale: ptBR });
export const fmtDataHora = (d: string | Date) => format(typeof d === "string" ? parseISO(d) : d, "dd/MM/yyyy 'às' HH:mm", { locale: ptBR });
export const fmtMoeda = (v: number | string | null | undefined) => {
  const n = typeof v === "string" ? parseFloat(v) : v ?? 0;
  return (n ?? 0).toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
};
