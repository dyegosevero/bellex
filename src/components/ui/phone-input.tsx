import { useState, useRef, useEffect, useMemo } from "react";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import { ChevronDown, Search } from "lucide-react";

interface Country {
  code: string;
  name: string;
  dial: string;
  flag: string;
}

const COUNTRIES: Country[] = [
  { code: "BR", name: "Brasil", dial: "+55", flag: "🇧🇷" },
  { code: "PT", name: "Portugal", dial: "+351", flag: "🇵🇹" },
  { code: "US", name: "United States", dial: "+1", flag: "🇺🇸" },
  { code: "ES", name: "España", dial: "+34", flag: "🇪🇸" },
  { code: "FR", name: "France", dial: "+33", flag: "🇫🇷" },
  { code: "GB", name: "United Kingdom", dial: "+44", flag: "🇬🇧" },
  { code: "DE", name: "Deutschland", dial: "+49", flag: "🇩🇪" },
  { code: "IT", name: "Italia", dial: "+39", flag: "🇮🇹" },
  { code: "NL", name: "Nederland", dial: "+31", flag: "🇳🇱" },
  { code: "BE", name: "Belgique", dial: "+32", flag: "🇧🇪" },
  { code: "CH", name: "Schweiz", dial: "+41", flag: "🇨🇭" },
  { code: "AT", name: "Österreich", dial: "+43", flag: "🇦🇹" },
  { code: "LU", name: "Luxembourg", dial: "+352", flag: "🇱🇺" },
  { code: "IE", name: "Ireland", dial: "+353", flag: "🇮🇪" },
  { code: "AO", name: "Angola", dial: "+244", flag: "🇦🇴" },
  { code: "MZ", name: "Moçambique", dial: "+258", flag: "🇲🇿" },
  { code: "CV", name: "Cabo Verde", dial: "+238", flag: "🇨🇻" },
  { code: "GW", name: "Guiné-Bissau", dial: "+245", flag: "🇬🇼" },
  { code: "ST", name: "São Tomé e Príncipe", dial: "+239", flag: "🇸🇹" },
  { code: "TL", name: "Timor-Leste", dial: "+670", flag: "🇹🇱" },
  { code: "AR", name: "Argentina", dial: "+54", flag: "🇦🇷" },
  { code: "CL", name: "Chile", dial: "+56", flag: "🇨🇱" },
  { code: "CO", name: "Colombia", dial: "+57", flag: "🇨🇴" },
  { code: "MX", name: "México", dial: "+52", flag: "🇲🇽" },
  { code: "PE", name: "Perú", dial: "+51", flag: "🇵🇪" },
  { code: "UY", name: "Uruguay", dial: "+598", flag: "🇺🇾" },
  { code: "VE", name: "Venezuela", dial: "+58", flag: "🇻🇪" },
  { code: "PY", name: "Paraguay", dial: "+595", flag: "🇵🇾" },
  { code: "EC", name: "Ecuador", dial: "+593", flag: "🇪🇨" },
  { code: "BO", name: "Bolivia", dial: "+591", flag: "🇧🇴" },
  { code: "CA", name: "Canada", dial: "+1", flag: "🇨🇦" },
  { code: "JP", name: "日本", dial: "+81", flag: "🇯🇵" },
  { code: "CN", name: "中国", dial: "+86", flag: "🇨🇳" },
  { code: "IN", name: "India", dial: "+91", flag: "🇮🇳" },
  { code: "AU", name: "Australia", dial: "+61", flag: "🇦🇺" },
  { code: "ZA", name: "South Africa", dial: "+27", flag: "🇿🇦" },
  { code: "MA", name: "المغرب", dial: "+212", flag: "🇲🇦" },
  { code: "EG", name: "مصر", dial: "+20", flag: "🇪🇬" },
  { code: "SE", name: "Sverige", dial: "+46", flag: "🇸🇪" },
  { code: "NO", name: "Norge", dial: "+47", flag: "🇳🇴" },
  { code: "DK", name: "Danmark", dial: "+45", flag: "🇩🇰" },
  { code: "FI", name: "Suomi", dial: "+358", flag: "🇫🇮" },
  { code: "PL", name: "Polska", dial: "+48", flag: "🇵🇱" },
  { code: "CZ", name: "Česko", dial: "+420", flag: "🇨🇿" },
  { code: "RO", name: "România", dial: "+40", flag: "🇷🇴" },
  { code: "GR", name: "Ελλάδα", dial: "+30", flag: "🇬🇷" },
  { code: "TR", name: "Türkiye", dial: "+90", flag: "🇹🇷" },
  { code: "RU", name: "Россия", dial: "+7", flag: "🇷🇺" },
  { code: "UA", name: "Україна", dial: "+380", flag: "🇺🇦" },
];

// Prioritized countries at top of list
const PRIORITY_CODES = ["PT", "BR", "US"];

// Mask patterns per country code
const MASKS: Record<string, string> = {
  PT: "### ### ###",
  BR: "(##) #####-####",
  US: "(###) ###-####",
  CA: "(###) ###-####",
  ES: "### ## ## ##",
  FR: "## ## ## ## ##",
  GB: "#### ### ####",
  DE: "#### #######",
  IT: "### ### ####",
  MX: "(##) #### ####",
  AR: "(##) ####-####",
};
const DEFAULT_MASK = "### ### ### ###";

function applyMask(value: string, mask: string): string {
  const digits = value.replace(/\D/g, "");
  let result = "";
  let di = 0;
  for (let i = 0; i < mask.length && di < digits.length; i++) {
    if (mask[i] === "#") {
      result += digits[di];
      di++;
    } else {
      result += mask[i];
    }
  }
  return result;
}

function stripMask(value: string): string {
  return value.replace(/\D/g, "");
}

function detectCountryFromValue(value: string): Country | undefined {
  if (!value) return undefined;
  const clean = value.replace(/\s/g, "").replace(/[()-]/g, "");
  if (!clean.startsWith("+")) return undefined;
  const sorted = [...COUNTRIES].sort((a, b) => b.dial.length - a.dial.length);
  return sorted.find((c) => clean.startsWith(c.dial));
}

function getNumberWithoutDial(value: string, dial: string): string {
  const clean = value.replace(/\s/g, "").replace(/[()-]/g, "");
  if (clean.startsWith(dial)) {
    return clean.slice(dial.length);
  }
  return value.replace(/[^0-9]/g, "");
}

// Maps IANA timezone prefix → ISO country code
export function timezoneToCountry(tz: string): string {
  if (!tz) return "PT";
  if (tz.startsWith("America/Sao_Paulo") || tz.startsWith("America/Manaus") || tz.startsWith("America/Belem") || tz.startsWith("America/Fortaleza") || tz.startsWith("America/Recife") || tz.startsWith("America/Bahia") || tz.startsWith("America/Maceio") || tz.startsWith("America/Noronha")) return "BR";
  if (tz.startsWith("America/Argentina")) return "AR";
  if (tz.startsWith("America/Mexico")) return "MX";
  if (tz.startsWith("America/Bogota")) return "CO";
  if (tz.startsWith("America/Lima")) return "PE";
  if (tz.startsWith("America/Santiago")) return "CL";
  if (tz.startsWith("America/New_York") || tz.startsWith("America/Los_Angeles") || tz.startsWith("America/Chicago") || tz.startsWith("America/Denver")) return "US";
  if (tz.startsWith("America/Toronto") || tz.startsWith("America/Vancouver")) return "CA";
  if (tz.startsWith("Europe/Lisbon") || tz.startsWith("Atlantic/Azores")) return "PT";
  if (tz.startsWith("Europe/London")) return "GB";
  if (tz.startsWith("Europe/Madrid")) return "ES";
  if (tz.startsWith("Europe/Paris")) return "FR";
  if (tz.startsWith("Europe/Berlin") || tz.startsWith("Europe/Frankfurt")) return "DE";
  if (tz.startsWith("Europe/Rome")) return "IT";
  if (tz.startsWith("Europe/Amsterdam")) return "NL";
  if (tz.startsWith("Europe/Brussels")) return "BE";
  if (tz.startsWith("Europe/Zurich")) return "CH";
  if (tz.startsWith("Europe/Vienna")) return "AT";
  if (tz.startsWith("Europe/Dublin")) return "IE";
  if (tz.startsWith("Europe/Bucharest")) return "RO";
  if (tz.startsWith("Europe/Athens")) return "GR";
  if (tz.startsWith("Europe/Warsaw")) return "PL";
  if (tz.startsWith("Europe/Prague")) return "CZ";
  if (tz.startsWith("Europe/Stockholm")) return "SE";
  if (tz.startsWith("Europe/Copenhagen")) return "DK";
  if (tz.startsWith("Europe/Oslo")) return "NO";
  if (tz.startsWith("Europe/Helsinki")) return "FI";
  if (tz.startsWith("Europe/Kiev") || tz.startsWith("Europe/Kyiv")) return "UA";
  if (tz.startsWith("Europe/Istanbul")) return "TR";
  if (tz.startsWith("Asia/Tokyo")) return "JP";
  if (tz.startsWith("Asia/Shanghai") || tz.startsWith("Asia/Hong_Kong")) return "CN";
  if (tz.startsWith("Asia/Kolkata")) return "IN";
  if (tz.startsWith("Australia/")) return "AU";
  if (tz.startsWith("Africa/Luanda")) return "AO";
  if (tz.startsWith("Africa/Maputo")) return "MZ";
  if (tz.startsWith("Africa/Casablanca")) return "MA";
  if (tz.startsWith("Africa/Cairo")) return "EG";
  if (tz.startsWith("Africa/Johannesburg")) return "ZA";
  return "PT"; // default
}

interface PhoneInputProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  id?: string;
  className?: string;
  disabled?: boolean;
  defaultCountry?: string; // ISO code, e.g. "BR", "PT"
}

export function PhoneInput({ value, onChange, placeholder, id, className, disabled, defaultCountry }: PhoneInputProps) {
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState("");
  const dropdownRef = useRef<HTMLDivElement>(null);
  const triggerRef = useRef<HTMLButtonElement>(null);

  const detectedCountry = useMemo(() => detectCountryFromValue(value), [value]);
  const fallback = useMemo(
    () => (defaultCountry ? COUNTRIES.find((c) => c.code === defaultCountry) : undefined) ?? COUNTRIES[0],
    [defaultCountry]
  );
  const selectedCountry = detectedCountry || fallback;

  const mask = MASKS[selectedCountry.code] || DEFAULT_MASK;

  const localNumber = useMemo(() => {
    if (!value) return "";
    if (detectedCountry) {
      const raw = getNumberWithoutDial(value, detectedCountry.dial);
      return applyMask(raw, MASKS[detectedCountry.code] || DEFAULT_MASK);
    }
    if (!value.startsWith("+")) return applyMask(value.replace(/\D/g, ""), mask);
    return value;
  }, [value, detectedCountry, mask]);

  useEffect(() => {
    if (!open) return;
    const handler = (e: MouseEvent) => {
      if (
        dropdownRef.current && !dropdownRef.current.contains(e.target as Node) &&
        triggerRef.current && !triggerRef.current.contains(e.target as Node)
      ) {
        setOpen(false);
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [open]);

  const handleCountrySelect = (country: Country) => {
    const raw = stripMask(localNumber);
    onChange(`${country.dial}${raw}`);
    setOpen(false);
    setSearch("");
  };

  const handleNumberChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const input = e.target.value;
    if (input.startsWith("+")) {
      onChange(input);
    } else {
      const digits = stripMask(input);
      // Limit to mask length
      const maxDigits = (mask.match(/#/g) || []).length;
      const limited = digits.slice(0, maxDigits);
      onChange(`${selectedCountry.dial}${limited}`);
    }
  };

  const filteredCountries = useMemo(() => {
    const q = search.toLowerCase();
    const filtered = q
      ? COUNTRIES.filter(
          (c) =>
            c.name.toLowerCase().includes(q) ||
            c.dial.includes(q) ||
            c.code.toLowerCase().includes(q)
        )
      : COUNTRIES;

    // Sort: priority countries first, then alphabetical
    if (!q) {
      const priority = filtered.filter((c) => PRIORITY_CODES.includes(c.code));
      const rest = filtered.filter((c) => !PRIORITY_CODES.includes(c.code));
      return [...priority, ...rest];
    }
    return filtered;
  }, [search]);

  return (
    <div className={cn("relative", className)}>
      <div className="flex">
        {/* Country selector */}
        <button
          ref={triggerRef}
          type="button"
          disabled={disabled}
          onClick={() => setOpen(!open)}
          className={cn(
            "flex items-center gap-1 px-2.5 border border-r-0 border-input rounded-l-md bg-muted/50 hover:bg-muted transition-colors text-sm shrink-0",
            "focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-1",
            disabled && "opacity-50 cursor-not-allowed"
          )}
        >
          <span className="text-base leading-none">{selectedCountry.flag}</span>
          <ChevronDown className="w-3 h-3 text-muted-foreground" />
          <span className="text-xs text-muted-foreground font-medium">{selectedCountry.dial}</span>
        </button>

        {/* Number input */}
        <Input
          id={id}
          disabled={disabled}
          value={localNumber}
          onChange={handleNumberChange}
          placeholder={placeholder || mask.replace(/#/g, "0")}
          className="rounded-l-none border-l-0"
        />
      </div>

      {/* Country dropdown */}
      {open && (
        <div
          ref={dropdownRef}
          className="absolute top-full left-0 mt-1 w-72 bg-popover border border-border rounded-lg shadow-lg z-50 overflow-hidden"
        >
          {/* Search */}
          <div className="p-2 border-b border-border">
            <div className="relative">
              <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted-foreground" />
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Pesquisar país..."
                className="w-full pl-8 pr-3 py-1.5 text-sm bg-transparent border border-input rounded-md focus:outline-none focus:ring-2 focus:ring-ring"
                autoFocus
              />
            </div>
          </div>

          {/* Country list */}
          <div className="max-h-52 overflow-y-auto">
            {filteredCountries.map((country, idx) => {
              // Add separator after priority countries
              const showSeparator = !search && idx === PRIORITY_CODES.length - 1;
              return (
                <div key={`${country.code}-${idx}`}>
                  <button
                    type="button"
                    onClick={() => handleCountrySelect(country)}
                    className={cn(
                      "flex items-center gap-2.5 w-full px-3 py-2 text-sm hover:bg-accent transition-colors text-left",
                      selectedCountry.code === country.code && "bg-accent"
                    )}
                  >
                    <span className="text-base leading-none">{country.flag}</span>
                    <span className="flex-1 truncate">{country.name}</span>
                    <span className="text-xs text-muted-foreground font-mono">{country.dial}</span>
                  </button>
                  {showSeparator && <div className="border-b border-border" />}
                </div>
              );
            })}
            {filteredCountries.length === 0 && (
              <p className="text-sm text-muted-foreground text-center py-3">Nenhum país encontrado</p>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
