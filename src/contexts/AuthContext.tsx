import { createContext, useContext, useEffect, useState, useCallback, ReactNode } from "react";
import { User, Session } from "@supabase/supabase-js";
import { supabase } from "@/integrations/supabase/client";
import { setTimezone } from "@/lib/date";

type AppRole = "admin" | "especialista" | "atendimento";

interface AuthContextType {
  user: User | null;
  session: Session | null;
  role: AppRole | null;
  loading: boolean;
  isAdmin: boolean;
  isSpecialist: boolean;
  isReceptionist: boolean;
  canDelete: boolean;
  canEditClinical: boolean;
  signIn: (email: string, password: string) => Promise<{ error: Error | null }>;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

const SAFETY_TIMEOUT_MS = 4000;

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [role, setRole] = useState<AppRole | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchRole = useCallback(async (userId: string): Promise<AppRole | null> => {
    try {
      const { data, error } = await supabase
        .from("user_roles")
        .select("role")
        .eq("user_id", userId)
        .single();
      if (error || !data) return null;
      return data.role as AppRole;
    } catch {
      return null;
    }
  }, []);

  useEffect(() => {
    let active = true;
    let resolved = false;
    const startedAt = Date.now();
    const MIN_LOADING_MS = 800;

    const finish = () => {
      if (active && !resolved) {
        resolved = true;
        const elapsed = Date.now() - startedAt;
        const remaining = Math.max(0, MIN_LOADING_MS - elapsed);
        setTimeout(() => { if (active) setLoading(false); }, remaining);
      }
    };

    // Safety: ALWAYS unblock UI after timeout
    const safetyTimer = setTimeout(() => {
      if (!resolved) {
        console.warn("[Auth] Safety timeout — unblocking UI");
        finish();
      }
    }, SAFETY_TIMEOUT_MS);

    // SINGLE source of truth: onAuthStateChange
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (_event, currentSession) => {
        if (!active) return;

        if (!currentSession?.user) {
          setUser(null);
          setSession(null);
          setRole(null);
          finish();
          return;
        }

        // Set user/session immediately so UI can react
        setUser(currentSession.user);
        setSession(currentSession);

        // Fetch role — but don't call Supabase inside the callback synchronously
        // (this avoids a known deadlock in the Supabase JS client)
        const userId = currentSession.user.id;
        // Use queueMicrotask to break out of the callback synchronously
        queueMicrotask(async () => {
          if (!active) return;
          const r = await fetchRole(userId);
          if (active) {
            setRole(r);
            finish();
          }
        });
      }
    );

    // Trigger the listener by calling getSession
    // (this causes onAuthStateChange to fire with INITIAL_SESSION)
    supabase.auth.getSession().catch(() => {
      // If getSession fails, the listener won't fire — unblock manually
      if (active) finish();
    });

    // Load clinic timezone and apply globally
    (async () => {
      try {
        const { data } = await supabase
          .from("clinic_settings")
          .select("timezone")
          .limit(1)
          .single();
        if (data?.timezone) setTimezone(data.timezone);
      } catch {}
    })();

    return () => {
      active = false;
      clearTimeout(safetyTimer);
      subscription.unsubscribe();
    };
  }, [fetchRole]);

  const signIn = useCallback(async (email: string, password: string) => {
    try {
      const { error } = await supabase.auth.signInWithPassword({ email, password });
      return { error: error as Error | null };
    } catch (err) {
      return { error: err as Error };
    }
  }, []);

  const signOut = useCallback(async () => {
    setUser(null);
    setSession(null);
    setRole(null);
    try {
      await supabase.auth.signOut();
    } catch {
      // Even if signOut fails, state is already cleared
    }
  }, []);

  const isAdmin = role === "admin";
  const isSpecialist = role === "especialista";
  const isReceptionist = role === "atendimento";
  const canDelete = isAdmin;
  const canEditClinical = isAdmin || isSpecialist;

  return (
    <AuthContext.Provider
      value={{
        user,
        session,
        role,
        loading,
        signIn,
        signOut,
        isAdmin,
        isSpecialist,
        isReceptionist,
        canDelete,
        canEditClinical,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
};
