import { createTransport } from 'nodemailer';

const INVITATION_EXPIRY_HOURS = 24;

function escapeHtml(value: string): string {
  return value.replace(/[&<>"']/g, (character) => {
    const entities: Record<string, string> = {
      '&': '&amp;',
      '<': '&lt;',
      '>': '&gt;',
      '"': '&quot;',
      "'": '&#39;',
    };
    return entities[character];
  });
}

function getRequiredEnv(name: string): string {
  const value = process.env[name]?.trim();
  if (!value) {
    throw new Error(`${name} environment variable is required to send invitation emails.`);
  }
  return value;
}

function getAppUrl(): URL {
  const configuredUrl =
    process.env.APP_URL ||
    (process.env.NODE_ENV === 'production' ? '' : 'http://localhost:3000');

  if (!configuredUrl) {
    throw new Error('APP_URL environment variable is required in production to send invitation emails.');
  }

  let url: URL;
  try {
    url = new URL(configuredUrl);
  } catch {
    throw new Error('APP_URL must be a valid absolute URL.');
  }

  if (url.protocol !== 'http:' && url.protocol !== 'https:') {
    throw new Error('APP_URL must use HTTP or HTTPS.');
  }

  return url;
}

export async function sendInvitationEmail({
  email,
  name,
  workspaceName,
  token,
}: {
  email: string;
  name: string;
  workspaceName: string;
  token: string;
}): Promise<void> {
  const host = getRequiredEnv('SMTP_HOST');
  const port = Number(process.env.SMTP_PORT || 587);
  if (!Number.isInteger(port) || port < 1 || port > 65535) {
    throw new Error('SMTP_PORT must be a valid port number.');
  }

  const user = process.env.SMTP_USER?.trim();
  const pass = process.env.SMTP_PASSWORD;
  if (Boolean(user) !== Boolean(pass)) {
    throw new Error('Set both SMTP_USER and SMTP_PASSWORD, or leave both unset.');
  }

  const appUrl = getAppUrl();
  appUrl.pathname = '/accept-invite';
  appUrl.search = '';
  appUrl.hash = '';
  appUrl.searchParams.set('token', token);
  const invitationUrl = appUrl.toString();
  const safeName = escapeHtml(name);
  const safeWorkspaceName = escapeHtml(workspaceName);
  const safeInvitationUrl = escapeHtml(invitationUrl);

  const transport = createTransport({
    host,
    port,
    secure: process.env.SMTP_SECURE
      ? process.env.SMTP_SECURE.toLowerCase() === 'true'
      : port === 465,
    ...(user && pass ? { auth: { user, pass } } : {}),
  });

  await transport.sendMail({
    from: getRequiredEnv('SMTP_FROM'),
    to: email,
    subject: `You're invited to join ${workspaceName} on Qavon Desk`,
    text: [
      `Hi ${name},`,
      '',
      `You've been invited to join ${workspaceName} on Qavon Desk.`,
      'Set your password using this one-time invitation link:',
      invitationUrl,
      '',
      `This link expires in ${INVITATION_EXPIRY_HOURS} hours. If you weren't expecting this invitation, you can ignore this email.`,
    ].join('\n'),
    html: `<!doctype html>
<html lang="en">
  <head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1">
    <title>Qavon Desk invitation</title>
  </head>
  <body style="margin:0;padding:0;background-color:#FAF7F0;font-family:Arial,Helvetica,sans-serif;color:#181A1F;">
    <div style="display:none;font-size:1px;color:#FAF7F0;line-height:1px;max-height:0;max-width:0;opacity:0;overflow:hidden;">
      Set up your Qavon Desk account for ${safeWorkspaceName}.
    </div>
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="background-color:#FAF7F0;">
      <tr>
        <td align="center" style="padding:36px 16px;">
          <table role="presentation" width="600" cellpadding="0" cellspacing="0" border="0" style="width:100%;max-width:600px;">
            <tr>
              <td style="padding:0 0 18px;">
                <table role="presentation" cellpadding="0" cellspacing="0" border="0">
                  <tr>
                    <td align="center" valign="middle" width="42" height="42" style="width:42px;height:42px;background-color:#181A1F;border-radius:10px;color:#F0A818;font-size:22px;font-weight:bold;">Q</td>
                    <td style="padding-left:12px;">
                      <div style="font-size:17px;line-height:22px;font-weight:bold;color:#181A1F;">Qavon Desk</div>
                      <div style="font-size:12px;line-height:18px;color:#66625A;">B2B Sales &amp; Pipeline Workspace</div>
                    </td>
                  </tr>
                </table>
              </td>
            </tr>
            <tr>
              <td style="padding:32px;background-color:#FFFFFF;border:1px solid #EAE4D7;border-radius:14px;">
                <div style="margin:0 0 12px;color:#B47200;font-size:11px;line-height:16px;font-weight:bold;letter-spacing:1px;text-transform:uppercase;">Team invitation</div>
                <h1 style="margin:0 0 18px;color:#181A1F;font-size:26px;line-height:34px;font-weight:700;">You're invited</h1>
                <p style="margin:0 0 14px;color:#181A1F;font-size:15px;line-height:24px;">Hi ${safeName},</p>
                <p style="margin:0 0 24px;color:#66625A;font-size:15px;line-height:24px;">You've been invited to join <strong style="color:#181A1F;">${safeWorkspaceName}</strong> on Qavon Desk. Set a password to activate your account and get started with your team.</p>
                <table role="presentation" cellpadding="0" cellspacing="0" border="0" style="margin:0 0 22px;">
                  <tr>
                    <td align="center" bgcolor="#F0A818" style="border-radius:8px;">
                      <a href="${safeInvitationUrl}" style="display:inline-block;padding:13px 22px;color:#181A1F;font-size:14px;line-height:20px;font-weight:bold;text-decoration:none;border:1px solid #D9930C;border-radius:8px;">Set up my account</a>
                    </td>
                  </tr>
                </table>
                <p style="margin:0 0 8px;color:#66625A;font-size:12px;line-height:18px;">This secure link expires in ${INVITATION_EXPIRY_HOURS} hours and can only be used once.</p>
                <p style="margin:0;color:#66625A;font-size:12px;line-height:18px;">If the button doesn't work, copy and paste this link into your browser:</p>
                <p style="margin:8px 0 0;word-break:break-all;font-size:12px;line-height:18px;"><a href="${safeInvitationUrl}" style="color:#8A5A00;text-decoration:underline;">${safeInvitationUrl}</a></p>
              </td>
            </tr>
            <tr>
              <td align="center" style="padding:20px 12px 0;color:#817B70;font-size:11px;line-height:18px;">
                If you weren't expecting this invitation, you can safely ignore this email.<br>
                &copy; Qavon Desk
              </td>
            </tr>
          </table>
        </td>
      </tr>
    </table>
  </body>
</html>`,
  });
}

export function getInvitationExpiry(): Date {
  return new Date(Date.now() + INVITATION_EXPIRY_HOURS * 60 * 60 * 1000);
}
