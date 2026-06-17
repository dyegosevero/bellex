import { Navigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { BlurFade } from "@/components/ui/blur-fade";
import { PageHeader } from "@/components/ui/PageHeader";
import { FileSignature } from "lucide-react";
import DocumentsTab from "@/components/admin/DocumentsTab";

export default function AdminDocumentos() {
  const { role } = useAuth();
  if (role !== "admin") return <Navigate to="/dashboard" replace />;
  return (
    <div>
      <BlurFade delay={0.05}>
        <div className="mb-8">
          <PageHeader icon={<FileSignature className="w-5 h-5" />} title="Documentos" subtitle="Termos de consentimento e documentos para assinatura" />
        </div>
      </BlurFade>
      <DocumentsTab />
    </div>
  );
}
