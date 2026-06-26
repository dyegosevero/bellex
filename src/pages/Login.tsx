import { useState, useEffect } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { Navigate, Link } from "react-router-dom";

import { LogoDraw } from "@/components/ui/logo-draw";
import logoColor from "@/assets/logo-color.png";
import Grainient from "@/components/Grainient";
import { loadBrandForDomain } from "@/hooks/useBrand";
import { isClinicSubdomain, isCustomDomain } from "@/App";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";

// Subtítulo: letra por letra, stroke → fill
function StrokeFillLetters({ text = "SISTEMA DE GESTÃO INTELIGENTE", delay = 2.2 }: { text?: string; delay?: number }) {
  return (
    <div className="flex flex-wrap justify-center mt-2 gap-0">
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
              fontSize: "11px",
              fontWeight: 400,
              letterSpacing: "0.32em",
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
          from { opacity: 0; filter: blur(8px); transform: scale(1.15); }
          to   { opacity: 1; filter: blur(0px); transform: scale(1); }
        }
        .logo-letter {
          animation: blurLetterIn 0.6s cubic-bezier(0.22,1,0.36,1) forwards;
          opacity: 0;
          transform-box: fill-box;
          transform-origin: center;
        }
      `}</style>
      <svg
        width={110 * 4.14 * 0.8}
        height={110 * 0.8}
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

function ClinicLogoAnimated({ src, size, name }: { src: string; size: number; name: string }) {
  const [svgContent, setSvgContent] = useState<string | null>(null);
  const [phase, setPhase] = useState<"draw" | "fill" | "img">("draw");

  useEffect(() => {
    fetch(src)
      .then(r => {
        const ct = r.headers.get("content-type") ?? "";
        if (!ct.includes("svg") && !src.toLowerCase().includes(".svg")) { setPhase("img"); return null; }
        return r.text();
      })
      .then(text => {
        if (!text) return;
        setSvgContent(text);
        // line-draw runs 1.2s → then switch to fill
        setTimeout(() => setPhase("fill"), 1200);
      })
      .catch(() => setPhase("img"));
  }, [src]);

  if (phase === "img" || (!svgContent && phase !== "draw")) {
    return (
      <img
        src={src} alt={name}
        style={{ width: size, maxWidth: "80%", animation: "blurLogoIn 0.9s cubic-bezier(0.22,1,0.36,1) 0.2s both", opacity: 0 }}
        className="object-contain drop-shadow-lg"
      />
    );
  }

  if (!svgContent) return null;

  return (
    <div
      className={`clinic-svg-wrap${phase === "fill" ? " filled" : ""}`}
      style={{ width: size, maxWidth: "80%" }}
      dangerouslySetInnerHTML={{ __html: svgContent }}
    />
  );
}

const Login = () => {
  const { user, signIn } = useAuth();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [submitting, setSubmitting] = useState(false);
  // Read cached brand synchronously so first render already has clinic colors
  const isClinic = isClinicSubdomain || isCustomDomain;
  const cachedBrand = (() => {
    if (!isClinic) return null;
    try { return JSON.parse(localStorage.getItem("brand_" + location.hostname) ?? "null"); } catch { return null; }
  })();

  const [clinicLogo, setClinicLogo] = useState<string | null>(
    cachedBrand?.logo_url ? `${cachedBrand.logo_url.split("?")[0]}?download=` : null
  );
  const [clinicName, setClinicName] = useState<string | null>(cachedBrand?.name ?? null);
  const [brandColor1, setBrandColor1] = useState<string | null>(cachedBrand?.color ?? null);
  const [brandColor2, setBrandColor2] = useState<string | null>(cachedBrand?.appearance?.color2 ?? null);
  const [brandColor3, setBrandColor3] = useState<string | null>(cachedBrand?.appearance?.color3 ?? null);
  const [logoSize, setLogoSize] = useState<number>(cachedBrand?.appearance?.logoSize ?? 120);
  const [loginSplit, setLoginSplit] = useState<number>(cachedBrand?.appearance?.loginSplit ?? 50);

  useEffect(() => {
    if (!isClinic) return;
    loadBrandForDomain().then(b => {
      if (!b) return;
      if (b.logo_url) setClinicLogo(`${b.logo_url.split("?")[0]}?download=`);
      if (b.name) setClinicName(b.name);
      setBrandColor1(b.color);
      if (b.appearance?.color2) setBrandColor2(b.appearance.color2);
      if (b.appearance?.color3) setBrandColor3(b.appearance.color3);
      if (b.appearance?.logoSize) setLogoSize(b.appearance.logoSize);
      if (b.appearance?.loginSplit) setLoginSplit(b.appearance.loginSplit);
    });
  }, []);

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
      <div
        className="hidden lg:flex relative items-center justify-center"
        style={{ width: `${loginSplit}%`, overflow: "hidden", flexShrink: 0 }}
      >
        <div className="absolute inset-0">
          {/* For clinic domains: NEVER show Bellex gradient — show neutral black until brand loads */}
          {isClinic
            ? brandColor1
              ? <>
                  <div className="absolute inset-0" style={{
                    background: `linear-gradient(135deg, ${brandColor1} 0%, ${brandColor2 ?? brandColor1} 50%, ${brandColor3 ?? brandColor1} 100%)`
                  }} />
                  <div className="absolute inset-0 opacity-[0.12]"
                    style={{ backgroundImage: "url(\"data:image/svg+xml,%3Csvg viewBox='0 0 512 512' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.75' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)'/%3E%3C/svg%3E\")", backgroundSize: "256px" }} />
                </>
              : <div className="absolute inset-0 bg-neutral-900" />
            : <Grainient
                color1="#f5c5b8" color2="#e8957a" color3="#f0d5cc"
                timeSpeed={0.25} colorBalance={0} warpStrength={1} warpFrequency={5}
                warpSpeed={2} warpAmplitude={50} blendAngle={0} blendSoftness={0.05}
                rotationAmount={500} noiseScale={2} grainAmount={0.08} grainScale={2}
                grainAnimated={false} contrast={1.3} gamma={1} saturation={0.9}
                centerX={0} centerY={0} zoom={0.9}
              />
          }
        </div>

        <div className="relative flex flex-col items-center" style={{ zIndex: 2, overflow: "visible" }}>
          <style>{`
            @keyframes svgLineDraw {
              from { stroke-dashoffset: var(--path-len); opacity: 1; }
              to   { stroke-dashoffset: 0; opacity: 1; }
            }
            @keyframes svgFillIn {
              from { fill-opacity: 0; filter: blur(4px); transform: scale(1.05); }
              to   { fill-opacity: 1; filter: blur(0px); transform: scale(1); }
            }
            @keyframes blurLogoIn {
              from { opacity: 0; filter: blur(12px); transform: scale(1.1); }
              to   { opacity: 1; filter: blur(0px);  transform: scale(1); }
            }
            .clinic-svg-wrap svg path,
            .clinic-svg-wrap svg rect,
            .clinic-svg-wrap svg circle,
            .clinic-svg-wrap svg ellipse,
            .clinic-svg-wrap svg polygon,
            .clinic-svg-wrap svg polyline {
              fill: transparent;
              stroke: white;
              stroke-width: 1.5px;
              stroke-dasharray: var(--path-len, 2000);
              stroke-dashoffset: var(--path-len, 2000);
              animation: svgLineDraw 1.1s cubic-bezier(0.4,0,0.2,1) 0.1s forwards;
            }
            .clinic-svg-wrap.filled svg path,
            .clinic-svg-wrap.filled svg rect,
            .clinic-svg-wrap.filled svg circle,
            .clinic-svg-wrap.filled svg ellipse,
            .clinic-svg-wrap.filled svg polygon,
            .clinic-svg-wrap.filled svg polyline {
              stroke: none;
              stroke-dasharray: none;
              stroke-dashoffset: 0;
              fill: revert;
              fill-opacity: 0;
              animation: svgFillIn 0.5s cubic-bezier(0.22,1,0.36,1) forwards;
            }
          `}</style>
          <div style={{ overflow: "visible", padding: "20px 40px" }}>
            {clinicLogo
              ? <ClinicLogoAnimated src={clinicLogo} size={logoSize} name={clinicName ?? "Logo"} />
              : <LogoBlur delay={0.3} />
            }
          </div>
          {clinicName
            ? <p className="text-white/70 text-sm tracking-widest uppercase mt-2"
                style={{ animation: "blurLogoIn 0.7s cubic-bezier(0.22,1,0.36,1) 0.8s both", opacity: 0 }}>
                {clinicName}
              </p>
            : <StrokeFillLetters delay={1.0} />
          }
        </div>
      </div>

      {/* Right — Login Form */}
      <div className="flex-1 flex items-center justify-center p-8">
        <div className="w-full max-w-sm space-y-8">
          <div className="lg:hidden flex justify-center mb-8">
            {clinicLogo
              ? <img src={clinicLogo} alt={clinicName ?? "Logo"} className="h-12 object-contain" />
              : <img src={logoColor} alt="Bellex" className="w-48 invert" />
            }
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

          {!isClinic && <p className="text-xs text-center text-muted-foreground">BELLEX SYSTEM · v1.1</p>}
        </div>
      </div>
    </div>
  );
};

export default Login;
