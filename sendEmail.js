
import nodemailer from 'nodemailer';

const transporter = nodemailer.createTransport({
  service: 'Gmail',
  host: 'smtp.gmail.com',
  port: 465,
  secure: true,
  auth: {
    user: 'ya.moroz.yaroslav@gmail.com',
    pass: process.env.GMAIL_KEY,
  },
});

export const sendEmail = async (req, res) => {
  try {
    const { user_name, user_email, user_phone, items } = req.body;

    if (!user_name || !user_email || !user_phone) {
      return res.status(400).json({ message: 'Missing required fields.' });
    }

    const mailOptions = {
      from: user_email,

      to: 'yaroslav.moroz.a@gmail.com', // your main inbox

      subject: 'New Contact Form Submission',
      text: `
📨 Contact Form Submission:

👤 Name: ${user_name}
📧 Email: ${user_email}
📞 Phone: ${user_phone}
📝 Message:
${items || '(No message provided)'}
      `,
    };

    transporter.sendMail(mailOptions, (error, info) => {
      if (error) {
        console.error('❌ Email send error:', error);
        return res.status(409).json({ message: error.message });
      }
      return res.status(200).json({ message: 'Email sent successfully.', info });
    });
  } catch (err) {
    console.error('🔥 Server error:', err);
    res.status(500).json({ message: 'Internal server error.' });
  }
};
