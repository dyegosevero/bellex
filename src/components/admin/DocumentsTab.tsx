import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { FileSignature, ArrowRight } from "lucide-react";

const DocumentsTab = () => {
  const navigate = useNavigate();
  return (
    <div className="space-y-4">
      <div className="mb-2">
        <h3 className="text-lg font-light tracking-wider flex items-center gap-2">
          <FileSignature className="w-5 h-5" /> DOCUMENTOS
        </h3>
        <p className="text-sm text-muted-foreground mt-1">
          Gerencie os documentos de consentimento e termos para assinatura.
        </p>
      </div>
      <div className="rounded-2xl border border-border/50 bg-muted/30 p-8 flex flex-col items-center gap-4 text-center">
        <FileSignature size={32} className="text-primary/60" />
        <div>
          <p className="text-sm font-medium text-foreground">Documentos foram movidos para uma página dedicada</p>
          <p className="text-xs text-muted-foreground mt-1">
            Crie, edite e organize documentos, e atribua-os diretamente nos serviços.
          </p>
        </div>
        <Button onClick={() => navigate("/documentos")} className="gap-2">
          Ir para Documentos <ArrowRight size={14} />
        </Button>
      </div>
    </div>
  );
};

export default DocumentsTab;
