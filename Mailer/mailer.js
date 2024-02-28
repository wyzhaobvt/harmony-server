require('dotenv').config();
const fs = require('fs');
const sgMail = require('@sendgrid/mail')
sgMail.setApiKey(process.env.SENDGRID_API_KEY)

function sendEmail(recipient, subject, content) {
    const htmlContent = fs.readFileSync('./Mailer/emailTemplate.html', 'utf8').replace('#content', content);
    const logo = fs.readFileSync('./Mailer/img/logo.png').toString("base64");
    const email = {
        to: recipient, 
        from: 'harmonyapp2024@gmail.com',
        subject: subject,
        html: htmlContent,
        attachments: [
            {
            filename: 'logo.png',
            contentType: 'image/png',
            content_id: 'logo',
            content: logo,
            disposition: 'inline',
            }
        ],
      }
      sgMail
      .send(email)
      .then(() => {
        console.log('Email sent')
      })
      .catch((error) => {
        console.error(error.response.body)
      })
}
const sampleEmailContent = "<p>Test paragraph</p>"
sendEmail('joshluca98@gmail.com', 'test', sampleEmailContent)
  
    
function sendSMS(phoneNumber, carrier, subject, text) {
    const carrierMailSuffix = {
        ATT: 'txt.att.net',
        TMO: 'tmomail.net',
        VZW: 'vtext.com',
        METRO: 'mymetropcs.com'
    }
    let recipient = `${phoneNumber}@${carrierMailSuffix[carrier]}`
    console.log(recipient);
    const email = {
        to: recipient, 
        from: 'harmonyapp2024@gmail.com',
        subject: subject,
        text: text,
      }
      sgMail
      .send(email)
      .then(() => {
        console.log('Email sent')
      })
      .catch((error) => {
        console.error(error.response.body)
      })
}
// sendSMS("2093289356", 'VZW', 'Sample Subject', 'Sample SMS')

module.exports = { sendEmail, sendSMS }