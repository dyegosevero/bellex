import { useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";

export type BrandConfig = {
  name: string;
  color: string;
  logo_url: string | null;
  appearance?: {
    color2?: string;
    color3?: string;
    logoSize?: number;
    loginSplit?: number;
  };
};

function hexToHsl(hex: string): { h: number; s: number; l: number } | null {
  const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
  if (!result) return null;
  let r = parseInt(result[1], 16) / 255;
  let g = parseInt(result[2], 16) / 255;
  let b = parseInt(result[3], 16) / 255;
  const max = Math.max(r, g, b), min = Math.min(r, g, b);
  let h = 0, s = 0;
  const l = (max + min) / 2;
  if (max !== min) {
    const d = max - min;
    s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
    switch (max) {
      case r: h = ((g - b) / d + (g < b ? 6 : 0)) / 6; break;
      case g: h = ((b - r) / d + 2) / 6; break;
      case b: h = ((r - g) / d + 4) / 6; break;
    }
  }
  return { h: Math.round(h * 360), s: Math.round(s * 100), l: Math.round(l * 100) };
}

function applyBrandCss(color: string) {
  const hsl = hexToHsl(color);
  if (!hsl) return;
  const { h, s, l } = hsl;
  const darkL = Math.max(l - 12, 0);
  const blushL = Math.min(l + 16, 98);
  const root = document.documentElement;
  root.style.setProperty("--primary", `${h} ${s}% ${l}%`);
  root.style.setProperty("--brand-salmon", `${h} ${s}% ${l}%`);
  root.style.setProperty("--brand-salmon-dark", `${h} ${Math.max(s - 20, 0)}% ${darkL}%`);
  root.style.setProperty("--brand-blush", `${h} ${Math.max(s - 35, 0)}% ${blushL}%`);
  root.style.setProperty("--secondary", `${h} ${Math.max(s - 35, 0)}% ${blushL}%`);
  root.style.setProperty("--accent", `${h} ${Math.max(s - 40, 0)}% ${Math.min(blushL + 4, 99)}%`);
  root.style.setProperty("--ring", `${h} ${s}% ${l}%`);
}

export async function loadBrandForDomain(): Promise<BrandConfig | null> {
  const hostname = window.location.hostname;
  const subdomain = hostname.split(".")[0];

  const { data } = await supabase
    .from("workspace_clinics")
    .select("name, color, logo_url, custom_domain, subdomain, appearance")
    .or(`subdomain.eq.${subdomain},custom_domain.eq.${hostname}`)
    .maybeSingle();

  if (!data) return null;
  return {
    name: data.name,
    color: data.color,
    logo_url: data.logo_url ?? null,
    appearance: (data as Record<string, unknown>).appearance as BrandConfig["appearance"] ?? {},
  };
}

export function useBrand(brand: BrandConfig | null) {
  useEffect(() => {
    if (!brand?.color) return;
    applyBrandCss(brand.color);
    return () => {
      // reset to default on unmount (workspace admin navigation)
      applyBrandCss("#e8957a");
    };
  }, [brand?.color]);
}
