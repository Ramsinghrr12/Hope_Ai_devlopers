require('dotenv').config();
const twilio = require('twilio');

const client = twilio(
    process.env.TWILIO_ACCOUNT_SID,
    process.env.TWILIO_AUTH_TOKEN
);

const verifyService = process.env.TWILIO_VERIFY_SID;

const sendOTP = async (phoneNumber, countryCode) => {
    try {
        const fullNumber = `+${countryCode}${phoneNumber}`;
        const verification = await client.verify.v2.services(verifyService)
            .verifications
            .create({
                to: fullNumber,
                channel: 'sms'
            });
        return {
            success: true,
            status: verification.status
        };
    } catch (error) {
        console.error('Failed to send OTP:', error);
        return {
            success: false,
            error: error.message
        };
    }
};

const verifyOTP = async (phoneNumber, countryCode, code) => {
    try {
        const fullNumber = `+${countryCode}${phoneNumber}`;
        const verificationCheck = await client.verify.v2.services(verifyService)
            .verificationChecks
            .create({
                to: fullNumber,
                code: code
            });
        return {
            success: verificationCheck.status === 'approved',
            status: verificationCheck.status
        };
    } catch (error) {
        console.error('Failed to verify OTP:', error);
        return {
            success: false,
            error: error.message
        };
    }
};

module.exports = {
    sendOTP,
    verifyOTP
};