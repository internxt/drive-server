import sendgrid from '@sendgrid/mail';

export class MailerService {
  constructor() {
    const sendgridApiKey = process.env.SENDGRID_API_KEY || '';
    sendgrid.setApiKey(sendgridApiKey);
  }

  async send(email: string, templateId: string, context: any) {
    const msg = {
      to: email,
      from: {
        email: process.env.SENDGRID_FROM || 'hello@internxt.com',
        name: process.env.SENDGRID_NAME || 'Internxt',
      },
      subject: '',
      text: 'test',
      html: 'test',
      personalizations: [
        {
          to: [
            {
              email,
            },
          ],
          dynamic_template_data: context,
        },
      ],
      template_id: templateId,
    };
    await sendgrid.send(msg);
  }
}
