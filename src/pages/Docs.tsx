import { useEffect, useState } from "react";
import { Navigate, useNavigate, useParams } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { Search, Menu, ArrowLeft } from "lucide-react";
import logoColor from "@/assets/logo-color.png";
import { DocsSidebar } from "@/components/docs/DocsSidebar";
import { DocsMarkdown } from "@/components/docs/DocsMarkdown";
import { DocsSearchDialog } from "@/components/docs/DocsSearchDialog";
import { allSections, docGroups, findSection } from "@/lib/docs";

const Docs = () => {
  const { isAdmin, loading } = useAuth();
  const { group, slug } = useParams();
  const navigate = useNavigate();
  const [searchOpen, setSearchOpen] = useState(false);
  const [mobileNavOpen, setMobileNavOpen] = useState(false);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "k") {
        e.preventDefault();
        setSearchOpen((v) => !v);
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  if (loading) return null;
  if (!isAdmin) return <Navigate to="/dashboard" replace />;

  // Default route → first section of first group
  if (!group || !slug) {
    const first = allSections[0];
    return <Navigate to={`/docs/${first.groupSlug}/${first.slug}`} replace />;
  }

  const section = findSection(group, slug);
  if (!section) {
    const first = docGroups.find((g) => g.slug === group)?.sections[0] ?? allSections[0];
    return <Navigate to={`/docs/${first.groupSlug}/${first.slug}`} replace />;
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Topbar */}
      <header className="sticky top-0 z-40 border-b border-border bg-background/80 backdrop-blur-md">
        <div className="max-w-[1600px] mx-auto h-14 px-4 lg:px-6 flex items-center gap-4">
          <Sheet open={mobileNavOpen} onOpenChange={setMobileNavOpen}>
            <SheetTrigger asChild>
              <Button variant="ghost" size="icon" className="lg:hidden">
                <Menu className="h-5 w-5" />
              </Button>
            </SheetTrigger>
            <SheetContent side="left" className="w-80 p-0 overflow-y-auto">
              <DocsSidebar onNavigate={() => setMobileNavOpen(false)} />
            </SheetContent>
          </Sheet>

          <button
            onClick={() => navigate("/dashboard")}
            className="flex items-center gap-2 shrink-0"
          >
            <img src={logoColor} alt="Bellex" className="h-6 w-auto" />
            <span className="hidden sm:inline text-xs font-medium text-muted-foreground border-l border-border pl-2 ml-1">
              Docs
            </span>
          </button>

          <div className="flex-1 flex justify-center max-w-2xl mx-auto">
            <button
              onClick={() => setSearchOpen(true)}
              className="w-full flex items-center gap-2 px-3 py-1.5 rounded-md border border-border bg-muted/40 text-sm text-muted-foreground hover:bg-muted transition-colors"
            >
              <Search className="h-4 w-4" />
              <span className="flex-1 text-left">Pesquisar...</span>
              <kbd className="hidden sm:inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded border border-border bg-background text-[10px] font-mono">
                ⌘K
              </kbd>
            </button>
          </div>

          <Button
            variant="ghost"
            size="sm"
            onClick={() => navigate("/dashboard")}
            className="hidden sm:inline-flex"
          >
            <ArrowLeft className="h-4 w-4 mr-1.5" />
            Voltar
          </Button>
        </div>
      </header>

      <div className="max-w-[1600px] mx-auto flex">
        {/* Sidebar */}
        <aside className="hidden lg:block w-72 shrink-0 border-r border-border min-h-[calc(100vh-3.5rem)] sticky top-14 self-start max-h-[calc(100vh-3.5rem)] overflow-y-auto">
          <DocsSidebar />
        </aside>

        {/* Content */}
        <main className="flex-1 min-w-0 px-6 lg:px-12 py-12">
          <div className="max-w-3xl">
            <div className="text-xs font-medium text-primary uppercase tracking-wider mb-3">
              {section.group}
            </div>
            <DocsMarkdown content={section.content} groupSlug={section.groupSlug} />
          </div>
        </main>
      </div>

      <DocsSearchDialog open={searchOpen} onOpenChange={setSearchOpen} />
    </div>
  );
};

export default Docs;
