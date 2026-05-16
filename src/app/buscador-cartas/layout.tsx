import { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Buscador de Cartas',
  description: 'Busca cualquier carta de Yu-Gi-Oh! por nombre, tipo, atributo o efecto. Base de datos completa con imágenes y precios.',
  openGraph: {
    title: 'Buscador de Cartas | Rola Cards',
    description: 'Busca cualquier carta de Yu-Gi-Oh! por nombre, tipo, atributo o efecto.',
  },
};

export default function BuscadorCartasLayout({ children }: { children: React.ReactNode }) {
  return children;
}
