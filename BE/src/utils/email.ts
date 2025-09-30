import nodemailer from "nodemailer";
import { config } from "../../config";
import handlebars from "handlebars";
import fs from "fs";
import path from "path";

interface EmailPayload {
  to: string;
  subject: string;
  template: string;
  context: Record<string, any>;
}

const transporter = nodemailer.createTransport({
  host: config.email.host,
  port: config.email.port,
  secure: config.email.secure,
  auth: {
    user: config.email.user,
    pass: config.email.password,
  },
});

const loadTemplate = (templateName: string) => {
  const templatePath = path.join(
    __dirname,
    "../../templates/email",
    `${templateName}.hbs`
  );
  const template = fs.readFileSync(templatePath, "utf-8");
  return handlebars.compile(template);
};

export const sendEmail = async (payload: EmailPayload) => {
  try {
    const template = loadTemplate(payload.template);
    const html = template(payload.context);

    const info = await transporter.sendMail({
      from: `"${config.email.senderName}" <${config.email.user}>`,
      to: payload.to,
      subject: payload.subject,
      html,
    });

    return {
      messageId: info.messageId,
      accepted: info.accepted,
      rejected: info.rejected,
    };
  } catch (error) {
    console.error("Email sending error:", error);
    throw error;
  }
};
