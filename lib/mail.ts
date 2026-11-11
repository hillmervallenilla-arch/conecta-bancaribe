import nodemailer from "nodemailer";

export type MailConfig = {
  host: string; port: number; secure: boolean; user: string; pass: string;
  fromName: string; fromAddress: string; recipient: string;
};

export function getMailConfig(): MailConfig {
  const cfg: MailConfig = {
    host: process.env.SMTP_HOST || "smtp.gmail.com",
    port: Number(process.env.SMTP_PORT || 587),
    secure: String(process.env.SMTP_SECURE || "false").toLowerCase() === "true",
    user: process.env.SMTP_USER || "",
    pass: process.env.SMTP_PASSWORD || "",
    fromName: process.env.MAIL_FROM_NAME || "Conecta Bancaribe",
    fromAddress: process.env.MAIL_FROM_ADDRESS || process.env.SMTP_USER || "",
    recipient: process.env.BRM_NOTIFICATION_RECIPIENT || "hvallenilla@bancaribe.com.ve",
  };
  const missing = [!cfg.host&&"SMTP_HOST", !cfg.user&&"SMTP_USER", !cfg.pass&&"SMTP_PASSWORD", !cfg.fromAddress&&"MAIL_FROM_ADDRESS", !cfg.recipient&&"BRM_NOTIFICATION_RECIPIENT"].filter(Boolean);
  if (missing.length) throw new Error(`Configuración SMTP incompleta: ${missing.join(", ")}`);
  return cfg;
}

export function createMailTransport(cfg=getMailConfig()) {
  return nodemailer.createTransport({host:cfg.host, port:cfg.port, secure:cfg.secure, auth:{user:cfg.user, pass:cfg.pass}});
}

export async function verifyMailConnection() {
  const cfg=getMailConfig(); const transport=createMailTransport(cfg); await transport.verify(); return {cfg,transport};
}
