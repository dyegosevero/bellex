import { forwardRef } from "react"; // kept for backwards compat
import { Calendar, Bell, Search, ChevronLeft, ChevronRight, Clock } from "lucide-react";
import logoColor from "@/assets/logo-color.png";

const appointments = [
  { time: "09:00", client: "Camila F.", service: "Limpeza de Pele", color: "bg-primary/15 border-primary/30 text-primary" },
  { time: "10:30", client: "Juliana M.", service: "Design de Sobrancelha", color: "bg-blue-50 border-blue-200 text-blue-600" },
  { time: "11:30", client: "Fernanda R.", service: "Tratamento Facial Profundo", color: "bg-emerald-50 border-emerald-200 text-emerald-600" },
  { time: "14:00", client: "Patricia L.", service: "Massagem Relaxante", color: "bg-violet-50 border-violet-200 text-violet-600" },
  { time: "15:30", client: "Andrea C.", service: "Peeling Químico", color: "bg-amber-50 border-amber-200 text-amber-600" },
  { time: "16:30", client: "Renata B.", service: "Botox Preventivo", color: "bg-rose-50 border-rose-200 text-rose-600" },
];

const days = ["Seg", "Ter", "Qua", "Qui", "Sex", "Sáb"];
const dates = [2, 3, 4, 5, 6, 7];

const DashboardMock = forwardRef<HTMLDivElement>((_, ref) => {
  return (
    <div
      ref={ref}
      className="w-full max-w-5xl mx-auto rounded-2xl overflow-hidden border border-border shadow-[0_32px_80px_hsl(20_15%_12%/0.12)]"
      style={{ background: "hsl(30 25% 99%)" }}
    >
      {/* Window chrome */}
      <div className="flex items-center gap-2 px-4 py-3 border-b border-border" style={{ background: "hsl(30 20% 97%)" }}>
        <div className="w-2.5 h-2.5 rounded-full bg-red-400/70" />
        <div className="w-2.5 h-2.5 rounded-full bg-yellow-400/70" />
        <div className="w-2.5 h-2.5 rounded-full bg-green-400/70" />
        <div className="flex-1 mx-4">
          <div className="w-44 h-4 mx-auto rounded bg-border/60 flex items-center justify-center">
            <span className="text-[9px] text-muted-foreground">app.bellex.com.br</span>
          </div>
        </div>
      </div>

      <div className="flex h-[520px]">
        {/* Sidebar */}
        <div className="w-12 border-r border-border flex flex-col items-center py-4 gap-4" style={{ background: "hsl(30 20% 97%)" }}>
          <img src={logoColor} alt="Bellex" className="w-7 h-auto opacity-90 mb-1" />
          {[Calendar, Clock, Bell, Search].map((Icon, i) => (
            <div
              key={i}
              className={`w-8 h-8 rounded-xl flex items-center justify-center cursor-pointer transition-colors ${
                i === 0 ? "bg-primary/15" : "hover:bg-border/60"
              }`}
            >
              <Icon size={14} className={i === 0 ? "text-primary" : "text-muted-foreground"} />
            </div>
          ))}
        </div>

        {/* Main */}
        <div className="flex-1 flex flex-col min-w-0">
          {/* Header */}
          <div className="flex items-center justify-between px-5 py-3 border-b border-border">
            <div>
              <h3 className="text-foreground text-sm font-medium">Agenda</h3>
              <p className="text-muted-foreground text-[11px]">Junho 2026 · 6 atendimentos hoje</p>
            </div>
            <div className="flex items-center gap-2">
              <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-border text-muted-foreground">
                <Search size={11} />
                <span className="text-[11px]">Buscar cliente...</span>
              </div>
              <div className="w-7 h-7 rounded-lg bg-primary/10 flex items-center justify-center">
                <Bell size={12} className="text-primary" />
              </div>
            </div>
          </div>

          {/* Week strip */}
          <div className="flex items-center gap-1 px-5 py-2.5 border-b border-border">
            <button className="p-1 rounded-lg hover:bg-muted text-muted-foreground">
              <ChevronLeft size={13} />
            </button>
            <div className="flex gap-1 flex-1">
              {days.map((d, i) => (
                <div
                  key={d}
                  className={`flex-1 flex flex-col items-center py-1.5 rounded-xl cursor-pointer text-xs transition-colors ${
                    i === 2 ? "bg-primary/10" : "hover:bg-muted"
                  }`}
                >
                  <span className={i === 2 ? "text-primary font-medium" : "text-muted-foreground"}>{d}</span>
                  <span className={`text-sm font-light mt-0.5 ${i === 2 ? "text-primary font-medium" : "text-foreground"}`}>
                    {dates[i]}
                  </span>
                </div>
              ))}
            </div>
            <button className="p-1 rounded-lg hover:bg-muted text-muted-foreground">
              <ChevronRight size={13} />
            </button>
          </div>

          {/* Appointment list */}
          <div className="flex-1 overflow-hidden px-5 py-3 space-y-2">
            {/* "now" label */}
            <div className="flex items-center gap-2 mb-1">
              <div className="w-1.5 h-1.5 rounded-full bg-primary" />
              <span className="text-[10px] text-primary font-medium">Agora · 11:45</span>
              <div className="flex-1 border-t border-primary/20" />
            </div>

            {appointments.map((apt, i) => (
              <div
                key={i}
                className={`flex items-center gap-3 px-3 py-2 rounded-xl border ${apt.color} cursor-pointer hover:brightness-[0.97] transition-all`}
              >
                <div className="text-[10px] font-semibold w-10 flex-shrink-0">{apt.time}</div>
                <div className="flex-1 min-w-0">
                  <div className="text-[11px] font-medium truncate">{apt.service}</div>
                  <div className="text-[10px] opacity-70 truncate">{apt.client}</div>
                </div>
                <div className="w-5 h-5 rounded-full bg-white/60 flex items-center justify-center text-[9px] font-medium flex-shrink-0">
                  {apt.client.split(" ").map(w => w[0]).join("")}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Right panel */}
        <div className="w-44 border-l border-border flex flex-col p-4 gap-4 flex-shrink-0" style={{ background: "hsl(30 20% 97%)" }}>
          <div>
            <p className="text-[10px] text-muted-foreground uppercase tracking-wider mb-2">Hoje</p>
            <div className="text-3xl font-light text-foreground">6</div>
            <div className="text-muted-foreground text-[11px]">atendimentos</div>
          </div>

          <div>
            <p className="text-[10px] text-muted-foreground uppercase tracking-wider mb-2">Faturamento</p>
            <div className="text-lg font-light text-foreground">R$ 1.840</div>
            <div className="text-muted-foreground text-[11px]">+12% esta semana</div>
          </div>

          <div className="space-y-1.5 mt-auto">
            <p className="text-[10px] text-muted-foreground uppercase tracking-wider mb-2">Especialistas</p>
            {["Dra. Ana", "Bianca S.", "Dr. Felipe"].map((name) => (
              <div key={name} className="flex items-center gap-2">
                <div className="w-5 h-5 rounded-full bg-primary/15 flex items-center justify-center text-[9px] font-medium text-primary">
                  {name.split(" ").map(w => w[0]).join("")}
                </div>
                <span className="text-[10px] text-muted-foreground truncate">{name}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
});

DashboardMock.displayName = "DashboardMock";
export default DashboardMock;
