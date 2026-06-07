interface Props {
  subject: string;
  senderName: string;
  title: string;
  body: string;
  showImage: boolean;
  imageUrl: string;
  ctaText: string;
  ctaUrl: string;
}

export default function CampaignEmailPreview({
  subject,
  senderName,
  title,
  body,
  showImage,
  imageUrl,
  ctaText,
  ctaUrl,
}: Props) {
  return (
    <div>
      {/* Phone frame */}
      <div className="bg-card rounded-2xl border border-border shadow-lg overflow-hidden max-w-[380px] mx-auto">
        {/* Status bar */}
        <div className="flex items-center justify-center gap-1.5 py-2">
          <div className="w-16 h-1 rounded-full bg-primary/40" />
          <div className="w-1.5 h-1.5 rounded-full bg-primary/40" />
        </div>

        {/* Email header */}
        <div className="px-5 py-3 space-y-0.5 border-b border-border">
          <p className="text-xs text-muted-foreground">
            <span className="font-medium text-foreground">Assunto</span>{" "}
            {subject || "Sem assunto"}
          </p>
          <p className="text-xs text-muted-foreground">
            <span className="font-medium text-foreground">De</span>{" "}
            {senderName}
          </p>
        </div>

        {/* Email body */}
        <div className="px-5 pb-6 pt-4 space-y-4">
          {showImage && (
            <div className="rounded-lg overflow-hidden bg-muted aspect-[2/1]">
              {imageUrl ? (
                <img src={imageUrl} alt="" className="w-full h-full object-cover" />
              ) : (
                <div className="w-full h-full bg-gradient-to-br from-muted to-muted-foreground/10 flex items-center justify-center">
                  <span className="text-xs text-muted-foreground">Imagem de cabeçalho</span>
                </div>
              )}
            </div>
          )}

          {/* Render HTML content */}
          {body ? (
            <div
              className="text-xs text-muted-foreground prose prose-sm max-w-none prose-p:my-1 prose-h2:text-sm prose-h2:font-semibold prose-h2:text-foreground prose-h3:text-xs prose-h3:font-semibold prose-h3:text-foreground prose-ul:my-1 prose-ol:my-1 prose-li:my-0.5"
              dangerouslySetInnerHTML={{ __html: body }}
            />
          ) : (
            <p className="text-center text-xs text-muted-foreground/50 italic">
              O conteúdo do e-mail aparecerá aqui...
            </p>
          )}

          {ctaText && (
            <div className="flex justify-center pt-2">
              <span className="inline-block px-5 py-2 text-xs font-medium bg-primary text-primary-foreground rounded">
                {ctaText}
              </span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
