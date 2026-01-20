require('dotenv').config();
const formData = require('form-data');
const Mailgun = require('mailgun.js');
const crypto = require('crypto');

const mailgun = new Mailgun(formData);
const mg = mailgun.client({
  username: 'api',
  key: process.env.MAILGUN_API_KEY || '',
  url: process.env.MAILGUN_BASE_URL || 'https://api.mailgun.net',
});

async function testVerificationEmail() {
  // Solicitar email del destinatario
  const readline = require('readline').createInterface({
    input: process.stdin,
    output: process.stdout
  });

  readline.question('📧 ¿A qué email quieres enviar la prueba? ', async (email) => {
    console.log(`\n🔧 Enviando email de verificación a: ${email}\n`);

    const token = crypto.randomBytes(32).toString('hex');
    const verificationUrl = `${process.env.NEXTAUTH_URL}/auth/verify-email?token=${token}`;
    const domain = process.env.MAILGUN_DOMAIN || '';

    try {
      const result = await mg.messages.create(domain, {
        from: process.env.EMAIL_FROM || 'Rola Cards <noreply@rolacards.com>',
        to: [email],
        subject: 'Verifica tu cuenta en Rola Cards - PRUEBA',
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
                .test-badge {
                  background: #ff6b6b;
                  color: white;
                  padding: 5px 10px;
                  border-radius: 3px;
                  font-size: 12px;
                  font-weight: bold;
                  display: inline-block;
                  margin-bottom: 10px;
                }
              </style>
            </head>
            <body>
              <div class="container">
                <div class="header">
                  <h1>ROLA CARDS</h1>
                </div>
                <div class="content">
                  <span class="test-badge">🧪 EMAIL DE PRUEBA</span>
                  <h2>¡Bienvenido, Usuario de Prueba!</h2>
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
                    <strong>Nota:</strong> Este es un email de prueba del sistema de Rola Cards.<br>
                    El link de verificación es solo para demostración.
                  </p>

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

      console.log('✅ Email de verificación enviado exitosamente!');
      console.log(`📧 Message ID: ${result.id}`);
      console.log(`📨 Status: ${result.status}`);
      console.log(`\n🎉 ¡Revisa tu bandeja de entrada en ${email}!\n`);
      console.log('💡 Si no lo ves, revisa tu carpeta de spam.\n');

    } catch (error) {
      console.error('❌ Error al enviar email:', error);
    }

    readline.close();
  });
}

testVerificationEmail();
