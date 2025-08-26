import emailjs from '@emailjs/browser';

const sendEmail = async (templateParams: any) => {
emailjs
  .send('service_cbw5dou', 'template_n1jjg7t', templateParams, {
    publicKey: process.env.EMAILJS_PUBLIC_KEY,
  })
  .then(
    (response) => {
      console.log('SUCCESS!', response.status, response.text);
    },
    (err) => {
        console.log('FAILED...', err);
      },
    );
};

export default sendEmail;