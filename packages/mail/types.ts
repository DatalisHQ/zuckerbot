export type SendEmailParams = {
  to: string;
  subject: string;
  text: string;
  html?: string;
};

export type SendEmailHandler = (params: SendEmailParams) => Promise<void>;

// eslint-disable-next-line @typescript-eslint/consistent-type-definitions
export interface MailProvider {
  send: SendEmailHandler;
}
