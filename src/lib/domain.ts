const _host = window.location.hostname;

export const isSuperAdminDomain = _host === "sa.bellex.beauty";
export const isWorkspaceDomain  = _host === "ws.bellex.beauty";
export const isBookingDomain    = _host.startsWith("agendamento.");
export const isLandingDomain    = _host === "bellex.beauty" || _host === "www.bellex.beauty";
export const isClinicSubdomain  =
  _host.endsWith(".bellex.beauty") &&
  !isSuperAdminDomain && !isWorkspaceDomain && !isBookingDomain && !isLandingDomain;
export const isCustomDomain     =
  !isSuperAdminDomain && !isWorkspaceDomain && !isBookingDomain &&
  !isLandingDomain && !isClinicSubdomain &&
  _host !== "localhost" && _host !== "127.0.0.1";
