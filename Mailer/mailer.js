// Current GMAIL account found in the .env file is inactive so will not work

const nodemailer = require("nodemailer");
const fs = require('fs');
const { log } = require("console");

require('dotenv').config();

const transporter = nodemailer.createTransport({
    host: "smtp.gmail.com",
    port: 465,
    secure: true,
    auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_APP_PASSWORD
    },
});

const sampleEmailContent = "<p>Test paragraph</p>"

function sendEmail(recipient, subject, content) {
    const htmlContent = fs.readFileSync('./Mailer/emailTemplate.html', 'utf8').replace('#content', content);
    const mailOptions = {
        from: 'Team Harmony',
        to: recipient,
        subject: subject,
        html: htmlContent,
        attachments: [{
            filename: 'Logo.png',
            path: './Mailer/img/Logo.png',
            cid: 'logo'
        }]
    };


    transporter.sendMail(mailOptions, (error, info) => {
        if (error) {
            console.error("Error sending email: ", error);
        } else {
            console.log("Email sent: ", info.response);
        }
    });
}

function sendSMS(phoneNumber, carrier, text) {
    const carrierMailSuffix = {
        ATT: 'txt.att.net',
        TMO: 'tmomail.net',
        VZW: 'vtext.com',
        METRO: 'mymetropcs.com'
    }
    let recipient = `${phoneNumber}@${carrierMailSuffix[carrier]}`
    console.log(recipient);
    const mailOptions = {
        from: 'Team Harmony',
        // subject: 'Account',
        to: recipient,
        text: text,
    };
    transporter.sendMail(mailOptions, (error, info) => {
        if (error) {
            console.error("Error sending email: ", error);
        } else {
            console.log("SMS sent: ", info.response);
        }
    });
}

sendEmail('joshluca98@gmail.com', 'Sample Email 2-22', sampleEmailContent)
sendSMS(2093289356, 'VZW', 'Sample SMS')

module.exports = { sendEmail, sendSMS };