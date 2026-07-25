// Sends the phone-verification code by SMS.
//
// No SMS provider is wired up by default — plugging in a real one (Twilio,
// Vonage, AWS SNS, etc.) just means filling in `sendViaProvider` below with
// that provider's SDK/API call, using credentials from environment
// variables (the same way SMTP_* is used in mailer.js).
//
// Until then, this falls back to logging the code to the server console so
// phone verification is still testable in development.

const isConfigured = () =>
  !!(process.env.SMS_PROVIDER && process.env.SMS_API_KEY);

const sendViaProvider = async (toPhoneE164, code) => {
  // Example shape for a Twilio-style integration:
  //
  //   const twilio = require("twilio")(process.env.SMS_API_KEY, process.env.SMS_API_SECRET);
  //   await twilio.messages.create({
  //     to: toPhoneE164,
  //     from: process.env.SMS_FROM_NUMBER,
  //     body: `Your verification code is ${code}. It expires in 10 minutes.`,
  //   });
  //
  // Left unimplemented until a provider + credentials are chosen.
  throw new Error("No SMS provider implementation configured");
};

const sendVerificationSMS = async (toPhoneE164, code) => {
  if (!isConfigured()) {
    if (process.env.NODE_ENV === "production") {
      console.error(`[sms] No SMS provider configured — verification SMS to ${toPhoneE164} was NOT sent.`);
    } else {
      console.log(`\n[sms] No SMS provider configured — verification code for ${toPhoneE164}:`);
      console.log(`[sms] ${code}\n`);
    }
    return;
  }

  try {
    await sendViaProvider(toPhoneE164, code);
  } catch (err) {
    console.error("[sms] Failed to send verification SMS:", err.message);
    if (process.env.NODE_ENV !== "production") {
      // Dev-friendly fallback so testing isn't blocked by a misconfigured provider
      console.log(`[sms] Verification code for ${toPhoneE164}: ${code}`);
    }
  }
};

module.exports = { sendVerificationSMS, isConfigured };
