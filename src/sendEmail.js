const nodemailer = require("nodemailer");
const { Logger } = require("./logger");
const config = require("./config")

class sendFeed {
  constructor() {
    this.logger = new Logger("Email");
    this.transporter = nodemailer.createTransport({
      service: config.service,
      auth: {
        user: config.user,
        pass: config.pass,
      },
    });
    this.logger.info("Email service initialized");
  }

  async sendFeedback(name, email, waNum, message) {
    try {
      this.logger.info(`Sending feedback from ${name}`);

      const mailOptions = {
        from: `"API Feedback" <${config.user}>`,
        to: config.user,
        subject: `New Feedback from ${name}`,
        html: `
          <h2>New Feedback Received</h2>
          <p><strong>Name:</strong> ${name}</p>
          <p><strong>Email:</strong> ${email}</p>
          <p><strong>Whatsapp: </strong> ${waNum}</p>
          <p><strong>Message:</strong></p>
          <hr>
          <p>${message}</p>
          <hr>
          <small>Sent from your API at ${new Date().toString()}</small>
        `,
      };

      await this.transporter.sendMail(mailOptions);
      this.logger.success(`Feedback email sent from ${name}`);
      return true;
      
    } catch (error) {
      this.logger.error("Failed to send feedback email", error);
      throw error;
    }
  }
}

module.exports = { sendFeed };
