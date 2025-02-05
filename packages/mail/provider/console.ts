import { logger } from "logs";
import type { SendEmailHandler } from "../types";

export const send: SendEmailHandler = async ({ to, subject, text, html }) => {
  let formattedOutput = `Sending email to ${to} with subject ${subject}\n\n`;

  formattedOutput += `Text: ${text}\n\n`;
  formattedOutput += `HTML: ${html}\n\n`;

  logger.debug(formattedOutput);
};
