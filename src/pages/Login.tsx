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

// Subtítulo: letra por letra, stroke → fill
function StrokeFillLetters({ text = "SISTEMA DE GESTÃO INTELIGENTE", delay = 2.2 }: { text?: string; delay?: number }) {
  return (
    <div className="flex flex-wrap justify-center mt-4 gap-0">
      <style>{`
        @keyframes strokeFill {
          0%   { opacity: 0; -webkit-text-stroke: 1px rgba(255,255,255,0.9); color: transparent; }
          25%  { opacity: 1; -webkit-text-stroke: 1px rgba(255,255,255,0.9); color: transparent; }
          70%  { opacity: 1; -webkit-text-stroke: 1px rgba(255,255,255,0.5); color: rgba(255,255,255,0.6); }
          100% { opacity: 1; -webkit-text-stroke: 0px transparent; color: rgba(255,255,255,1); }
        }
      `}</style>
      {text.split("").map((char, i) =>
        char === " " ? (
          <span key={i} style={{ display: "inline-block", width: "0.45em" }} />
        ) : (
          <span
            key={i}
            style={{
              display: "inline-block",
              fontSize: "10px",
              fontWeight: 300,
              letterSpacing: "0.28em",
              opacity: 0,
              animation: `strokeFill 0.75s ease forwards`,
              animationDelay: `${delay + i * 0.05}s`,
            }}
          >
            {char}
          </span>
        )
      )}
    </div>
  );
}

// Logo: letras surgindo uma a uma com blur + scale + opacity
function LogoBlur({ delay = 0.3 }: { delay?: number }) {
  return (
    <div style={{ opacity: 1 }}>
      <style>{`
        @keyframes blurLetterIn {
          from { opacity: 0; filter: blur(12px); transform: scale(1.6); }
          to   { opacity: 1; filter: blur(0px);  transform: scale(1); }
        }
        .logo-letter {
          animation: blurLetterIn 0.6s cubic-bezier(0.22,1,0.36,1) forwards;
          opacity: 0;
          transform-box: fill-box;
          transform-origin: center;
        }
      `}</style>
      <svg
        width={110 * 4.14}
        height={110}
        viewBox="0 0 1876.58 453.51"
        fill="rgba(255,255,255,1)"
        xmlns="http://www.w3.org/2000/svg"
      >
        {/* B */}
        <g className="logo-letter" style={{ animationDelay: `${delay + 0 * 0.13}s` }}>
          <path d="M83.4,0l.03,157.18c87.42-62.67,247.01-61.83,306.43,38.38,33.98,57.3,29.7,143.63-12.9,195.83-64.43,78.93-216.03,79.59-293.52,19.21l-.02,35.3-83.42-.02V0h83.4ZM178.93,164.5c-135.71,16.31-133.98,228.59,8.61,239.81,73.36,5.77,133.84-25.53,139.77-104.26,7.45-98.87-52.36-147.09-148.38-135.55Z" />
        </g>
        {/* E (first) */}
        <g className="logo-letter" style={{ animationDelay: `${delay + 1 * 0.13}s` }}>
          <path d="M827.62,298.33h-320.78c5.52,31.94,13.88,59.28,40.17,80.12,44.19,35.01,134.17,36.48,174.87-4.62,4.6-4.64,17.88-27.38,20.74-27.38h75.38c-26.96,102.87-169.13,120.5-257.29,98.5-187.73-46.85-183.09-287.8,10.17-324.76,62.24-11.9,143.08-7.2,194.12,33.86,45.77,36.83,58.39,87.49,62.62,144.28ZM737.8,256.63c5.47-130.02-227.88-120.48-227.76,0h227.76Z" />
        </g>
        {/* L (first) */}
        <g className="logo-letter" style={{ animationDelay: `${delay + 2 * 0.13}s` }}>
          <rect x={850.08} y={0} width={83.4} height={445.89} />
        </g>
        {/* L (second) */}
        <g className="logo-letter" style={{ animationDelay: `${delay + 3 * 0.13}s` }}>
          <rect x={965.56} y={0} width={83.4} height={445.89} />
        </g>
        {/* E (second) */}
        <g className="logo-letter" style={{ animationDelay: `${delay + 4 * 0.13}s` }}>
          <path d="M1475.6,298.33h-320.78c5.52,31.94,13.88,59.28,40.17,80.12,44.19,35.01,134.17,36.48,174.87-4.62,4.6-4.64,17.88-27.38,20.74-27.38h75.38c-26.96,102.87-169.13,120.5-257.29,98.5-187.73-46.85-183.09-287.8,10.17-324.76,62.24-11.9,143.08-7.2,194.12,33.86,45.77,36.83,58.39,87.49,62.62,144.28ZM1385.78,256.63c5.47-130.02-227.88-120.48-227.76,0h227.76Z" />
        </g>
        {/* X */}
        <g className="logo-letter" style={{ animationDelay: `${delay + 5 * 0.13}s` }}>
          <path d="M1854.13,121.9l-144.12,151.93,166.58,172.06h-97.84c-32.86-40.6-71.59-76.29-106.02-115.38-2.45-2.79-4.72-5.8-4.71-9.72-19.65,10.16-114.65,125.11-123.44,125.11h-88.22l163.37-172.06-147.33-151.93h97.84c11.48,12.29,91.55,103.66,99,102.41,13.87-9.52,83.44-102.41,90.27-102.41h94.63Z" />
        </g>
      </svg>
    </div>
  );
}

const Login = () => {
  const { user, signIn } = useAuth();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [submitting, setSubmitting] = useState(false);

  if (user) return <Navigate to="/dashboard" replace />;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    const { error } = await signIn(email, password);
    if (error) toast.error("Credenciais inválidas. Verifique e tente novamente.");
    setSubmitting(false);
  };

  return (
    <div className="min-h-screen flex">
      {/* Left — Branding */}
      <div className="hidden lg:flex lg:w-1/2 relative items-center justify-center" style={{ overflow: "clip" }}>

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

        <div className="relative flex flex-col items-center" style={{ zIndex: 2, overflow: "visible" }}>
          <div style={{ overflow: "visible", padding: "20px 40px" }}>
            <LogoBlur delay={0.3} />
          </div>
          <StrokeFillLetters delay={2.2} />
        </div>
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
