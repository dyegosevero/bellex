import { useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { Navigate, Link } from "react-router-dom";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { LightRays } from "@/components/ui/light-rays";
import { Loader2, ArrowLeft, CheckCircle } from "lucide-react";
import { toast } from "sonner";

const EDGE_FUNCTIONS_BASE = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1`;
const ANON_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY as string;

const ForgotPassword = () => {
  const { user, loading } = useAuth();
  const [email, setEmail] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [sent, setSent] = useState(false);

  if (loading) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-background gap-3">
        <Loader2 className="h-6 w-6 animate-spin text-primary" />
      </div>
    );
  }

  if (user) return <Navigate to="/dashboard" replace />;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);

    try {
      const res = await fetch(`${EDGE_FUNCTIONS_BASE}/request-password-reset`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          apikey: ANON_KEY,
        },
        body: JSON.stringify({ email }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data?.error || `Erro HTTP ${res.status}`);
      if (data?.error) throw new Error(data.error);

      setSent(true);
    } catch (err: any) {
      toast.error(err.message || "Erro ao enviar e-mail");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen flex">
      <div className="hidden lg:flex lg:w-1/2 relative items-center justify-center overflow-hidden" style={{ backgroundColor: 'hsl(30, 12%, 65%)' }}>
        <LightRays count={7} color="hsl(30 12% 75% / 0.3)" blur={40} opacity={0.4} speed={10} />
        <LightRays count={4} color="hsl(36 40% 72% / 0.25)" blur={50} opacity={0.3} speed={14} />
        <img src={logoColor} alt="Bellex" className="relative z-10 w-72 invert brightness-200" />
      </div>

      <div className="flex-1 flex items-center justify-center p-8">
        <div className="w-full max-w-sm space-y-8">
          <div className="lg:hidden flex justify-center mb-8">
            <img src={logoColor} alt="Bellex" className="w-48 invert" />
          </div>

          {sent ? (
            <div className="space-y-4 text-center">
              <CheckCircle className="h-12 w-12 text-success mx-auto" />
              <h1 className="text-2xl font-light tracking-wider text-foreground">E-MAIL ENVIADO</h1>
              <p className="text-sm text-muted-foreground">
                Se o e-mail <strong>{email}</strong> estiver registado, receberá instruções para redefinir a sua senha.
              </p>
              <Link to="/login">
                <Button variant="outline" className="mt-4">
                  <ArrowLeft className="w-4 h-4 mr-2" /> Voltar ao login
                </Button>
              </Link>
            </div>
          ) : (
            <>
              <div>
                <h1 className="text-2xl font-light tracking-wider text-foreground">RECUPERAR SENHA</h1>
                <p className="text-sm text-muted-foreground mt-1">
                  Insira o seu e-mail para receber o link de redefinição
                </p>
              </div>

              <form onSubmit={handleSubmit} className="space-y-5">
                <div className="space-y-2">
                  <Label htmlFor="email" className="text-xs uppercase tracking-wider text-muted-foreground">
                    E-mail
                  </Label>
                  <Input
                    id="email"
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="seu@email.com"
                    required
                    className="h-11"
                  />
                </div>

                <Button type="submit" className="w-full h-11" disabled={submitting}>
                  {submitting ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" /> Enviando...
                    </>
                  ) : (
                    "Enviar Link de Redefinição"
                  )}
                </Button>
              </form>

              <div className="text-center">
                <Link to="/login" className="text-sm text-muted-foreground hover:text-foreground transition-colors">
                  <ArrowLeft className="w-3.5 h-3.5 inline mr-1" /> Voltar ao login
                </Link>
              </div>
            </>
          )}

          <p className="text-xs text-center text-muted-foreground">
            BELLEX SYSTEM · v1.1
          </p>
        </div>
      </div>
    </div>
  );
};

export default ForgotPassword;
