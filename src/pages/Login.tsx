import { useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { Navigate, Link } from "react-router-dom";

import { LogoDraw } from "@/components/ui/logo-draw";
import logoColor from "@/assets/logo-color.png";
import Grainient from "@/components/Grainient";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";

const Login = () => {
  const { user, signIn } = useAuth();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [submitting, setSubmitting] = useState(false);

  // Redirect if already logged in — no loading gate needed
  if (user) return <Navigate to="/resumo" replace />;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    const { error } = await signIn(email, password);
    if (error) {
      toast.error("Credenciais inválidas. Verifique e tente novamente.");
    }
    setSubmitting(false);
  };

  return (
    <div className="min-h-screen flex">
      {/* Left — Branding */}
      <div
        className="hidden lg:flex lg:w-1/2 relative items-center justify-center overflow-hidden"
        style={{ position: "relative" }}
      >
        <div className="absolute inset-0">
          <Grainient
            color1="#f5c5b8"
            color2="#e8957a"
            color3="#f0d5cc"
            timeSpeed={0.25}
            colorBalance={0}
            warpStrength={1}
            warpFrequency={5}
            warpSpeed={2}
            warpAmplitude={50}
            blendAngle={0}
            blendSoftness={0.05}
            rotationAmount={500}
            noiseScale={2}
            grainAmount={0.08}
            grainScale={2}
            grainAnimated={false}
            contrast={1.3}
            gamma={1}
            saturation={0.9}
            centerX={0}
            centerY={0}
            zoom={0.9}
          />
        </div>
        <LogoDraw
          size={110}
          strokeColor="rgba(255,255,255,0.95)"
          fillColor="rgba(255,255,255,1)"
          drawDuration={1600}
          fillDuration={500}
          fillDelay={150}
          className="relative z-10"
        />
      </div>

      {/* Right — Login Form */}
      <div className="flex-1 flex items-center justify-center p-8">
        <div className="w-full max-w-sm space-y-8">
          <div className="lg:hidden flex justify-center mb-8">
            <img src={logoColor} alt="Bellex" className="w-48 invert" />
          </div>

          <div>
            <h1 className="text-2xl font-light tracking-wider text-foreground">ACESSAR</h1>
            <p className="text-sm text-muted-foreground mt-1">Entre com suas credenciais</p>
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

            <div className="space-y-2">
              <Label htmlFor="password" className="text-xs uppercase tracking-wider text-muted-foreground">
                Senha
              </Label>
              <Input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                required
                className="h-11"
              />
            </div>

            <Button type="submit" className="w-full h-11" disabled={submitting}>
              {submitting ? "Entrando..." : "Entrar"}
            </Button>

            <div className="text-right">
              <Link
                to="/esqueci-senha"
                className="text-xs text-muted-foreground hover:text-foreground transition-colors"
              >
                Esqueceu a senha?
              </Link>
            </div>
          </form>

          <p className="text-xs text-center text-muted-foreground">BELLEX SYSTEM · v1.1</p>
        </div>
      </div>
    </div>
  );
};

export default Login;
