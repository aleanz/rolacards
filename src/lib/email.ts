import formData from 'form-data';
import Mailgun from 'mailgun.js';

const mailgun = new Mailgun(formData);
const mg = mailgun.client({
  username: 'api',
  key: process.env.MAILGUN_API_KEY || '',
  url: process.env.MAILGUN_BASE_URL || 'https://api.mailgun.net',
});

export async function sendVerificationEmail(email: string, token: string, name: string) {
  const verificationUrl = `${process.env.NEXTAUTH_URL}/auth/verify-email?token=${token}`;
  const domain = process.env.MAILGUN_DOMAIN || '';

  try {
    const result = await mg.messages.create(domain, {
      from: process.env.EMAIL_FROM || 'Rola Cards <noreply@sandbox.mailgun.org>',
      to: [email],
      subject: 'Verifica tu cuenta en Rola Cards',
      html: `
        <!DOCTYPE html>
        <html>
          <head>
            <meta charset="utf-8">
            <style>
              body {
                font-family: Arial, sans-serif;
                line-height: 1.6;
                color: #333;
                background-color: #f4f4f4;
                margin: 0;
                padding: 0;
              }
              .container {
                max-width: 600px;
                margin: 20px auto;
                background: #ffffff;
                border-radius: 8px;
                overflow: hidden;
                box-shadow: 0 2px 4px rgba(0,0,0,0.1);
              }
              .header {
                background: linear-gradient(135deg, #D4AF37 0%, #C5A028 100%);
                padding: 30px;
                text-align: center;
              }
              .header h1 {
                color: #ffffff;
                margin: 0;
                font-size: 28px;
              }
              .content {
                padding: 40px 30px;
              }
              .content h2 {
                color: #D4AF37;
                margin-top: 0;
              }
              .button {
                display: inline-block;
                padding: 14px 30px;
                background: #D4AF37;
                color: #ffffff !important;
                text-decoration: none;
                border-radius: 5px;
                font-weight: bold;
                margin: 20px 0;
              }
              .footer {
                background: #f8f8f8;
                padding: 20px;
                text-align: center;
                font-size: 12px;
                color: #666;
              }
              .divider {
                border-top: 1px solid #eee;
                margin: 20px 0;
              }
            </style>
          </head>
          <body>
            <div class="container">
              <div class="header">
                <h1>ROLA CARDS</h1>
              </div>
              <div class="content">
                <h2>¡Bienvenido, ${name}!</h2>
                <p>Gracias por registrarte en Rola Cards. Para completar tu registro y poder acceder a todas las funcionalidades, necesitamos que verifiques tu correo electrónico.</p>

                <p>Haz clic en el siguiente botón para verificar tu cuenta:</p>

                <div style="text-align: center;">
                  <a href="${verificationUrl}" class="button">Verificar mi cuenta</a>
                </div>

                <p>O copia y pega este enlace en tu navegador:</p>
                <p style="background: #f8f8f8; padding: 10px; border-radius: 4px; word-break: break-all; font-size: 12px;">
                  ${verificationUrl}
                </p>

                <div class="divider"></div>

                <p style="font-size: 13px; color: #666;">
                  <strong>¿No te registraste en Rola Cards?</strong><br>
                  Si no creaste una cuenta, puedes ignorar este correo de forma segura.
                </p>
              </div>
              <div class="footer">
                <p>Este correo fue enviado por Rola Cards</p>
                <p>© ${new Date().getFullYear()} Rola Cards. Todos los derechos reservados.</p>
              </div>
            </div>
          </body>
        </html>
      `,
    });

    console.log('✅ Email de verificación enviado a:', email);
    console.log('📧 Message ID:', result.id);
    return { success: true, messageId: result.id };
  } catch (error) {
    console.error('❌ Error al enviar email:', error);
    return { success: false, error };
  }
}

// Función adicional para enviar notificaciones de inscripciones
export async function sendRegistrationNotification(
  email: string,
  userName: string,
  eventTitle: string,
  status: 'APROBADO' | 'RECHAZADO',
  rejectionNote?: string
) {
  const domain = process.env.MAILGUN_DOMAIN || '';

  const statusText = status === 'APROBADO' ? 'aprobada' : 'rechazada';
  const statusColor = status === 'APROBADO' ? '#22c55e' : '#ef4444';

  try {
    const result = await mg.messages.create(domain, {
      from: process.env.EMAIL_FROM || 'Rola Cards <noreply@sandbox.mailgun.org>',
      to: [email],
      subject: `Inscripción ${statusText} - ${eventTitle}`,
      html: `
        <!DOCTYPE html>
        <html>
          <head>
            <meta charset="utf-8">
            <style>
              body {
                font-family: Arial, sans-serif;
                line-height: 1.6;
                color: #333;
                background-color: #f4f4f4;
                margin: 0;
                padding: 0;
              }
              .container {
                max-width: 600px;
                margin: 20px auto;
                background: #ffffff;
                border-radius: 8px;
                overflow: hidden;
                box-shadow: 0 2px 4px rgba(0,0,0,0.1);
              }
              .header {
                background: linear-gradient(135deg, #D4AF37 0%, #C5A028 100%);
                padding: 30px;
                text-align: center;
              }
              .header h1 {
                color: #ffffff;
                margin: 0;
                font-size: 28px;
              }
              .content {
                padding: 40px 30px;
              }
              .status-badge {
                display: inline-block;
                padding: 10px 20px;
                background: ${statusColor};
                color: #ffffff;
                border-radius: 5px;
                font-weight: bold;
                margin: 20px 0;
              }
              .button {
                display: inline-block;
                padding: 14px 30px;
                background: #D4AF37;
                color: #ffffff !important;
                text-decoration: none;
                border-radius: 5px;
                font-weight: bold;
                margin: 20px 0;
              }
              .footer {
                background: #f8f8f8;
                padding: 20px;
                text-align: center;
                font-size: 12px;
                color: #666;
              }
              .divider {
                border-top: 1px solid #eee;
                margin: 20px 0;
              }
            </style>
          </head>
          <body>
            <div class="container">
              <div class="header">
                <h1>ROLA CARDS</h1>
              </div>
              <div class="content">
                <h2>Hola, ${userName}</h2>
                <p>Tu solicitud de inscripción al evento <strong>${eventTitle}</strong> ha sido:</p>

                <div style="text-align: center;">
                  <span class="status-badge">${status === 'APROBADO' ? '✓ APROBADA' : '✗ RECHAZADA'}</span>
                </div>

                ${status === 'APROBADO'
                  ? `
                    <p>¡Felicidades! Tu inscripción ha sido aprobada. Te esperamos en el evento.</p>
                    <div style="text-align: center;">
                      <a href="${process.env.NEXTAUTH_URL}/mis-inscripciones" class="button">Ver mis inscripciones</a>
                    </div>
                  `
                  : `
                    <p>Lamentablemente, tu solicitud ha sido rechazada.</p>
                    ${rejectionNote ? `
                      <div style="background: #fef2f2; border-left: 4px solid #ef4444; padding: 15px; margin: 20px 0;">
                        <strong>Razón:</strong><br>
                        ${rejectionNote}
                      </div>
                    ` : ''}
                    <p>Si tienes alguna duda, puedes contactarnos.</p>
                  `
                }

                <div class="divider"></div>

                <p style="font-size: 13px; color: #666;">
                  Puedes revisar el estado de todas tus inscripciones en tu panel de usuario.
                </p>
              </div>
              <div class="footer">
                <p>Este correo fue enviado por Rola Cards</p>
                <p>© ${new Date().getFullYear()} Rola Cards. Todos los derechos reservados.</p>
              </div>
            </div>
          </body>
        </html>
      `,
    });

    console.log('✅ Notificación de inscripción enviada a:', email);
    console.log('📧 Message ID:', result.id);
    return { success: true, messageId: result.id };
  } catch (error) {
    console.error('❌ Error al enviar notificación:', error);
    return { success: false, error };
  }
}
