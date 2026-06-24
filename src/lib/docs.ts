import documentacaoRaw from "../../DOCUMENTOS/DOCUMENTACAO.md?raw";
import funcionalidadesRaw from "../../DOCUMENTOS/FUNCIONALIDADES.md?raw";
import readmeRaw from "../../README.md?raw";

export type DocSection = {
  slug: string;
  title: string;
  group: string;
  groupSlug: string;
  content: string;
};

export type DocGroup = {
  slug: string;
  label: string;
  sections: DocSection[];
};

const slugify = (s: string) =>
  s
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "")
    .slice(0, 80);

/** Split a markdown document into sections by `## ` headings. The content
 * before the first H2 (intro) is kept as a separate "intro" section. */
function splitByH2(
  md: string,
  group: string,
  groupSlug: string,
  introTitle: string
): DocSection[] {
  const lines = md.split("\n");
  const sections: DocSection[] = [];
  let currentTitle = introTitle;
  let currentBuf: string[] = [];

  const flush = () => {
    const content = currentBuf.join("\n").trim();
    if (!content) return;
    const cleanTitle = currentTitle.replace(/^[\d.]+\s*/, "").trim();
    sections.push({
      slug: slugify(cleanTitle),
      title: cleanTitle,
      group,
      groupSlug,
      content: `# ${cleanTitle}\n\n${content.replace(/^##\s+.+\n?/, "")}`,
    });
  };

  for (const line of lines) {
    if (/^##\s+/.test(line)) {
      flush();
      currentTitle = line.replace(/^##\s+/, "").trim();
      currentBuf = [];
    } else if (/^#\s+/.test(line) && sections.length === 0 && !currentBuf.length) {
      // skip top-level H1, we synthesise our own
      continue;
    } else {
      currentBuf.push(line);
    }
  }
  flush();
  // dedupe slugs
  const seen = new Map<string, number>();
  for (const s of sections) {
    const n = (seen.get(s.slug) ?? 0) + 1;
    seen.set(s.slug, n);
    if (n > 1) s.slug = `${s.slug}-${n}`;
  }
  return sections;
}

const intro: DocGroup = {
  slug: "introducao",
  label: "Introdução",
  sections: [
    {
      slug: "visao-geral",
      title: "Visão Geral",
      group: "Introdução",
      groupSlug: "introducao",
      content: readmeRaw,
    },
    {
      slug: "deploy-externo",
      title: "Deploy & Infraestrutura",
      group: "Introdução",
      groupSlug: "introducao",
      content: `# Deploy & Infraestrutura

O Bellex System é distribuído por **Git pull** e implantado em infraestrutura própria.

## Stack de produção

- **Frontend:** Vite build estático servido em VPS (Nginx).
- **Backend:** Supabase self-hosted ou cloud, gerido pelo cliente.
- **Edge Functions:** Deno, deploy via \`supabase functions deploy\`.
- **Base de dados:** PostgreSQL com RLS ativa em todas as tabelas.

## Fluxo de release

1. Pull do repositório no servidor.
2. \`bun install && bun run build\`.
3. Sincronizar \`dist/\` com o webroot do Nginx.
4. Aplicar migrations: \`supabase db push\`.
5. Redeploy de edge functions alteradas: \`supabase functions deploy <nome>\`.

## Variáveis de ambiente obrigatórias

- \`VITE_SUPABASE_URL\`
- \`VITE_SUPABASE_PUBLISHABLE_KEY\`
- \`VITE_SUPABASE_PROJECT_ID\`

Edge functions exigem ainda \`SUPABASE_SERVICE_ROLE_KEY\`, \`CRON_SECRET\` e
chaves de integração (Resend, Evolution API, n8n) configuradas como secrets.
`,
    },
  ],
};

const manual: DocGroup = {
  slug: "manual",
  label: "Manual do Usuário",
  sections: splitByH2(documentacaoRaw, "Manual do Usuário", "manual", "Introdução"),
};

const features: DocGroup = {
  slug: "funcionalidades",
  label: "Funcionalidades",
  sections: splitByH2(funcionalidadesRaw, "Funcionalidades", "funcionalidades", "Geral"),
};

export const docGroups: DocGroup[] = [intro, manual, features];

export const allSections: DocSection[] = docGroups.flatMap((g) => g.sections);

export function findSection(groupSlug?: string, slug?: string): DocSection | null {
  if (!groupSlug || !slug) return allSections[0] ?? null;
  return (
    allSections.find((s) => s.groupSlug === groupSlug && s.slug === slug) ?? null
  );
}
