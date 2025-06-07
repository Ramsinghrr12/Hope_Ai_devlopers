require('dotenv').config();
const twilio = require('twilio');

// Initialize Twilio client
const client = twilio(
    process.env.TWILIO_ACCOUNT_SID,
    process.env.TWILIO_AUTH_TOKEN
);

// Get Verify Service SID from environment variables
const verifyService = process.env.TWILIO_VERIFY_SID;

// Validate Twilio configuration
if (!process.env.TWILIO_ACCOUNT_SID || !process.env.TWILIO_AUTH_TOKEN || !verifyService) {
    console.error('❌ Missing Twilio configuration. Please check your .env file.');
    console.error('Required environment variables:');
    console.error('- TWILIO_ACCOUNT_SID');
    console.error('- TWILIO_AUTH_TOKEN');
    console.error('- TWILIO_VERIFY_SID');
    process.exit(1);
}

const sendOTP = async (phoneNumber, countryCode) => {
    try {
        const fullNumber = `+${countryCode}${phoneNumber}`;
        console.log('Sending OTP to:', fullNumber);
        
        const verification = await client.verify.v2.services(verifyService)
            .verifications
            .create({
                to: fullNumber,
                channel: 'sms'
            });

        console.log('OTP sent successfully:', verification.status);
        return {
            success: true,
            status: verification.status
        };
    } catch (error) {
        console.error('Failed to send OTP:', error);
        return {
            success: false,
            error: error.message || 'Failed to send OTP'
        };
    }
};

const verifyOTP = async (phoneNumber, countryCode, code) => {
    try {
        const fullNumber = `+${countryCode}${phoneNumber}`;
        console.log('Verifying OTP for:', fullNumber);
        
        const verificationCheck = await client.verify.v2.services(verifyService)
            .verificationChecks
            .create({
                to: fullNumber,
                code: code
            });

        console.log('OTP verification status:', verificationCheck.status);
        return {
            success: verificationCheck.status === 'approved',
            status: verificationCheck.status
        };
    } catch (error) {
        console.error('Failed to verify OTP:', error);
        return {
            success: false,
            error: error.message || 'Failed to verify OTP'
        };
    }
};

module.exports = {
    sendOTP,
    verifyOTP
};