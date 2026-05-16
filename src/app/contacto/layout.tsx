import { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Contacto',
  description: 'Contáctanos para más información sobre cartas TCG, torneos y eventos. Visítanos, llámanos o envíanos un mensaje por WhatsApp.',
  openGraph: {
    title: 'Contacto | Rola Cards',
    description: 'Contáctanos para más información sobre cartas TCG, torneos y eventos.',
  },
};

export default function ContactoLayout({ children }: { children: React.ReactNode }) {
  return children;
}
