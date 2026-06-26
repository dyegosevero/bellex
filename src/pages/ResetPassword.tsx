import { useState } from "react";
import { useSearchParams, Link, useNavigate } from "react-router-dom";
import logoColor from "@/assets/logo-color.png";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { LightRays } from "@/components/ui/light-rays";
import { Loader2, CheckCircle, AlertCircle } from "lucide-react";
import { toast } from "sonner";

const EDGE_FUNCTIONS_BASE = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1`;
const ANON_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY as string;

const ResetPassword = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const token = searchParams.get("token");
  const resetId = searchParams.get("id") || searchParams.get("reset_id");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [done, setDone] = useState(false);

  if (!token && !resetId) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background p-8">
        <div className="text-center space-y-4 max-w-sm">
          <AlertCircle className="h-12 w-12 text-destructive mx-auto" />
          <h1 className="text-xl font-light tracking-wider">LINK INVÁLIDO</h1>
          <p className="text-sm text-muted-foreground">
            Este link de redefinição de senha é inválido ou expirou.
          </p>
          <Link to="/esqueci-senha">
            <Button variant="outline" className="mt-2">Solicitar novo link</Button>
          </Link>
        </div>
      </div>
    );
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (password !== confirmPassword) {
      toast.error("As senhas não coincidem");
      return;
    }

    if (password.length < 6) {
      toast.error("A senha deve ter pelo menos 6 caracteres");
      return;
    }

    setSubmitting(true);

    try {
      const res = await fetch(`${EDGE_FUNCTIONS_BASE}/reset-password`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "apikey": ANON_KEY,
        },
        body: JSON.stringify({ token, reset_id: resetId, new_password: password }),
      });

      const data = await res.json();
      if (!res.ok || data?.error) throw new Error(data?.error || `Erro HTTP ${res.status}`);

      setDone(true);
      setTimeout(() => navigate("/login"), 3000);
    } catch (err: any) {
      toast.error(err.message || "Erro ao redefinir senha");
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

          {done ? (
            <div className="space-y-4 text-center">
              <CheckCircle className="h-12 w-12 text-success mx-auto" />
              <h1 className="text-2xl font-light tracking-wider text-foreground">SENHA REDEFINIDA</h1>
              <p className="text-sm text-muted-foreground">
                A sua senha foi alterada com sucesso. Será redirecionado para o login...
              </p>
            </div>
          ) : (
            <>
              <div>
                <h1 className="text-2xl font-light tracking-wider text-foreground">NOVA SENHA</h1>
                <p className="text-sm text-muted-foreground mt-1">
                  Insira a sua nova senha
                </p>
              </div>

              <form onSubmit={handleSubmit} className="space-y-5">
                <div className="space-y-2">
                  <Label htmlFor="password" className="text-xs uppercase tracking-wider text-muted-foreground">
                    Nova Senha
                  </Label>
                  <Input
                    id="password"
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="••••••••"
                    required
                    minLength={6}
                    className="h-11"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="confirmPassword" className="text-xs uppercase tracking-wider text-muted-foreground">
                    Confirmar Senha
                  </Label>
                  <Input
                    id="confirmPassword"
                    type="password"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    placeholder="••••••••"
                    required
                    minLength={6}
                    className="h-11"
                  />
                </div>

                <Button type="submit" className="w-full h-11" disabled={submitting}>
                  {submitting ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" /> Redefinindo...
                    </>
                  ) : (
                    "Redefinir Senha"
                  )}
                </Button>
              </form>
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

export default ResetPassword;
