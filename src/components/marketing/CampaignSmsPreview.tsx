interface Props {
  senderName: string;
  message: string;
  isWhatsApp?: boolean;
}

export default function CampaignSmsPreview({ senderName, message, isWhatsApp }: Props) {
  return (
    <div className="sticky top-24">
      <div className="bg-card rounded-2xl border border-border shadow-lg overflow-hidden max-w-[380px] mx-auto">
        {/* Header */}
        <div className={`px-5 py-4 text-center ${isWhatsApp ? "bg-[#075E54]" : "bg-muted"}`}>
          <p className={`text-sm font-medium ${isWhatsApp ? "text-white" : "text-muted-foreground"}`}>
            {senderName}
          </p>
        </div>

        {/* Chat area */}
        <div className={`px-4 py-6 min-h-[250px] ${isWhatsApp ? "bg-[#ECE5DD]" : "bg-blue-50/30"}`}>
          {message ? (
            <div
              className={`inline-block max-w-[85%] rounded-xl px-4 py-3 text-sm ${
                isWhatsApp
                  ? "bg-white text-foreground rounded-tl-none shadow-sm"
                  : "bg-primary text-primary-foreground rounded-br-none"
              }`}
            >
              <p className="whitespace-pre-wrap">{message}</p>
            </div>
          ) : (
            <div
              className={`inline-block max-w-[85%] rounded-xl px-4 py-3 text-sm opacity-50 ${
                isWhatsApp
                  ? "bg-white text-muted-foreground rounded-tl-none"
                  : "bg-primary text-primary-foreground rounded-br-none"
              }`}
            >
              A sua mensagem...
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
