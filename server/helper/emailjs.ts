import emailjs from '@emailjs/browser';
import { EmailTemplateParams, FighterInvitationTemplateParams, EmailResponse } from '../../shared/types';

const sendEmail = async (templateParams: EmailTemplateParams): Promise<EmailResponse> => {
  try {
    const response = await emailjs.send(
      'service_cbw5dou', 
      'template_n1jjg7t', 
      templateParams, 
      {
        publicKey: process.env.EMAILJS_PUBLIC_KEY,
      }
    );
    
    console.log('SUCCESS!', response.status, response.text);
    return response;
  } catch (err) {
    console.log('FAILED...', err);
    throw err;
  }
};

// Specific function for fighter invitations
export const sendFighterInvitationEmail = async (
  params: FighterInvitationTemplateParams
): Promise<EmailResponse> => {
  const templateParams: EmailTemplateParams = {
    name: params.fighterName || 'Fighter',
    email: params.email,
    link: params.link,
  };

  return sendEmail(templateParams);
};

export default sendEmail;