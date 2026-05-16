import { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Catálogo',
  description: 'Explora nuestro catálogo de cartas coleccionables TCG: Yu-Gi-Oh!, Pokémon, Magic y más. Cartas individuales, producto sellado y accesorios.',
  openGraph: {
    title: 'Catálogo | Rola Cards',
    description: 'Explora nuestro catálogo de cartas coleccionables TCG: Yu-Gi-Oh!, Pokémon, Magic y más.',
  },
};

export default function CatalogoLayout({ children }: { children: React.ReactNode }) {
  return children;
}
