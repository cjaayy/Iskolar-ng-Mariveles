import nodemailer from "nodemailer";

const transporter = nodemailer.createTransport({
  service: "gmail",
  auth: {
    user: process.env.GMAIL_USER,
    pass: process.env.GMAIL_APP_PASSWORD,
  },
});

export async function sendCredentialsEmail(
  to: string,
  fullName: string,
  credentials: { email: string; password: string },
) {
  const html = `
    <div style="font-family: 'Segoe UI', Arial, sans-serif; max-width: 520px; margin: 0 auto; background: #ffffff; border-radius: 16px; overflow: hidden; border: 1px solid #e5e7eb;">
      <div style="background: linear-gradient(135deg, #16a34a, #15803d); padding: 32px 24px; text-align: center;">
        <h1 style="color: #ffffff; margin: 0; font-size: 22px; font-weight: 700;">Iskolar ng Mariveles</h1>
        <p style="color: #bbf7d0; margin: 8px 0 0; font-size: 13px;">Scholarship System</p>
      </div>
      <div style="padding: 32px 24px;">
        <p style="color: #374151; font-size: 15px; margin: 0 0 8px;">Kumusta, <strong>${fullName}</strong>!</p>
        <p style="color: #6b7280; font-size: 14px; margin: 0 0 24px;">
          Your account has been successfully created. Below are your login credentials.
        </p>
        <div style="background: #f9fafb; border: 1px solid #e5e7eb; border-radius: 12px; padding: 20px; margin-bottom: 24px;">
          <table style="width: 100%; border-collapse: collapse;">
            <tr>
              <td style="color: #6b7280; font-size: 12px; padding-bottom: 4px;">Email (Username)</td>
            </tr>
            <tr>
              <td style="color: #111827; font-size: 15px; font-weight: 600; font-family: monospace; padding-bottom: 16px; word-break: break-all;">${credentials.email}</td>
            </tr>
            <tr>
              <td style="color: #6b7280; font-size: 12px; padding-bottom: 4px;">Password</td>
            </tr>
            <tr>
              <td style="color: #111827; font-size: 15px; font-weight: 600; font-family: monospace;">${credentials.password}</td>
            </tr>
          </table>
        </div>
        <p style="color: #6b7280; font-size: 13px; margin: 0 0 16px;">
          You can change your password after logging in. Please keep these credentials safe and do not share them with anyone.
        </p>
        <hr style="border: none; border-top: 1px solid #e5e7eb; margin: 24px 0;" />
        <p style="color: #9ca3af; font-size: 11px; margin: 0; text-align: center;">
          This is an automated message from Iskolar ng Mariveles. Please do not reply.
        </p>
      </div>
    </div>
  `;

  await transporter.sendMail({
    from: `"Iskolar ng Mariveles" <${process.env.GMAIL_USER}>`,
    to,
    subject: "Your Iskolar ng Mariveles Account Credentials",
    html,
  });
}
