require('dotenv').config()
const sessionSecret = process.env.SESSION_SECRET_KEY;

const emailUser= process.env.EMAIL_ADDRESS;
const emailPassword = process.env.EMAIL_PASSWORD;

module.exports = {
  sessionSecret,
  emailUser,
  emailPassword
};