import emailjs from '@emailjs/nodejs';
import { EmailTemplateParams, EmailResponse } from '../../shared/types';

const sendEmail = async (templateParams: EmailTemplateParams): Promise<EmailResponse> => {
  try {
    const response = await emailjs.send(
      'service_cbw5dou', 
      'template_n1jjg7t', 
      templateParams, 
      {
        publicKey: process.env.EMAILJS_PUBLIC_KEY,
        privateKey: process.env.EMAILJS_PRIVATE_KEY,
      }
    );
    
    console.log('SUCCESS!', response.status, response.text);
    return response;
  } catch (err) {
    console.log('FAILED...', err);
    throw err;
  }
};

export default sendEmail;