import { Link } from "@tanstack/react-router";
import { Phone, Navigation, User, Clock } from "lucide-react";
import { fmtData, fmtHora, fmtMoeda } from "@/lib/format";
import { statusEfetivo, statusLabel, statusColorClasses, statusBadgeClasses, type OS } from "@/lib/os-utils";

export function OSCard({ os, tecnicoNome }: { os: OS; tecnicoNome?: string }) {
  const s = statusEfetivo(os);
  const enderecoEnc = encodeURIComponent(os.endereco);
  return (
    <Link to="/os/$id" params={{ id: os.id }} className={`block rounded-xl shadow-sm hover:shadow-md transition-shadow p-4 space-y-3 ${statusColorClasses(s)}`}>
      <div className="flex items-start justify-between gap-2">
        <div>
          <div className="text-xs font-mono text-muted-foreground">OS #{String(os.numero_os).padStart(4, "0")}</div>
          <div className="font-semibold text-base leading-tight">{os.cliente_nome}</div>
        </div>
        <span className={`text-xs font-semibold px-2 py-1 rounded-full ${statusBadgeClasses(s)}`}>{statusLabel(s)}</span>
      </div>

      <div className="text-sm text-foreground/80 line-clamp-2">{os.endereco}</div>

      <div className="flex items-center gap-3 text-xs text-muted-foreground flex-wrap">
        <span className="flex items-center gap-1"><Clock className="h-3.5 w-3.5" />{fmtData(os.data_agendada)} {fmtHora(os.data_agendada)}</span>
        {tecnicoNome && <span className="flex items-center gap-1"><User className="h-3.5 w-3.5" />{tecnicoNome}</span>}
        <span className="font-medium">{os.tipo_equipamento} · {os.tipo_servico}</span>
        {os.valor ? <span className="ml-auto font-semibold text-foreground">{fmtMoeda(os.valor)}</span> : null}
      </div>

      <div className="flex gap-2 pt-1" onClick={(e) => e.stopPropagation()}>
        <a href={`tel:${os.cliente_telefone.replace(/\D/g, "")}`} className="flex-1 inline-flex items-center justify-center gap-2 h-10 rounded-lg bg-primary text-primary-foreground font-medium text-sm">
          <Phone className="h-4 w-4" /> Ligar
        </a>
        <a href={`https://waze.com/ul?q=${enderecoEnc}`} target="_blank" rel="noreferrer" className="flex-1 inline-flex items-center justify-center gap-2 h-10 rounded-lg bg-accent text-accent-foreground font-medium text-sm">
          <Navigation className="h-4 w-4" /> Waze
        </a>
        <a href={`https://www.google.com/maps/dir/?api=1&destination=${enderecoEnc}`} target="_blank" rel="noreferrer" className="flex-1 inline-flex items-center justify-center gap-2 h-10 rounded-lg border border-input bg-background font-medium text-sm">
          <Navigation className="h-4 w-4" /> Maps
        </a>
      </div>
    </Link>
  );
}
