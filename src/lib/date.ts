export const DATE_LOCALE = "pt-BR";

/** Mutable timezone — initialised from clinic_settings at app startup */
let _tz = "America/Sao_Paulo";

export function setTimezone(tz: string) {
  _tz = tz;
}

export function getTimezone() {
  return _tz;
}

/** Returns true when the clinic timezone is in Europe (Portugal) */
export function isPortugal(): boolean {
  return _tz.startsWith("Europe/");
}

/** "NIF" (PT) or "CPF" (BR) */
export function getDocLabel(): string {
  return isPortugal() ? "NIF" : "CPF";
}

/** Placeholder for the document field */
export function getDocPlaceholder(): string {
  return isPortugal() ? "000 000 000" : "000.000.000-00";
}

/** Currency code */
export function getCurrencyCode(): string {
  return isPortugal() ? "EUR" : "BRL";
}

/** Currency symbol */
export function getCurrencySymbol(): string {
  return isPortugal() ? "€" : "R$";
}

/** VAT rate — 23% in PT, 0 in BR (not shown) */
export function getVATRate(): number {
  return isPortugal() ? 0.23 : 0;
}

/** VAT label — "IVA" in PT, null in BR */
export function getVATLabel(): string | null {
  return isPortugal() ? "IVA" : null;
}

/** Payment methods list for the current locale */
export function getPaymentMethods(): Array<{ value: string; label: string }> {
  if (isPortugal()) {
    return [
      { value: "dinheiro", label: "Dinheiro" },
      { value: "mbway", label: "MB Way" },
      { value: "multibanco", label: "Multibanco" },
      { value: "cartao_credito", label: "Cartão de Crédito" },
      { value: "cartao_debito", label: "Cartão de Débito" },
      { value: "transferencia", label: "Transferência" },
    ];
  }
  return [
    { value: "dinheiro", label: "Dinheiro" },
    { value: "pix", label: "Pix" },
    { value: "cartao_credito", label: "Cartão de Crédito" },
    { value: "cartao_debito", label: "Cartão de Débito" },
    { value: "transferencia", label: "Transferência" },
  ];
}

export const fmtCurrency = (v: number) =>
  v.toLocaleString(DATE_LOCALE, { style: "currency", currency: getCurrencyCode() });

export const fmtDate = (date: string | Date) =>
  new Date(date).toLocaleDateString(DATE_LOCALE, { timeZone: _tz });

export const fmtDateTime = (date: string | Date) =>
  new Date(date).toLocaleDateString(DATE_LOCALE, {
    timeZone: _tz,
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });

export const fmtDateShort = (date: string | Date) =>
  new Date(date).toLocaleDateString(DATE_LOCALE, {
    timeZone: _tz,
    day: "2-digit",
    month: "short",
    hour: "2-digit",
    minute: "2-digit",
  });

export const fmtTime = (date: string | Date) =>
  new Date(date).toLocaleTimeString(DATE_LOCALE, {
    timeZone: _tz,
    hour: "2-digit",
    minute: "2-digit",
  });

export const fmtDateLong = (date: string | Date) =>
  new Date(date).toLocaleDateString(DATE_LOCALE, {
    timeZone: _tz,
    day: "2-digit",
    month: "long",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });

export const fmtDateOnly = (date: string | Date) =>
  new Date(date).toLocaleDateString(DATE_LOCALE, {
    timeZone: _tz,
    day: "2-digit",
    month: "long",
    year: "numeric",
  });

function getDatePartsInTimezone(date: string | Date, tz: string = _tz) {
  const parts = new Intl.DateTimeFormat("en-CA", {
    timeZone: tz,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).formatToParts(new Date(date));

  const get = (type: string) => parts.find((part) => part.type === type)?.value ?? "";

  return {
    year: get("year"),
    month: get("month"),
    day: get("day"),
  };
}

export function getDateTimePartsInTimezone(date: string | Date, tz: string = _tz) {
  const parts = new Intl.DateTimeFormat("en-CA", {
    timeZone: tz,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    hour12: false,
    hourCycle: "h23",
  }).formatToParts(new Date(date));

  const get = (type: string) => parts.find((part) => part.type === type)?.value ?? "00";

  return {
    year: get("year"),
    month: get("month"),
    day: get("day"),
    hour: get("hour"),
    minute: get("minute"),
    second: get("second"),
  };
}

function formatLocalDateKey(date: Date) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

export function getDateKeyInTimezone(date: string | Date, tz: string = _tz): string {
  const { year, month, day } = getDatePartsInTimezone(date, tz);
  return `${year}-${month}-${day}`;
}

export function getDayOfMonthInTimezone(date: string | Date, tz: string = _tz): number {
  return Number(getDatePartsInTimezone(date, tz).day);
}

export function toTimezoneOffsetDateTime(date: string | Date, tz: string = _tz): string {
  const { year, month, day, hour, minute, second } = getDateTimePartsInTimezone(date, tz);
  return withTimezoneOffset(`${year}-${month}-${day}T${hour}:${minute}:${second}`, tz);
}

export function toCalendarDate(dateKey: string): Date {
  const [year, month, day] = dateKey.split("-").map(Number);
  return new Date(year, month - 1, day, 12, 0, 0);
}

export function getMonthRangeInTimezone(monthDate: Date, tz: string = _tz) {
  const year = monthDate.getFullYear();
  const month = monthDate.getMonth() + 1;
  const monthStr = String(month).padStart(2, "0");
  const lastDay = String(new Date(year, month, 0).getDate()).padStart(2, "0");

  return {
    start: withTimezoneOffset(`${year}-${monthStr}-01T00:00:00`, tz),
    end: withTimezoneOffset(`${year}-${monthStr}-${lastDay}T23:59:59`, tz),
  };
}

export function getDayRangeInTimezone(date: Date, tz: string = _tz) {
  const dateKey = formatLocalDateKey(date);

  return {
    start: withTimezoneOffset(`${dateKey}T00:00:00`, tz),
    end: withTimezoneOffset(`${dateKey}T23:59:59`, tz),
  };
}

/**
 * Compute the UTC offset string (e.g. "+01:00") for a given date
 * in the clinic timezone. This is critical for storing timezone-aware
 * datetimes so PostgreSQL converts them to UTC correctly.
 */
export function getTimezoneOffset(dateStr: string, tz: string = _tz): string {
  const date = new Date(dateStr + "Z");
  const utcStr = date.toLocaleString("en-US", { timeZone: "UTC" });
  const tzStr = date.toLocaleString("en-US", { timeZone: tz });
  const diffMs = new Date(tzStr).getTime() - new Date(utcStr).getTime();
  const sign = diffMs >= 0 ? "+" : "-";
  const abs = Math.abs(diffMs);
  const hours = Math.floor(abs / 3600000);
  const minutes = Math.floor((abs % 3600000) / 60000);
  return `${sign}${String(hours).padStart(2, "0")}:${String(minutes).padStart(2, "0")}`;
}

/**
 * Append the clinic timezone offset to a naive datetime string.
 * e.g. "2026-03-31T15:00:00" -> "2026-03-31T15:00:00+01:00"
 */
export function withTimezoneOffset(naiveDatetime: string, tz: string = _tz): string {
  if (/[+-]\d{2}:\d{2}$/.test(naiveDatetime) || naiveDatetime.endsWith("Z")) {
    return naiveDatetime;
  }
  const offset = getTimezoneOffset(naiveDatetime, tz);
  return `${naiveDatetime}${offset}`;
}
