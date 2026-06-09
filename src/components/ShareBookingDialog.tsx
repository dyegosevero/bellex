import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Check, Copy } from "lucide-react";
import { WhatsAppIcon } from "@/components/icons/WhatsAppIcon";
import logoColor from "@/assets/logo-color.png";

interface ShareBookingDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const ShareBookingDialog = ({ open, onOpenChange }: ShareBookingDialogProps) => {
  const [copied, setCopied] = useState(false);

  const { data: clinicSettings } = useQuery({
    queryKey: ["clinic-settings-share"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("clinic_settings")
        .select("clinic_name, booking_url")
        .limit(1)
        .maybeSingle();
      if (error) throw error;
      return data;
    },
    staleTime: 5 * 60 * 1000,
  });

  const bookingUrl = (clinicSettings as any)?.booking_url || window.location.origin + "/agendamento";
  const clinicName = clinicSettings?.clinic_name || "Clínica";

  const handleCopy = async () => {
    await navigator.clipboard.writeText(bookingUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const shareText = "Faça aqui o seu agendamento de forma simples e rápida.";

  const shareWhatsApp = () =>
    window.open(`https://wa.me/?text=${encodeURIComponent(`${shareText}\n${bookingUrl}`)}`, "_blank");

  const shareFacebook = () =>
    window.open(`https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(bookingUrl)}`, "_blank");

  const shareEmail = () =>
    window.open(
      `mailto:?subject=${encodeURIComponent("Agendamento Online")}&body=${encodeURIComponent(`${shareText}\n\n${bookingUrl}`)}`,
      "_blank",
    );

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="sr-only">Compartilhar página de agendamento</DialogTitle>
        </DialogHeader>

        {/* Preview card */}
        <div className="rounded-lg border border-border overflow-hidden">
          <div className="bg-gradient-to-br from-primary/20 to-primary/5 p-6 flex items-center justify-center">
            <img src={logoColor} alt="Logo" className="h-10 w-auto" />
          </div>
          <div className="p-4">
            <p className="font-semibold text-sm">{clinicName} | Agendamento Online</p>
            <p className="text-xs text-muted-foreground mt-0.5">{shareText}</p>
          </div>
        </div>

        {/* Link copy */}
        <div className="space-y-2">
          <p className="text-sm text-muted-foreground text-center">Link da Página de Agendamento</p>
          <div className="flex items-center gap-2">
            <Input value={bookingUrl} readOnly className="text-xs" />
            <Button variant="outline" size="sm" onClick={handleCopy} className="shrink-0 gap-1.5">
              {copied ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
              {copied ? "Copiado" : "Copiar"}
            </Button>
          </div>
        </div>

        {/* Social share */}
        <div className="space-y-3">
          <p className="text-sm text-muted-foreground text-center">Compartilhe com seus contatos</p>
          <div className="flex justify-center gap-4">
            <button
              onClick={shareFacebook}
              className="w-12 h-12 rounded-full bg-[#1877F2] flex items-center justify-center hover:opacity-90 transition-opacity"
              title="Facebook"
            >
              <svg viewBox="0 0 24 24" className="w-6 h-6 fill-white">
                <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z" />
              </svg>
            </button>
            <button
              onClick={shareWhatsApp}
              className="w-12 h-12 rounded-full bg-[#25D366] flex items-center justify-center hover:opacity-90 transition-opacity"
              title="WhatsApp"
            >
              <WhatsAppIcon className="w-6 h-6 text-white" />
            </button>
            <button
              onClick={shareEmail}
              className="w-12 h-12 rounded-full bg-destructive/10 flex items-center justify-center hover:opacity-90 transition-opacity"
              title="Email"
            >
              <svg viewBox="0 0 24 24" className="w-6 h-6">
                <path
                  fill="#EA4335"
                  d="M24 5.457v13.909c0 .904-.732 1.636-1.636 1.636h-3.819V11.73L12 16.64l-6.545-4.91v9.273H1.636A1.636 1.636 0 010 19.366V5.457c0-2.023 2.309-3.178 3.927-1.964L5.455 4.64 12 9.548l6.545-4.91 1.528-1.145C21.69 2.28 24 3.434 24 5.457z"
                />
              </svg>
            </button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default ShareBookingDialog;
