import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  CommandDialog,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import { docGroups } from "@/lib/docs";

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export const DocsSearchDialog = ({ open, onOpenChange }: Props) => {
  const navigate = useNavigate();
  const [query, setQuery] = useState("");

  useEffect(() => {
    if (!open) setQuery("");
  }, [open]);

  return (
    <CommandDialog open={open} onOpenChange={onOpenChange}>
      <CommandInput
        placeholder="Pesquisar na documentação..."
        value={query}
        onValueChange={setQuery}
      />
      <CommandList>
        <CommandEmpty>Nenhum resultado encontrado.</CommandEmpty>
        {docGroups.map((g) => (
          <CommandGroup key={g.slug} heading={g.label}>
            {g.sections.map((s) => {
              // include first 200 chars of content as searchable hint
              const hint = s.content.replace(/[#*`>\-]/g, " ").slice(0, 160);
              return (
                <CommandItem
                  key={`${g.slug}-${s.slug}`}
                  value={`${s.title} ${hint}`}
                  onSelect={() => {
                    onOpenChange(false);
                    navigate(`/docs/${g.slug}/${s.slug}`);
                  }}
                >
                  <div className="flex flex-col">
                    <span className="text-sm">{s.title}</span>
                    <span className="text-xs text-muted-foreground line-clamp-1">
                      {hint}
                    </span>
                  </div>
                </CommandItem>
              );
            })}
          </CommandGroup>
        ))}
      </CommandList>
    </CommandDialog>
  );
};
