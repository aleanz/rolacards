import { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Eventos y Torneos',
  description: 'Descubre todos nuestros torneos TCG, eventos especiales y competencias de Yu-Gi-Oh!, Pokémon y Magic. Inscríbete y compite.',
  openGraph: {
    title: 'Eventos y Torneos | Rola Cards',
    description: 'Descubre todos nuestros torneos TCG, eventos especiales y competencias.',
  },
};

export default function EventosLayout({ children }: { children: React.ReactNode }) {
  return children;
}
