import { Resend } from "resend";

const resend = process.env.RESEND_API_KEY
  ? new Resend(process.env.RESEND_API_KEY)
  : null;

const FROM_EMAIL =
  process.env.RESEND_FROM_EMAIL ?? "Doutor Agenda <onboarding@resend.dev>";

export async function sendPasswordResetEmail(params: {
  to: string;
  subject: string;
  html: string;
  text?: string;
}) {
  if (!resend) {
    console.warn(
      "[sendPasswordResetEmail] RESEND_API_KEY não configurado. Email não enviado.",
      { to: params.to },
    );
    return;
  }

  const { error } = await resend.emails.send({
    from: FROM_EMAIL,
    to: params.to,
    subject: params.subject,
    html: params.html,
    text: params.text,
  });

  if (error) {
    throw new Error(`Falha ao enviar email: ${error.message}`);
  }
}
