import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { ExternalLink } from "lucide-react";

const ServicesTab = () => {
  const navigate = useNavigate();

  return (
    <div className="space-y-4">
      <p className="text-sm text-muted-foreground">
        A gestão de serviços foi movida para uma página dedicada com suporte a categorias, ordenação e importação.
      </p>
      <Button onClick={() => navigate("/servicos")}>
        <ExternalLink className="w-4 h-4 mr-2" /> Ir para Serviços
      </Button>
    </div>
  );
};

export default ServicesTab;
