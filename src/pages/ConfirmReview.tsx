import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { Loader2, CheckCircle2, AlertTriangle } from "lucide-react";
import { Card } from "@/components/ui/card";

export default function ConfirmReview() {
  const { token } = useParams<{ token: string }>();
  const [state, setState] = useState<"loading" | "success" | "error">("loading");
  const [message, setMessage] = useState("");

  useEffect(() => {
    if (!token) {
      setState("error");
      setMessage("Token em falta.");
      return;
    }
    (async () => {
      try {
        const url = `https://${import.meta.env.VITE_SUPABASE_PROJECT_ID}.supabase.co/functions/v1/confirm-review?token=${encodeURIComponent(token)}`;
        const res = await fetch(url, { method: "GET" });
        if (res.ok) {
          setState("success");
          setMessage("Obrigado por confirmar a sua avaliação! 🙏⭐");
        } else {
          setState("error");
          setMessage("Link inválido ou expirado.");
        }
      } catch {
        setState("error");
        setMessage("Não foi possível confirmar. Tente novamente.");
      }
    })();
  }, [token]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-5">
      <Card className="max-w-md w-full p-10 text-center space-y-4">
        {state === "loading" && (
          <>
            <Loader2 className="w-12 h-12 mx-auto animate-spin text-primary" />
            <p className="text-muted-foreground">A confirmar a sua avaliação...</p>
          </>
        )}
        {state === "success" && (
          <>
            <CheckCircle2 className="w-12 h-12 mx-auto text-primary" />
            <h1 className="text-xl font-medium">Obrigado!</h1>
            <p className="text-muted-foreground">{message}</p>
          </>
        )}
        {state === "error" && (
          <>
            <AlertTriangle className="w-12 h-12 mx-auto text-destructive" />
            <h1 className="text-xl font-medium">Ops...</h1>
            <p className="text-muted-foreground">{message}</p>
          </>
        )}
      </Card>
    </div>
  );
}
