/**
 * Bellex — Design System / Brand Tokens
 *
 * Centralize aqui os valores de identidade visual reutilizáveis em todo o produto.
 * Importe onde precisar de um fundo grain, gradiente, ou cor de marca.
 */

// ─── Grain Background (Marca Bellex) ─────────────────────────────────────────
//
// O "grain salmão" padrão da marca — o mesmo visual da seção CTA da LP.
// Use o componente <BrandGrain /> ou passe BRAND_GRAIN_PROPS diretamente
// para o componente <Grainient />.
//
// Visual: gradiente salmão quente com textura grain estática, sem animação.

export const BRAND_GRAIN_PROPS = {
  color1: "#f5c5b8",
  color2: "#e8957a",
  color3: "#f0d5cc",
  timeSpeed: 0.2,
  colorBalance: 0,
  warpStrength: 0.8,
  warpFrequency: 4,
  warpSpeed: 1.5,
  warpAmplitude: 40,
  blendAngle: 0,
  blendSoftness: 0.05,
  rotationAmount: 400,
  noiseScale: 2,
  grainAmount: 0.06,
  grainScale: 2,
  grainAnimated: false as const,
  contrast: 1.2,
  gamma: 1,
  saturation: 0.85,
  centerX: 0,
  centerY: 0,
  zoom: 0.9,
} as const;

// ─── Cores de marca ───────────────────────────────────────────────────────────

export const BRAND_COLORS = {
  salmon:      "hsl(10 68% 72%)",   // --primary no tema
  salmonLight: "#f5c5b8",
  salmonMid:   "#e8957a",
  salmonWarm:  "#f0d5cc",
} as const;
