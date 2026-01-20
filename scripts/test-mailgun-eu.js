require('dotenv').config();
const formData = require('form-data');
const Mailgun = require('mailgun.js');

async function testBothRegions() {
  console.log('🔧 Probando Mailgun en ambas regiones...\n');

  const regions = [
    { name: 'US', url: 'https://api.mailgun.net' },
    { name: 'EU', url: 'https://api.eu.mailgun.net' }
  ];

  for (const region of regions) {
    console.log(`\n📍 Probando región: ${region.name}`);
    console.log(`   URL: ${region.url}\n`);

    const mailgun = new Mailgun(formData);
    const mg = mailgun.client({
      username: 'api',
      key: process.env.MAILGUN_API_KEY || '',
      url: region.url,
    });

    try {
      const result = await mg.messages.create(process.env.MAILGUN_DOMAIN, {
        from: process.env.EMAIL_FROM || 'Rola Cards <noreply@sandbox.mailgun.org>',
        to: ['test@example.com'],
        subject: `Test - Región ${region.name}`,
        text: `Email de prueba desde región ${region.name}`,
      });

      console.log(`✅ ¡Éxito en región ${region.name}!`);
      console.log(`   Message ID: ${result.id}`);
      console.log(`   Status: ${result.status}`);
      return;

    } catch (error) {
      console.log(`❌ Error en región ${region.name}:`);
      console.log(`   Status: ${error.status}`);
      console.log(`   Error: ${error.message}`);
    }
  }

  console.log('\n❌ No se pudo conectar en ninguna región.');
  console.log('\n💡 Verifica:');
  console.log('   1. Que la API key sea correcta (sin espacios)');
  console.log('   2. Que el dominio esté verificado en Mailgun');
  console.log('   3. Que la API key corresponda al dominio correcto');
}

testBothRegions();
