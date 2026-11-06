import { createTransport } from "nodemailer";

const sendMail = (data) => {
  try {
    const transporter = createTransport({
      host: "smtp-relay.brevo.com",
      port: 587,
      auth: {
        user: process.env.BREVO_AUTH,
        pass: process.env.SMTP_KEY,
      },
    });

    const mailOptions = {
      from: process.env.BREVO_EMAIL,
      to: data.email,
      subject: "R2D2 - Bybit",
      text: data.message,
    };

    transporter.sendMail(mailOptions, function (error, info) {
      if (error) {
        console.log(error);
      }
    });
  } catch (e) {
    console.log(e.message);
  }
};

export default sendMail;
