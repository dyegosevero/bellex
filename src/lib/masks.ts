export function maskPhone(v: string): string {
  const d = v.replace(/\D/g, "").slice(0, 11);
  if (d.length <= 10) {
    return d
      .replace(/^(\d{2})(\d)/, "($1) $2")
      .replace(/(\d{4})(\d)/, "$1-$2");
  }
  return d
    .replace(/^(\d{2})(\d)/, "($1) $2")
    .replace(/(\d{5})(\d)/, "$1-$2");
}

export function maskCPF(v: string): string {
  return v
    .replace(/\D/g, "")
    .slice(0, 11)
    .replace(/(\d{3})(\d)/, "$1.$2")
    .replace(/(\d{3})(\d)/, "$1.$2")
    .replace(/(\d{3})(\d{1,2})$/, "$1-$2");
}

export function maskCNPJ(v: string): string {
  return v
    .replace(/\D/g, "")
    .slice(0, 14)
    .replace(/^(\d{2})(\d)/, "$1.$2")
    .replace(/^(\d{2})\.(\d{3})(\d)/, "$1.$2.$3")
    .replace(/\.(\d{3})(\d)/, ".$1/$2")
    .replace(/(\d{4})(\d)/, "$1-$2");
}

export function maskCPFCNPJ(v: string): string {
  const d = v.replace(/\D/g, "");
  return d.length <= 11 ? maskCPF(v) : maskCNPJ(v);
}

export function maskCEP(v: string): string {
  return v
    .replace(/\D/g, "")
    .slice(0, 8)
    .replace(/(\d{5})(\d)/, "$1-$2");
}

export function validatePhone(v: string): boolean {
  return v.replace(/\D/g, "").length >= 10;
}

export function validateCPF(v: string): boolean {
  const d = v.replace(/\D/g, "");
  if (d.length !== 11 || /^(\d)\1+$/.test(d)) return false;
  let sum = 0;
  for (let i = 0; i < 9; i++) sum += parseInt(d[i]) * (10 - i);
  let r = (sum * 10) % 11;
  if (r === 10 || r === 11) r = 0;
  if (r !== parseInt(d[9])) return false;
  sum = 0;
  for (let i = 0; i < 10; i++) sum += parseInt(d[i]) * (11 - i);
  r = (sum * 10) % 11;
  if (r === 10 || r === 11) r = 0;
  return r === parseInt(d[10]);
}

export function validateCNPJ(v: string): boolean {
  const d = v.replace(/\D/g, "");
  if (d.length !== 14 || /^(\d)\1+$/.test(d)) return false;
  const calc = (s: string, w: number[]) =>
    w.reduce((a, x, i) => a + parseInt(s[i]) * x, 0);
  const r1 = calc(d, [5,4,3,2,9,8,7,6,5,4,3,2]) % 11;
  if ((r1 < 2 ? 0 : 11 - r1) !== parseInt(d[12])) return false;
  const r2 = calc(d, [6,5,4,3,2,9,8,7,6,5,4,3,2]) % 11;
  return (r2 < 2 ? 0 : 11 - r2) === parseInt(d[13]);
}

export function validateCPFCNPJ(v: string): boolean {
  const d = v.replace(/\D/g, "");
  if (!d) return true; // opcional
  return d.length <= 11 ? validateCPF(v) : validateCNPJ(v);
}

export function validateCEP(v: string): boolean {
  return v.replace(/\D/g, "").length === 8;
}
