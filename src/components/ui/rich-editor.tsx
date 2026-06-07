import { useEditor, EditorContent } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import TextAlign from "@tiptap/extension-text-align";
import { TextStyle } from "@tiptap/extension-text-style";
import { Mark, mergeAttributes } from "@tiptap/core";
import {
  Bold,
  Italic,
  List,
  ListOrdered,
  Heading1,
  Heading2,
  Heading3,
  AlignLeft,
  AlignCenter,
  AlignRight,
  Code,
  Eye,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Toggle } from "@/components/ui/toggle";
import { Separator } from "@/components/ui/separator";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { useEffect, useState } from "react";

interface RichEditorProps {
  value?: string;
  onChange?: (html: string) => void;
  placeholder?: string;
  className?: string;
}

// Custom FontSize mark applied via inline style
const FontSize = Mark.create({
  name: "fontSize",
  addOptions() {
    return { HTMLAttributes: {} };
  },
  addAttributes() {
    return {
      size: {
        default: null,
        parseHTML: (element: HTMLElement) => element.style.fontSize || null,
        renderHTML: (attributes: any) => {
          if (!attributes.size) return {};
          return { style: `font-size: ${attributes.size}` };
        },
      },
    };
  },
  parseHTML() {
    return [{ style: "font-size" }];
  },
  renderHTML({ HTMLAttributes }) {
    return ["span", mergeAttributes(HTMLAttributes), 0];
  },
  addCommands() {
    return {
      setFontSize:
        (size: string) =>
        ({ commands }: any) =>
          commands.setMark(this.name, { size }),
      unsetFontSize:
        () =>
        ({ commands }: any) =>
          commands.unsetMark(this.name),
    } as any;
  },
});

const FONT_SIZES = [
  { value: "12px", label: "12" },
  { value: "14px", label: "14" },
  { value: "16px", label: "16" },
  { value: "18px", label: "18" },
  { value: "20px", label: "20" },
  { value: "24px", label: "24" },
  { value: "28px", label: "28" },
  { value: "32px", label: "32" },
];

export const RichEditor = ({ value, onChange, placeholder, className }: RichEditorProps) => {
  const [sourceMode, setSourceMode] = useState(false);

  const editor = useEditor({
    extensions: [
      StarterKit,
      TextStyle,
      FontSize,
      TextAlign.configure({ types: ["heading", "paragraph"] }),
    ],
    content: value || "",
    editorProps: {
      attributes: {
        class: cn(
          "min-h-[200px] w-full px-4 py-3 text-sm focus:outline-none",
          "rich-editor-content",
          "[&_h1]:text-3xl [&_h1]:font-bold [&_h1]:my-3 [&_h1]:leading-tight",
          "[&_h2]:text-2xl [&_h2]:font-bold [&_h2]:my-3 [&_h2]:leading-tight",
          "[&_h3]:text-xl [&_h3]:font-semibold [&_h3]:my-2 [&_h3]:leading-snug",
          "[&_p]:my-2 [&_p]:leading-relaxed",
          "[&_ul]:list-disc [&_ul]:pl-6 [&_ul]:my-2",
          "[&_ol]:list-decimal [&_ol]:pl-6 [&_ol]:my-2",
          "[&_li]:my-0.5",
          "[&_strong]:font-bold [&_em]:italic",
          "[&_p.is-editor-empty:first-child]:before:content-[attr(data-placeholder)]",
          "[&_p.is-editor-empty:first-child]:before:text-muted-foreground",
          "[&_p.is-editor-empty:first-child]:before:float-left",
          "[&_p.is-editor-empty:first-child]:before:pointer-events-none",
          "[&_p.is-editor-empty:first-child]:before:h-0"
        ),
      },
    },
    onUpdate: ({ editor }) => {
      const html = editor.getHTML();
      onChange?.(html === "<p></p>" ? "" : html);
    },
  });

  useEffect(() => {
    if (editor && value !== undefined && !sourceMode) {
      const currentHtml = editor.getHTML();
      const normalizedValue = value || "";
      const normalizedCurrent = currentHtml === "<p></p>" ? "" : currentHtml;
      if (normalizedValue !== normalizedCurrent) {
        editor.commands.setContent(value || "");
      }
    }
  }, [value, editor, sourceMode]);

  if (!editor) return null;

  const currentSize =
    (editor.getAttributes("fontSize")?.size as string | undefined) || "";

  return (
    <div
      className={cn(
        "rounded-md border border-input bg-background ring-offset-background",
        "focus-within:ring-2 focus-within:ring-ring focus-within:ring-offset-2",
        className
      )}
    >
      {/* Toolbar */}
      <div className="flex items-center gap-0.5 border-b border-border px-1 py-1 flex-wrap">
        <Toggle
          size="sm"
          pressed={editor.isActive("heading", { level: 1 })}
          onPressedChange={() => editor.chain().focus().toggleHeading({ level: 1 }).run()}
          aria-label="Título 1"
          className="h-7 w-7 p-0"
          disabled={sourceMode}
        >
          <Heading1 className="h-3.5 w-3.5" />
        </Toggle>
        <Toggle
          size="sm"
          pressed={editor.isActive("heading", { level: 2 })}
          onPressedChange={() => editor.chain().focus().toggleHeading({ level: 2 }).run()}
          aria-label="Título 2"
          className="h-7 w-7 p-0"
          disabled={sourceMode}
        >
          <Heading2 className="h-3.5 w-3.5" />
        </Toggle>
        <Toggle
          size="sm"
          pressed={editor.isActive("heading", { level: 3 })}
          onPressedChange={() => editor.chain().focus().toggleHeading({ level: 3 }).run()}
          aria-label="Título 3"
          className="h-7 w-7 p-0"
          disabled={sourceMode}
        >
          <Heading3 className="h-3.5 w-3.5" />
        </Toggle>

        <Separator orientation="vertical" className="mx-0.5 h-5" />

        {/* Font size */}
        <Select
          value={currentSize || "default"}
          onValueChange={(v) => {
            if (v === "default") {
              (editor.chain().focus() as any).unsetFontSize().run();
            } else {
              (editor.chain().focus() as any).setFontSize(v).run();
            }
          }}
          disabled={sourceMode}
        >
          <SelectTrigger className="h-7 w-[72px] text-xs px-2">
            <SelectValue placeholder="Tam." />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="default">Padrão</SelectItem>
            {FONT_SIZES.map((s) => (
              <SelectItem key={s.value} value={s.value}>
                {s.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        <Separator orientation="vertical" className="mx-0.5 h-5" />

        <Toggle
          size="sm"
          pressed={editor.isActive("bold")}
          onPressedChange={() => editor.chain().focus().toggleBold().run()}
          aria-label="Bold"
          className="h-7 w-7 p-0"
          disabled={sourceMode}
        >
          <Bold className="h-3.5 w-3.5" />
        </Toggle>
        <Toggle
          size="sm"
          pressed={editor.isActive("italic")}
          onPressedChange={() => editor.chain().focus().toggleItalic().run()}
          aria-label="Italic"
          className="h-7 w-7 p-0"
          disabled={sourceMode}
        >
          <Italic className="h-3.5 w-3.5" />
        </Toggle>

        <Separator orientation="vertical" className="mx-0.5 h-5" />

        {/* Alignment */}
        <Toggle
          size="sm"
          pressed={editor.isActive({ textAlign: "left" })}
          onPressedChange={() => editor.chain().focus().setTextAlign("left").run()}
          aria-label="Alinhar à esquerda"
          className="h-7 w-7 p-0"
          disabled={sourceMode}
        >
          <AlignLeft className="h-3.5 w-3.5" />
        </Toggle>
        <Toggle
          size="sm"
          pressed={editor.isActive({ textAlign: "center" })}
          onPressedChange={() => editor.chain().focus().setTextAlign("center").run()}
          aria-label="Centrar"
          className="h-7 w-7 p-0"
          disabled={sourceMode}
        >
          <AlignCenter className="h-3.5 w-3.5" />
        </Toggle>
        <Toggle
          size="sm"
          pressed={editor.isActive({ textAlign: "right" })}
          onPressedChange={() => editor.chain().focus().setTextAlign("right").run()}
          aria-label="Alinhar à direita"
          className="h-7 w-7 p-0"
          disabled={sourceMode}
        >
          <AlignRight className="h-3.5 w-3.5" />
        </Toggle>

        <Separator orientation="vertical" className="mx-0.5 h-5" />

        <Toggle
          size="sm"
          pressed={editor.isActive("bulletList")}
          onPressedChange={() => editor.chain().focus().toggleBulletList().run()}
          aria-label="Lista"
          className="h-7 w-7 p-0"
          disabled={sourceMode}
        >
          <List className="h-3.5 w-3.5" />
        </Toggle>
        <Toggle
          size="sm"
          pressed={editor.isActive("orderedList")}
          onPressedChange={() => editor.chain().focus().toggleOrderedList().run()}
          aria-label="Lista numerada"
          className="h-7 w-7 p-0"
          disabled={sourceMode}
        >
          <ListOrdered className="h-3.5 w-3.5" />
        </Toggle>

        <div className="ml-auto">
          <Button
            type="button"
            variant="ghost"
            size="sm"
            className="h-7 px-2 text-xs gap-1"
            onClick={() => {
              if (sourceMode && editor) {
                // leaving source → push value back into editor
                editor.commands.setContent(value || "");
              }
              setSourceMode((m) => !m);
            }}
          >
            {sourceMode ? <Eye className="h-3.5 w-3.5" /> : <Code className="h-3.5 w-3.5" />}
            {sourceMode ? "Visual" : "HTML"}
          </Button>
        </div>
      </div>

      {/* Editor / Source */}
      {sourceMode ? (
        <Textarea
          value={value || ""}
          onChange={(e) => onChange?.(e.target.value)}
          placeholder={placeholder}
          className="min-h-[300px] border-0 rounded-none font-mono text-xs focus-visible:ring-0 focus-visible:ring-offset-0"
        />
      ) : (
        <EditorContent editor={editor} />
      )}
    </div>
  );
};
