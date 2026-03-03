/**
 * Integração WhatsApp via Twilio API.
 * Para ativar: configure TWILIO_ACCOUNT_SID, TWILIO_AUTH_TOKEN e TWILIO_WHATSAPP_FROM no .env
 *
 * Sandbox: https://www.twilio.com/docs/whatsapp/sandbox
 * Produção: https://www.twilio.com/docs/whatsapp
 */

/** Formata telefone BR para formato WhatsApp API: +5511999999999 */
export function formatPhoneForWhatsAppApi(phone: string | null | undefined): string | null {
  if (!phone) return null;
  const cleaned = phone.replace(/\D/g, "");
  if (cleaned.length < 10) return null;
  const withCountry = cleaned.startsWith("55") ? cleaned : `55${cleaned}`;
  return `whatsapp:+${withCountry}`;
}

export type SendWhatsAppResult =
  | { success: true; messageId: string }
  | { success: false; error: string };

export async function sendWhatsAppMessage(
  to: string,
  body: string,
): Promise<SendWhatsAppResult> {
  const accountSid = process.env.TWILIO_ACCOUNT_SID;
  const authToken = process.env.TWILIO_AUTH_TOKEN;
  const from = process.env.TWILIO_WHATSAPP_FROM; // ex: whatsapp:+14155238886 (sandbox)

  if (!accountSid || !authToken || !from) {
    return {
      success: false,
      error: "WhatsApp não configurado. Adicione TWILIO_ACCOUNT_SID, TWILIO_AUTH_TOKEN e TWILIO_WHATSAPP_FROM no .env",
    };
  }

  const toFormatted = formatPhoneForWhatsAppApi(to);
  if (!toFormatted) {
    return { success: false, error: "Número de telefone inválido." };
  }

  try {
    const twilio = (await import("twilio")).default;
    const client = twilio(accountSid, authToken);

    const message = await client.messages.create({
      from,
      to: toFormatted,
      body,
    });

    return { success: true, messageId: message.sid };
  } catch (err: unknown) {
    let error = "Erro ao enviar mensagem.";
    if (err && typeof err === "object") {
      const twilioErr = err as { message?: string; code?: number; moreInfo?: string };
      error = twilioErr.message ?? error;
      if (twilioErr.code) error = `[${twilioErr.code}] ${error}`;
    } else if (err instanceof Error) {
      error = err.message;
    }
    if (
      (typeof error === "string" && error.includes("63016")) ||
      (typeof error === "string" && error.toLowerCase().includes("sandbox"))
    ) {
      error +=
        " O número do paciente precisa enviar 'join [código]' ao sandbox. O 'join' deve ser enviado pelo WhatsApp do paciente, não pelo seu.";
    }
    console.error("[WhatsApp Twilio]", error, { to: toFormatted });
    return { success: false, error };
  }
}
