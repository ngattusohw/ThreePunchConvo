import emailjs from "@emailjs/nodejs";
import { EmailTemplateParams, EmailResponse } from "../../shared/types";

const sendEmail = async (
  templateParams: EmailTemplateParams,
): Promise<EmailResponse> => {
  try {
    const response = await emailjs.send(
      "service_k9zgbxi",
      "template_ugkn49h",
      templateParams,
      {
        publicKey: process.env.EMAILJS_PUBLIC_KEY,
        privateKey: process.env.EMAILJS_PRIVATE_KEY,
      },
    );

    console.log("SUCCESS!", response.status, response.text);
    return response;
  } catch (err) {
    console.log("FAILED...", err);
    throw err;
  }
};

export default sendEmail;
