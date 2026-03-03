"use client";

import { useEditor, EditorContent } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import Placeholder from "@tiptap/extension-placeholder";
import Underline from "@tiptap/extension-underline";
import Link from "@tiptap/extension-link";
import { TableKit } from "@tiptap/extension-table";
import {
  BoldIcon,
  ItalicIcon,
  UnderlineIcon,
  StrikethroughIcon,
  TableIcon,
  ListIcon,
  ListOrderedIcon,
  Heading2Icon,
  Heading3Icon,
  QuoteIcon,
  CodeIcon,
  MinusIcon,
  LinkIcon,
} from "lucide-react";
import { useCallback, useEffect, useMemo, useState } from "react";

import { Button } from "@/components/ui/button";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";

const getExtensions = (placeholderText: string) => [
  StarterKit,
  Placeholder.configure({
    placeholder: placeholderText,
    emptyEditorClass: "is-editor-empty",
  }),
  Underline,
  Link.configure({
    openOnClick: false,
    HTMLAttributes: { rel: "noopener noreferrer", target: "_blank" },
  }),
  TableKit.configure({
    resizable: false,
    renderWrapper: false,
  }),
];

interface RichTextEditorProps {
  value?: string;
  onChange?: (html: string) => void;
  placeholder?: string;
  disabled?: boolean;
  minHeight?: string;
  className?: string;
  /** Se true, mostra a toolbar compacta (ex.: no histórico do paciente). */
  compact?: boolean;
}

export function RichTextEditor({
  value = "",
  onChange,
  placeholder = "Digite aqui...",
  disabled = false,
  minHeight = "120px",
  className,
  compact = false,
}: RichTextEditorProps) {
  const [linkPopoverOpen, setLinkPopoverOpen] = useState(false);
  const [linkUrl, setLinkUrl] = useState("");
  const extensions = useMemo(
    () => getExtensions(placeholder),
    [placeholder],
  );
  const editor = useEditor({
    extensions,
    content: value || "",
    editable: !disabled,
    immediatelyRender: false,
    editorProps: {
      attributes: {
        class:
          "prose prose-sm dark:prose-invert max-w-none focus:outline-none min-h-[80px] px-3 py-2 [&_table]:border-collapse [&_td]:border [&_th]:border [&_td]:px-2 [&_th]:px-2 [&_td]:py-1 [&_th]:py-1 [&_th]:bg-muted [&_td]:border-border [&_th]:border-border",
      },
      handleDOMEvents: {
        blur: () => {
          onChange?.(editor?.getHTML() ?? "");
        },
      },
    },
  });

  const updateContent = useCallback(() => {
    if (!editor) return;
    const html = editor.getHTML();
    if (html !== value) onChange?.(html);
  }, [editor, value, onChange]);

  useEffect(() => {
    if (!editor) return;
    editor.on("update", updateContent);
    return () => {
      editor.off("update", updateContent);
    };
  }, [editor, updateContent]);

  useEffect(() => {
    if (!editor) return;
    if (value !== editor.getHTML()) {
      editor.commands.setContent(value || "", false);
    }
  }, [value, editor]);

  useEffect(() => {
    if (!editor) return;
    editor.setEditable(!disabled);
  }, [editor, disabled]);

  const setLink = useCallback(() => {
    if (!editor) return;
    if (linkUrl.trim()) {
      editor.chain().focus().setLink({ href: linkUrl.trim() }).run();
    } else {
      editor.chain().focus().unsetLink().run();
    }
    setLinkUrl("");
    setLinkPopoverOpen(false);
  }, [editor, linkUrl]);

  const openLinkPopover = useCallback(() => {
    const prev = editor?.getAttributes("link").href ?? "";
    setLinkUrl(prev);
    setLinkPopoverOpen(true);
  }, [editor]);

  if (!editor) {
    return (
      <div
        className={cn(
          "rounded-md border border-input bg-muted/30 animate-pulse",
          minHeight && `min-h-[${minHeight}]`,
          className,
        )}
        style={{ minHeight }}
      />
    );
  }

  return (
    <div
      className={cn(
        "rich-text-editor rounded-md border border-input bg-background overflow-hidden focus-within:ring-ring focus-within:ring-[3px] focus-within:ring-ring/50 focus-within:border-ring",
        className,
      )}
    >
      <div
        className={cn(
          "flex flex-wrap items-center gap-0.5 border-b border-input bg-muted/30 p-1",
          compact && "py-0.5",
        )}
      >
        <ToolbarButton
          onClick={() => editor.chain().focus().toggleBold().run()}
          isActive={editor.isActive("bold")}
          title="Negrito"
          compact={compact}
        >
          <BoldIcon className="size-4" />
        </ToolbarButton>
        <ToolbarButton
          onClick={() => editor.chain().focus().toggleItalic().run()}
          isActive={editor.isActive("italic")}
          title="Itálico"
          compact={compact}
        >
          <ItalicIcon className="size-4" />
        </ToolbarButton>
        <ToolbarButton
          onClick={() => editor.chain().focus().toggleUnderline().run()}
          isActive={editor.isActive("underline")}
          title="Sublinhado"
          compact={compact}
        >
          <UnderlineIcon className="size-4" />
        </ToolbarButton>
        <ToolbarButton
          onClick={() => editor.chain().focus().toggleStrike().run()}
          isActive={editor.isActive("strike")}
          title="Riscado"
          compact={compact}
        >
          <StrikethroughIcon className="size-4" />
        </ToolbarButton>
        <span className="mx-1 h-5 w-px bg-border" aria-hidden />
        <ToolbarButton
          onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()}
          isActive={editor.isActive("heading", { level: 2 })}
          title="Título 2"
          compact={compact}
        >
          <Heading2Icon className="size-4" />
        </ToolbarButton>
        <ToolbarButton
          onClick={() => editor.chain().focus().toggleHeading({ level: 3 }).run()}
          isActive={editor.isActive("heading", { level: 3 })}
          title="Título 3"
          compact={compact}
        >
          <Heading3Icon className="size-4" />
        </ToolbarButton>
        <span className="mx-1 h-5 w-px bg-border" aria-hidden />
        <ToolbarButton
          onClick={() => editor.chain().focus().toggleBlockquote().run()}
          isActive={editor.isActive("blockquote")}
          title="Citação"
          compact={compact}
        >
          <QuoteIcon className="size-4" />
        </ToolbarButton>
        <ToolbarButton
          onClick={() => editor.chain().focus().toggleCode().run()}
          isActive={editor.isActive("code")}
          title="Código"
          compact={compact}
        >
          <CodeIcon className="size-4" />
        </ToolbarButton>
        <ToolbarButton
          onClick={() => editor.chain().focus().setHorizontalRule().run()}
          title="Linha horizontal"
          compact={compact}
        >
          <MinusIcon className="size-4" />
        </ToolbarButton>
        <span className="mx-1 h-5 w-px bg-border" aria-hidden />
        <ToolbarButton
          onClick={() => editor.chain().focus().toggleBulletList().run()}
          isActive={editor.isActive("bulletList")}
          title="Lista com marcadores"
          compact={compact}
        >
          <ListIcon className="size-4" />
        </ToolbarButton>
        <ToolbarButton
          onClick={() => editor.chain().focus().toggleOrderedList().run()}
          isActive={editor.isActive("orderedList")}
          title="Lista numerada"
          compact={compact}
        >
          <ListOrderedIcon className="size-4" />
        </ToolbarButton>
        <span className="mx-1 h-5 w-px bg-border" aria-hidden />
        <ToolbarButton
          onClick={() => {
            editor.chain().focus().insertTable({ rows: 3, cols: 3, withHeaderRow: true }).run();
          }}
          title="Inserir tabela (3×3)"
          compact={compact}
        >
          <TableIcon className="size-4" />
        </ToolbarButton>
        <span className="mx-1 h-5 w-px bg-border" aria-hidden />
        <Popover open={linkPopoverOpen} onOpenChange={setLinkPopoverOpen}>
          <PopoverTrigger asChild>
            <Button
              type="button"
              variant="ghost"
              size={compact ? "icon" : "sm"}
              className={cn(
                "h-8 w-8 shrink-0 p-0",
                editor.isActive("link") && "bg-muted",
              )}
              title="Inserir link"
              aria-label="Inserir link"
              onClick={openLinkPopover}
            >
              <LinkIcon className="size-4" />
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-80" align="start">
            <div className="flex flex-col gap-2">
              <label className="text-sm font-medium">URL do link</label>
              <Input
                value={linkUrl}
                onChange={(e) => setLinkUrl(e.target.value)}
                placeholder="https://..."
                onKeyDown={(e) => e.key === "Enter" && setLink()}
              />
              <div className="flex gap-2">
                <Button type="button" size="sm" onClick={setLink}>
                  Aplicar
                </Button>
                <Button
                  type="button"
                  size="sm"
                  variant="outline"
                  onClick={() => {
                    editor.chain().focus().unsetLink().run();
                    setLinkUrl("");
                    setLinkPopoverOpen(false);
                  }}
                >
                  Remover link
                </Button>
              </div>
            </div>
          </PopoverContent>
        </Popover>
      </div>
      <div className="min-h-[80px]" style={{ minHeight }}>
        <EditorContent editor={editor} />
      </div>
      <style dangerouslySetInnerHTML={{
        __html: `
          .rich-text-editor .ProseMirror.is-editor-empty::before { content: attr(data-placeholder); float: left; color: hsl(var(--muted-foreground)); pointer-events: none; height: 0; }
          .rich-text-editor .ProseMirror table { border-collapse: collapse; table-layout: fixed; width: 100%; margin: 0.5rem 0; min-width: 200px; }
          .rich-text-editor .ProseMirror td, .rich-text-editor .ProseMirror th { border: 1px solid hsl(var(--border)); padding: 0.25rem 0.5rem; vertical-align: top; min-width: 50px; }
          .rich-text-editor .ProseMirror th { background: hsl(var(--muted)); font-weight: 600; }
          .rich-text-editor .ProseMirror .tableWrapper { overflow-x: auto; margin: 0.5rem 0; }
          .rich-text-editor .ProseMirror .tableWrapper table { margin: 0; }
          .rich-text-editor .ProseMirror blockquote { border-left: 3px solid hsl(var(--border)); padding-left: 0.75rem; margin: 0.5rem 0; color: hsl(var(--muted-foreground)); }
          .rich-text-editor .ProseMirror code { background: hsl(var(--muted)); padding: 0.125rem 0.25rem; border-radius: 0.25rem; font-size: 0.875em; }
          .rich-text-editor .ProseMirror hr { border: none; border-top: 1px solid hsl(var(--border)); margin: 0.75rem 0; }
          .rich-text-editor .ProseMirror a { color: hsl(var(--primary)); text-decoration: underline; }
        `,
      }} />
    </div>
  );
}

function ToolbarButton({
  onClick,
  isActive,
  title,
  children,
  compact,
}: {
  onClick: () => void;
  isActive?: boolean;
  title: string;
  children: React.ReactNode;
  compact?: boolean;
}) {
  return (
    <Button
      type="button"
      variant="ghost"
      size={compact ? "icon" : "sm"}
      className={cn(
        "h-8 w-8 shrink-0 p-0",
        isActive && "bg-muted",
      )}
      onClick={onClick}
      title={title}
      aria-label={title}
    >
      {children}
    </Button>
  );
}

/** Exibe conteúdo HTML das anotações de forma segura (uso interno: conteúdo do editor). */
export function RichTextContent({ html, className }: { html: string; className?: string }) {
  if (!html?.trim()) {
    return <p className={cn("text-muted-foreground text-sm", className)}>Nenhuma anotação registrada.</p>;
  }
  return (
    <div
      className={cn(
        "prose prose-sm dark:prose-invert max-w-none text-foreground",
        "prose-p:my-1 prose-ul:my-1 prose-ol:my-1 prose-table:my-2",
        "prose-table:border-collapse prose-td:border prose-th:border prose-td:px-2 prose-th:px-2 prose-td:py-1 prose-th:py-1 prose-th:bg-muted",
        "prose-blockquote:border-l-primary prose-blockquote:pl-3 prose-code:bg-muted prose-code:px-1 prose-code:rounded prose-code:before:content-none prose-code:after:content-none",
        "prose-a:text-primary prose-a:underline",
        className,
      )}
      dangerouslySetInnerHTML={{ __html: html }}
    />
  );
}
