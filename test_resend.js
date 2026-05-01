const { Resend } = require('resend');
require('dotenv').config();

const resend = new Resend(process.env.RESEND_API_KEY);

(async function() {
  console.log("Testing Resend Key:", process.env.RESEND_API_KEY ? process.env.RESEND_API_KEY.substring(0, 7) + "..." : "MISSING");
  try {
    const { data, error } = await resend.emails.send({
      from: 'onboarding@resend.dev',
      to: 'delivered@resend.dev', // Resend's test recipient
      subject: 'ElectroHub System Test',
      html: '<p>Resend integration is active.</p>'
    });
    if (error) {
        console.error("Resend Error Object:", error);
    } else {
        console.log("Success! Email sent. ID:", data.id);
    }
  } catch (error) {
    console.error("Execution Error:", error.message);
  } finally {
    process.exit();
  }
})();
