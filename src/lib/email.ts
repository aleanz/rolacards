import { Resend } from 'resend';

const resend = new Resend(process.env.RESEND_API_KEY);

export async function sendVerificationEmail(email: string, token: string, name: string) {
  const verificationUrl = `${process.env.NEXTAUTH_URL}/auth/verify-email?token=${token}`;

  try {
    await resend.emails.send({
      from: process.env.EMAIL_FROM || 'Rola Cards <noreply@rolacards.com>',
      to: email,
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
    return { success: true };
  } catch (error) {
    console.error('❌ Error al enviar email:', error);
    return { success: false, error };
  }
}
