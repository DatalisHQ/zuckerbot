import { useCompiler } from "#vue-email";
import { mailTemplates } from "mail/util/templates";
import { send } from "mail/provider";

export const sendEmail = async <TemplateId extends keyof typeof mailTemplates>({
  to,
  templateId,
  context,
}: {
  to: string;
  templateId: TemplateId;
  context?: any;
}) => {
  const templateData = mailTemplates[templateId];

  const template = await useCompiler(templateData.name, {
    props: context,
  });

  try {
    await send({
      to,
      subject: templateData.subject,
      text: template.text,
      html: template.html,
    });

    return true;
  } catch (error) {
    console.error(error);
    return false;
  }
};
