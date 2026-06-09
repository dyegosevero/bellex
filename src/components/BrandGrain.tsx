/**
 * BrandGrain
 *
 * Fundo padrão de grain salmão da Bellex.
 * Uso:
 *
 *   <div className="relative overflow-hidden">
 *     <BrandGrain />
 *     <div className="relative z-10">conteúdo</div>
 *   </div>
 *
 * O componente ocupa 100% do container pai (position absolute, inset-0).
 * Certifique-se que o pai tem `position: relative` e `overflow: hidden`.
 */

import Grainient from "@/components/Grainient";
import { BRAND_GRAIN_PROPS } from "@/lib/brand";
import { cn } from "@/lib/utils";

interface BrandGrainProps {
  /** Sobreposição escura no fundo (útil para legibilidade de texto branco) */
  overlay?: boolean;
  /** Classe extra para o wrapper */
  className?: string;
}

export function BrandGrain({ overlay = false, className }: BrandGrainProps) {
  return (
    <>
      <div className={cn("absolute inset-0", className)}>
        <Grainient {...BRAND_GRAIN_PROPS} className="w-full h-full" />
      </div>
      {overlay && (
        <div className="absolute inset-0 bg-gradient-to-b from-black/10 to-black/30 pointer-events-none" />
      )}
    </>
  );
}
