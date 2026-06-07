import { useEffect, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { Card } from "@/components/ui/card";
import { CheckCircle2, XCircle, Loader2, MailX } from "lucide-react";

export default function Unsubscribe() {
  const [searchParams] = useSearchParams();
  const email = searchParams.get("email");
  const type = searchParams.get("type");

  const [status, setStatus] = useState<"loading" | "success" | "already" | "error">("loading");
  const [name, setName] = useState("");

  useEffect(() => {
    if (!email) {
      setStatus("error");
      return;
    }

    const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
    const params = new URLSearchParams({ email });
    if (type) params.set("type", type);
    const url = `${supabaseUrl}/functions/v1/handle-unsubscribe?${params.toString()}`;

    fetch(url)
      .then((res) => res.json())
      .then((data) => {
        if (data.success) {
          setName(data.name || "");
          setStatus(data.already_unsubscribed ? "already" : "success");
        } else {
          setStatus("error");
        }
      })
      .catch(() => setStatus("error"));
  }, [email, type]);

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <Card className="max-w-md w-full p-8 text-center space-y-4">
        {status === "loading" && (
          <>
            <Loader2 className="w-12 h-12 mx-auto text-muted-foreground animate-spin" />
            <p className="text-muted-foreground">A processar...</p>
          </>
        )}

        {status === "success" && (
          <>
            <CheckCircle2 className="w-12 h-12 mx-auto text-emerald-500" />
            <h1 className="text-xl font-semibold">Subscrição cancelada</h1>
            <p className="text-muted-foreground">
              {name ? `${name}, o` : "O"} seu pedido foi processado com sucesso.
              Não receberá mais notificações de marketing.
            </p>
          </>
        )}

        {status === "already" && (
          <>
            <MailX className="w-12 h-12 mx-auto text-amber-500" />
            <h1 className="text-xl font-semibold">Já cancelado</h1>
            <p className="text-muted-foreground">
              {name ? `${name}, a` : "A"} sua subscrição já tinha sido cancelada anteriormente.
            </p>
          </>
        )}

        {status === "error" && (
          <>
            <XCircle className="w-12 h-12 mx-auto text-destructive" />
            <h1 className="text-xl font-semibold">Erro</h1>
            <p className="text-muted-foreground">
              Não foi possível processar o seu pedido. O link pode estar inválido.
            </p>
          </>
        )}
      </Card>
    </div>
  );
}
