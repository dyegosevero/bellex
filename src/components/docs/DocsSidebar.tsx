import { NavLink, useLocation } from "react-router-dom";
import { docGroups } from "@/lib/docs";
import { cn } from "@/lib/utils";

export const DocsSidebar = ({ onNavigate }: { onNavigate?: () => void }) => {
  const { pathname } = useLocation();

  return (
    <nav className="px-6 py-8 space-y-8">
      {docGroups.map((g) => (
        <div key={g.slug}>
          <h4 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-3">
            {g.label}
          </h4>
          <ul className="space-y-0.5 border-l border-border">
            {g.sections.map((s) => {
              const to = `/docs/${g.slug}/${s.slug}`;
              const active = pathname === to;
              return (
                <li key={s.slug}>
                  <NavLink
                    to={to}
                    onClick={onNavigate}
                    className={cn(
                      "block pl-4 -ml-px py-1.5 text-sm border-l transition-colors",
                      active
                        ? "border-primary text-primary font-medium"
                        : "border-transparent text-muted-foreground hover:text-foreground hover:border-foreground/30"
                    )}
                  >
                    {s.title}
                  </NavLink>
                </li>
              );
            })}
          </ul>
        </div>
      ))}
    </nav>
  );
};
