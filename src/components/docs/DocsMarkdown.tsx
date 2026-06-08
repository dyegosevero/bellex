import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import rehypeSlug from "rehype-slug";
import rehypeAutolinkHeadings from "rehype-autolink-headings";
import rehypeHighlight from "rehype-highlight";
import "highlight.js/styles/github-dark.css";
import { useNavigate } from "react-router-dom";
import { allSections } from "@/lib/docs";

interface Props {
  content: string;
  groupSlug?: string;
}

const slugify = (s: string) =>
  s
    .toLowerCase()
    .normalize("NFD")
    .replace(/\p{M}/gu, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "")
    .slice(0, 80);

export const DocsMarkdown = ({ content, groupSlug }: Props) => {
  const navigate = useNavigate();

  const resolveAnchor = (anchor: string): string | null => {
    // Strip leading # and leading numbers (e.g. "1-", "12-")
    const raw = anchor.replace(/^#/, "").replace(/^\d+-/, "");
    const normalized = slugify(decodeURIComponent(raw));

    // Try to find the section in the same group first, then globally
    const candidates = groupSlug
      ? allSections.filter((s) => s.groupSlug === groupSlug)
      : allSections;

    const match =
      candidates.find((s) => s.slug === normalized) ??
      allSections.find((s) => s.slug === normalized) ??
      // fuzzy: section slug starts with or contains normalized
      allSections.find((s) => s.slug.startsWith(normalized) || normalized.startsWith(s.slug));

    return match ? `/docs/${match.groupSlug}/${match.slug}` : null;
  };

  return (
    <article className="docs-prose">
      <ReactMarkdown
        remarkPlugins={[remarkGfm]}
        rehypePlugins={[
          rehypeSlug,
          [rehypeAutolinkHeadings, { behavior: "wrap" }],
          rehypeHighlight,
        ]}
        components={{
          a({ href, children, ...props }) {
            if (href?.startsWith("#")) {
              const route = resolveAnchor(href);
              if (route) {
                return (
                  <a
                    href={route}
                    onClick={(e) => { e.preventDefault(); navigate(route); }}
                    {...props}
                  >
                    {children}
                  </a>
                );
              }
            }
            // External links open in new tab
            if (href && !href.startsWith("/") && !href.startsWith("#")) {
              return <a href={href} target="_blank" rel="noopener noreferrer" {...props}>{children}</a>;
            }
            return <a href={href} {...props}>{children}</a>;
          },
        }}
      >
        {content}
      </ReactMarkdown>
    </article>
  );
};
