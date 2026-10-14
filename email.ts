import Mailjet from 'node-mailjet';

const mailjet = new Mailjet({
    apiKey: process.env.MJ_APIKEY_PUBLIC,
    apiSecret: process.env.MJ_APIKEY_PRIVATE
});

export async function sendPasswordResetEmail(to: string, name: string, token: string) {
    const html = `<!DOCTYPE html><html><head><meta charset="UTF-8"><style>body{font-family:Arial,sans-serif;background:#f4f4f4;margin:0;padding:0}.container{max-width:600px;margin:40px auto;background:#ffffff;padding:40px;border-radius:8px}.header{text-align:center;padding-bottom:20px;border-bottom:2px solid #f0f0f0}.header h1{color:#333;font-size:24px}.content{padding:30px 0;color:#555;line-height:1.6}.token-container{text-align:center;margin:30px 0}.token-box{display:inline-block;background:#f9f9f9;border:2px dashed #ff9800;padding:20px 30px;border-radius:8px;font-size:24px;font-weight:bold;color:#333;letter-spacing:3px;font-family:'Courier New',monospace}.expiry-note{background:#f9f9f9;padding:12px;border-radius:4px;font-size:14px;color:#666;text-align:center}.footer{text-align:center;padding-top:20px;border-top:2px solid #f0f0f0;color:#999;font-size:12px}.brand{color:#ff9800;font-weight:bold}</style></head><body><div class="container"><div class="header"><h1>🔐 GIKonnect Password Reset</h1></div><div class="content"><p>Hello,</p><p>We received a request to reset your GIKonnect account password. Use the verification token below in the app to create a new password:</p><div class="token-container"><div class="token-box">${token}</div></div><div class="expiry-note">⏰ This password reset token will expire in <strong>30 minutes</strong>.</div><p>If you did not request this password reset, you can safely ignore this email. Your account remains secure.</p></div><div class="footer"><p>© ${new Date().getFullYear()} <span class="brand">GIKonnect</span>. All rights reserved.</p></div></div></body></html>`;
    return await sendEmail(to, "Password Reset - GIKonnect", html, name);
}

export async function sendAccountVerificationEmail(to: string, name: string, token: string) {
    const html = `<!DOCTYPE html><html lang="en"><head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>Verify your account</title></head><body style="margin:0;padding:0;background-color:#f4f5f7;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,Arial,sans-serif;color:#1f2937;"><table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="background-color:#f4f5f7;padding:40px 16px;"><tr><td align="center"><table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="max-width:560px;background-color:#ffffff;border-radius:12px;box-shadow:0 1px 3px rgba(0,0,0,0.06),0 8px 24px rgba(0,0,0,0.04);overflow:hidden;"><tr><td style="padding:40px 40px 8px 40px;text-align:center;"><div style="display:inline-block;width:56px;height:56px;border-radius:50%;background-color:#eef2ff;"><svg width="56" height="56" viewBox="0 0 56 56" fill="none"xmlns="http://www.w3.org/2000/svg"><path d="M18 28.5L25 35.5L38 21.5" stroke="#4f46e5" stroke-width="3.5"stroke-linecap="round" stroke-linejoin="round" /></svg></div><h1 style="margin:24px 0 8px 0;font-size:22px;font-weight:600;color:#111827;letter-spacing:-0.01em;">Verify your email address</h1><p style="margin:0;font-size:15px;line-height:24px;color:#6b7280;">Thanks for signing up!Please confirm your email address by clicking the button below to activate your account.</p></td></tr><tr><td style="padding:24px 40px 8px 40px;text-align:center;"><a href="http://localhost:3000/api/v1/auth/verify?token=${token}" style="display:inline-block;padding:14px 32px;background-color:#4f46e5;color:#ffffff;font-size:15px;font-weight:600;text-decoration:none;border-radius:8px;letter-spacing:0.01em;">VerifyAccount</a></td></tr><tr><td style="padding:32px 40px 40px 40px;"><hr style="border:none;border-top:1px solid #e5e7eb;margin:0 0 20px 0;"><p style="margin:0;font-size:12px;line-height:18px;color:#9ca3af;text-align:center;">If youdidn't create an account, you can safely ignore this email.</p></td></tr></table><p style="margin:24px 0 0 0;font-size:12px;color:#9ca3af;">© ${new Date().getFullYear()} GIKonnect. All rights reserved.</p></td></tr></table></body></html>`;
    return await sendEmail(to, "Account Verification - GIKonnect", html, name);
}

async function sendEmail(to: string, subject: string, html: string, name: string) {
    const result = await mailjet.post("send", { 
        version: "v3.1" 
    }).request({
        Messages: [{
        From: {
            Email: process.env.EMAIL_USER!,
            Name: "Admin - GIKonnect"
        },
        To: [{
            Email: to,
            Name: name
        }],
        Subject: subject,
        HTMLPart: html
        }]
    });

    const message = (result.body as any).Messages?.[0];

    if (message?.Status !== "success") 
        throw new Error(`Mailjet send failed: ${JSON.stringify(message?.Errors)}`);

    return message;
}
