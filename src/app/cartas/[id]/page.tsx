import { Metadata } from 'next';
import { notFound } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';
import { ArrowLeft, ExternalLink } from 'lucide-react';
import Header from '@/components/layout/Header';
import Footer from '@/components/layout/Footer';

interface CardImage {
  id: number;
  image_url: string;
  image_url_small: string;
}

interface CardPrice {
  cardmarket_price: string;
  tcgplayer_price: string;
  ebay_price: string;
  amazon_price: string;
}

interface CardSet {
  set_name: string;
  set_code: string;
  set_rarity: string;
  set_price: string;
}

interface MiscInfo {
  tcg_date?: string;
  ocg_date?: string;
  formats?: string[];
}

interface Card {
  id: number;
  name: string;
  type: string;
  desc: string;
  atk?: number;
  def?: number;
  level?: number;
  race: string;
  attribute?: string;
  archetype?: string;
  card_images: CardImage[];
  card_prices: CardPrice[];
  card_sets?: CardSet[];
  misc_info?: MiscInfo[];
}

async function getCard(id: string): Promise<Card | null> {
  try {
    const response = await fetch(
      `https://db.ygoprodeck.com/api/v7/cardinfo.php?id=${id}&misc=yes`,
      { next: { revalidate: 86400 } }
    );
    if (!response.ok) return null;
    const data = await response.json();
    return data.data?.[0] || null;
  } catch {
    return null;
  }
}

function getRegionalAvailability(card: Card) {
  const miscInfo = card.misc_info?.[0];
  const hasTCGDate = miscInfo?.tcg_date !== undefined;
  const hasOCGDate = miscInfo?.ocg_date !== undefined;
  const formats = miscInfo?.formats || [];
  const hasTCG = hasTCGDate || formats.includes('TCG');
  const hasOCG = hasOCGDate || formats.includes('OCG');
  return { tcg: hasTCG, ocg: hasOCG };
}

interface PageProps {
  params: { id: string };
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const card = await getCard(params.id);
  if (!card) return { title: 'Carta no encontrada' };

  const baseUrl = process.env.NEXTAUTH_URL || 'https://rolacards.com';
  const prices = card.card_prices?.[0];
  const priceText = prices?.tcgplayer_price
    ? ` | Precio: $${prices.tcgplayer_price} USD`
    : '';

  return {
    title: `${card.name} - Precio e Info`,
    description: `${card.name} - ${card.type}. ${card.desc.slice(0, 150)}${card.desc.length > 150 ? '...' : ''}${priceText}`,
    openGraph: {
      title: `${card.name} | Rola Cards`,
      description: `Info, precios y sets de ${card.name}. ${card.type}.`,
      images: [{ url: card.card_images[0].image_url, width: 421, height: 614, alt: card.name }],
    },
    twitter: {
      card: 'summary_large_image',
      title: `${card.name} | Rola Cards`,
      description: `Info, precios y sets de ${card.name}.`,
      images: [card.card_images[0].image_url],
    },
    alternates: {
      canonical: `${baseUrl}/cartas/${params.id}`,
    },
  };
}

export default async function CardDetailPage({ params }: PageProps) {
  const card = await getCard(params.id);
  if (!card) notFound();

  const availability = getRegionalAvailability(card);
  const prices = card.card_prices?.[0];
  const miscInfo = card.misc_info?.[0];

  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'Product',
    name: card.name,
    description: card.desc,
    image: card.card_images[0].image_url,
    category: card.type,
    ...(prices?.tcgplayer_price && parseFloat(prices.tcgplayer_price) > 0 && {
      offers: {
        '@type': 'Offer',
        price: prices.tcgplayer_price,
        priceCurrency: 'USD',
        availability: 'https://schema.org/InStock',
        seller: { '@type': 'Organization', name: 'Rola Cards' },
      },
    }),
  };

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      <Header />
      <main className="min-h-screen pt-24 pb-20">
        <div className="container-custom max-w-5xl">
          <div className="mb-8">
            <Link
              href="/buscador-cartas"
              className="inline-flex items-center gap-2 text-sm text-gray-400 hover:text-rola-gold transition-colors"
            >
              <ArrowLeft className="w-4 h-4" />
              Volver al buscador
            </Link>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {/* Left: Image + Prices */}
            <div>
              <div className="relative aspect-[421/614] rounded-xl overflow-hidden mb-6">
                <Image
                  src={card.card_images[0].image_url}
                  alt={card.name}
                  fill
                  sizes="(max-width: 768px) 100vw, 50vw"
                  className="object-contain"
                  priority
                />
              </div>

              {prices && (
                <div className="card p-5">
                  <h2 className="text-white font-semibold mb-3">Precios estimados</h2>
                  <div className="space-y-2 text-sm">
                    {prices.cardmarket_price && parseFloat(prices.cardmarket_price) > 0 && (
                      <div className="flex justify-between">
                        <span className="text-gray-400">CardMarket</span>
                        <span className="text-rola-gold font-semibold">
                          &euro;{prices.cardmarket_price}
                        </span>
                      </div>
                    )}
                    {prices.tcgplayer_price && parseFloat(prices.tcgplayer_price) > 0 && (
                      <div className="flex justify-between">
                        <span className="text-gray-400">TCGPlayer</span>
                        <span className="text-rola-gold font-semibold">
                          ${prices.tcgplayer_price}
                        </span>
                      </div>
                    )}
                    {prices.ebay_price && parseFloat(prices.ebay_price) > 0 && (
                      <div className="flex justify-between">
                        <span className="text-gray-400">eBay</span>
                        <span className="text-rola-gold font-semibold">
                          ${prices.ebay_price}
                        </span>
                      </div>
                    )}
                    {prices.amazon_price && parseFloat(prices.amazon_price) > 0 && (
                      <div className="flex justify-between">
                        <span className="text-gray-400">Amazon</span>
                        <span className="text-rola-gold font-semibold">
                          ${prices.amazon_price}
                        </span>
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>

            {/* Right: Card Info */}
            <div className="space-y-5">
              <div>
                <h1 className="font-display text-3xl md:text-4xl font-bold text-white mb-3">
                  {card.name}
                </h1>
                <div className="flex gap-2">
                  {availability.tcg && (
                    <span className="px-3 py-1 bg-blue-500 text-white text-xs font-bold rounded">
                      TCG
                    </span>
                  )}
                  {availability.ocg && (
                    <span className="px-3 py-1 bg-red-500 text-white text-xs font-bold rounded">
                      OCG
                    </span>
                  )}
                </div>
              </div>

              {/* Release Dates */}
              {miscInfo && (miscInfo.tcg_date || miscInfo.ocg_date) && (
                <div className="card p-4">
                  <h3 className="text-white font-semibold mb-2">Fechas de Lanzamiento</h3>
                  <div className="space-y-1 text-sm">
                    {miscInfo.tcg_date && (
                      <p className="text-gray-400">
                        <span className="inline-block px-2 py-0.5 bg-blue-500 text-white text-xs font-bold rounded mr-2">
                          TCG
                        </span>
                        {new Date(miscInfo.tcg_date).toLocaleDateString('es-MX', {
                          year: 'numeric',
                          month: 'long',
                          day: 'numeric',
                        })}
                      </p>
                    )}
                    {miscInfo.ocg_date && (
                      <p className="text-gray-400">
                        <span className="inline-block px-2 py-0.5 bg-red-500 text-white text-xs font-bold rounded mr-2">
                          OCG
                        </span>
                        {new Date(miscInfo.ocg_date).toLocaleDateString('es-MX', {
                          year: 'numeric',
                          month: 'long',
                          day: 'numeric',
                        })}
                      </p>
                    )}
                  </div>
                </div>
              )}

              {/* Stats Grid */}
              <div className="grid grid-cols-2 gap-4">
                <div className="card p-4">
                  <h3 className="text-gray-500 text-xs mb-1">Tipo</h3>
                  <p className="text-white text-sm font-medium">{card.type}</p>
                </div>

                {card.attribute && (
                  <div className="card p-4">
                    <h3 className="text-gray-500 text-xs mb-1">Atributo</h3>
                    <p className="text-white text-sm font-medium">{card.attribute}</p>
                  </div>
                )}

                <div className="card p-4">
                  <h3 className="text-gray-500 text-xs mb-1">Raza / Tipo</h3>
                  <p className="text-white text-sm font-medium">{card.race}</p>
                </div>

                {card.level !== undefined && (
                  <div className="card p-4">
                    <h3 className="text-gray-500 text-xs mb-1">Nivel / Rank</h3>
                    <p className="text-white text-sm font-medium">{card.level}</p>
                  </div>
                )}

                {card.atk !== undefined && (
                  <div className="card p-4">
                    <h3 className="text-gray-500 text-xs mb-1">ATK</h3>
                    <p className="text-white text-sm font-bold">{card.atk}</p>
                  </div>
                )}

                {card.def !== undefined && (
                  <div className="card p-4">
                    <h3 className="text-gray-500 text-xs mb-1">DEF</h3>
                    <p className="text-white text-sm font-bold">{card.def}</p>
                  </div>
                )}
              </div>

              {card.archetype && (
                <div>
                  <h3 className="text-gray-500 text-sm mb-1">Arquetipo</h3>
                  <p className="text-white">{card.archetype}</p>
                </div>
              )}

              <div>
                <h3 className="text-gray-500 text-sm mb-1">Descripción</h3>
                <p className="text-gray-300 text-sm leading-relaxed">{card.desc}</p>
              </div>

              {/* Sets */}
              {card.card_sets && card.card_sets.length > 0 && (
                <div>
                  <h3 className="text-gray-500 text-sm mb-2">Sets</h3>
                  <div className="max-h-48 overflow-y-auto space-y-1">
                    {card.card_sets.map((set, i) => (
                      <div
                        key={`${set.set_code}-${i}`}
                        className="flex items-center justify-between text-xs p-2 bg-rola-gray/20 rounded"
                      >
                        <div className="flex-1 min-w-0">
                          <span className="text-white truncate block">{set.set_name}</span>
                          <span className="text-gray-500">{set.set_code} &middot; {set.set_rarity}</span>
                        </div>
                        {set.set_price && parseFloat(set.set_price) > 0 && (
                          <span className="text-rola-gold ml-2 flex-shrink-0">${set.set_price}</span>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}

              <a
                href={`https://ygoprodeck.com/card/${card.name.replace(/\s+/g, '-').toLowerCase()}`}
                target="_blank"
                rel="noopener noreferrer"
                className="btn btn-outline w-full"
              >
                <ExternalLink className="w-4 h-4" />
                Ver en YGOProDeck
              </a>
            </div>
          </div>
        </div>
      </main>
      <Footer />
    </>
  );
}
