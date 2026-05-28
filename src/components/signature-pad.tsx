import { useRef } from "react";
import SignatureCanvas from "react-signature-canvas";
import { Button } from "@/components/ui/button";

export function SignaturePad({ value, onChange }: { value: string | null; onChange: (dataUrl: string | null) => void }) {
  const ref = useRef<SignatureCanvas>(null);

  return (
    <div className="space-y-2">
      <div className="border-2 border-dashed border-input rounded-lg bg-background">
        {value ? (
          <img src={value} alt="Assinatura" className="w-full h-40 object-contain" />
        ) : (
          <SignatureCanvas
            ref={ref}
            penColor="#0A66C2"
            canvasProps={{ className: "w-full h-40 rounded-lg" }}
            onEnd={() => onChange(ref.current?.toDataURL("image/png") ?? null)}
          />
        )}
      </div>
      <div className="flex gap-2">
        <Button type="button" variant="outline" size="sm" onClick={() => { ref.current?.clear(); onChange(null); }}>
          Limpar
        </Button>
      </div>
    </div>
  );
}
