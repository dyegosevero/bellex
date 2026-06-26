const hostname = window.location.hostname;

export const isSuperAdminDomain = hostname === "sa.bellex.beauty";
export const isWorkspaceDomain  = hostname === "ws.bellex.beauty";
export const isBookingDomain    = hostname.startsWith("agendamento.");
export const isLandingDomain    = hostname === "bellex.beauty" || hostname === "www.bellex.beauty";
export const isClinicSubdomain  =
  hostname.endsWith(".bellex.beauty") &&
  !isSuperAdminDomain && !isWorkspaceDomain && !isBookingDomain && !isLandingDomain;
export const isCustomDomain     =
  !isSuperAdminDomain && !isWorkspaceDomain && !isBookingDomain &&
  !isLandingDomain && !isClinicSubdomain &&
  hostname !== "localhost" && hostname !== "127.0.0.1";
