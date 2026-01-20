require('dotenv').config();
const formData = require('form-data');
const Mailgun = require('mailgun.js');

const mailgun = new Mailgun(formData);
const mg = mailgun.client({
  username: 'api',
  key: process.env.MAILGUN_API_KEY || '',
  url: process.env.MAILGUN_BASE_URL || 'https://api.mailgun.net',
});

async function testMailgun() {
  console.log('🔧 Probando configuración de Mailgun...\n');

  console.log('📋 Configuración:');
  console.log('   API Key:', process.env.MAILGUN_API_KEY ? `✓ ${process.env.MAILGUN_API_KEY.substring(0, 8)}...` : '✗ No configurada');
  console.log('   Domain:', process.env.MAILGUN_DOMAIN || 'No configurado');
  console.log('   Base URL:', process.env.MAILGUN_BASE_URL || 'No configurado');
  console.log('   From:', process.env.EMAIL_FROM || 'No configurado');
  console.log('');

  if (!process.env.MAILGUN_API_KEY || !process.env.MAILGUN_DOMAIN) {
    console.error('❌ Error: MAILGUN_API_KEY y MAILGUN_DOMAIN deben estar configurados en .env');
    process.exit(1);
  }

  try {
    console.log('📧 Enviando email de prueba...\n');

    const result = await mg.messages.create(process.env.MAILGUN_DOMAIN, {
      from: process.env.EMAIL_FROM || 'Rola Cards <noreply@sandbox.mailgun.org>',
      to: ['test@example.com'], // Mailgun sandbox permite enviar a direcciones autorizadas
      subject: 'Email de Prueba - Rola Cards',
      text: 'Este es un email de prueba desde Rola Cards usando Mailgun.',
      html: `
        <html>
          <body style="font-family: Arial, sans-serif; padding: 20px;">
            <div style="max-width: 600px; margin: 0 auto; background: #f4f4f4; padding: 20px; border-radius: 8px;">
              <h1 style="color: #D4AF37;">Rola Cards</h1>
              <p>Este es un email de prueba enviado desde Rola Cards usando Mailgun.</p>
              <p>Si recibes este email, la configuración está funcionando correctamente.</p>
              <hr style="border: 1px solid #ddd; margin: 20px 0;">
              <p style="font-size: 12px; color: #666;">
                Fecha: ${new Date().toLocaleString('es-MX')}
              </p>
            </div>
          </body>
        </html>
      `,
    });

    console.log('✅ Email enviado exitosamente!');
    console.log('📧 Message ID:', result.id);
    console.log('📨 Status:', result.status);
    console.log('\n🎉 Mailgun está configurado correctamente!\n');

    console.log('⚠️  NOTA IMPORTANTE:');
    console.log('   Si estás usando el dominio sandbox de Mailgun, solo puedes enviar emails a');
    console.log('   direcciones autorizadas. Agrega direcciones en:');
    console.log('   https://app.mailgun.com/app/sending/domains/[tu-dominio]/recipients\n');

  } catch (error) {
    console.error('❌ Error al enviar email:', error);

    if (error.status === 401) {
      console.error('\n⚠️  Error de autenticación. Verifica que tu API Key sea correcta.');
    } else if (error.status === 400) {
      console.error('\n⚠️  Error en la solicitud. Verifica el dominio y el formato del email.');
    }

    process.exit(1);
  }
}

testMailgun();
