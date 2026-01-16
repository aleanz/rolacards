'use client';

import { useEffect, useState } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';
import { ArrowLeft, Edit, Trash2, Loader2, Calendar } from 'lucide-react';
import Header from '@/components/layout/Header';
import Footer from '@/components/layout/Footer';
import { countCardsByType } from '@/lib/deck-validation';

interface DeckCard {
  id: string;
  cardId: number;
  quantity: number;
  deckType: 'MAIN' | 'EXTRA' | 'SIDE';
  cardData: any;
}

interface Deck {
  id: string;
  name: string;
  description?: string;
  format?: string;
  createdAt: string;
  updatedAt: string;
  cards: DeckCard[];
  user: {
    name: string;
    email: string;
  };
}

export default function DeckViewPage({ params }: { params: { id: string } }) {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [deck, setDeck] = useState<Deck | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isDeleting, setIsDeleting] = useState(false);

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/auth/login');
    } else if (status === 'authenticated') {
      fetchDeck();
    }
  }, [status, params.id, router]);

  const fetchDeck = async () => {
    try {
      const response = await fetch(`/api/decks/${params.id}`);
      if (response.ok) {
        const data = await response.json();
        setDeck(data.deck);
      } else {
        router.push('/mazos');
      }
    } catch (error) {
      console.error('Error fetching deck:', error);
      router.push('/mazos');
    } finally {
      setIsLoading(false);
    }
  };

  const handleDelete = async () => {
    if (!confirm('¿Estás seguro de que quieres eliminar este mazo?')) {
      return;
    }

    setIsDeleting(true);
    try {
      const response = await fetch(`/api/decks/${params.id}`, {
        method: 'DELETE',
      });

      if (response.ok) {
        router.push('/mazos');
      } else {
        const data = await response.json();
        alert(data.error || 'Error al eliminar el mazo');
      }
    } catch (error) {
      console.error('Error deleting deck:', error);
      alert('Error al eliminar el mazo');
    } finally {
      setIsDeleting(false);
    }
  };

  if (status === 'loading' || isLoading) {
    return (
      <>
        <Header />
        <main className="min-h-screen pt-24 pb-20">
          <div className="container-custom">
            <div className="flex items-center justify-center py-20">
              <Loader2 className="w-8 h-8 text-rola-gold animate-spin" />
            </div>
          </div>
        </main>
        <Footer />
      </>
    );
  }

  if (!deck) {
    return null;
  }

  const counts = countCardsByType(deck.cards);
  const mainCards = deck.cards.filter(c => c.deckType === 'MAIN');
  const extraCards = deck.cards.filter(c => c.deckType === 'EXTRA');
  const sideCards = deck.cards.filter(c => c.deckType === 'SIDE');

  return (
    <>
      <Header />
      <main className="min-h-screen pt-24 pb-20">
        <div className="container-custom">
          {/* Header */}
          <div className="mb-8">
            <Link
              href="/mazos"
              className="inline-flex items-center gap-2 text-sm text-gray-400 hover:text-rola-gold transition-colors mb-4"
            >
              <ArrowLeft className="w-4 h-4" />
              Volver a mis mazos
            </Link>
            <div className="flex items-start justify-between">
              <div className="flex-1">
                <h1 className="font-display text-4xl font-bold text-white mb-2">
                  {deck.name}
                </h1>
                {deck.format && (
                  <p className="text-lg text-rola-gold mb-2">{deck.format}</p>
                )}
                {deck.description && (
                  <p className="text-gray-400">{deck.description}</p>
                )}
                <div className="flex items-center gap-2 text-sm text-gray-500 mt-4">
                  <Calendar className="w-4 h-4" />
                  <span>
                    Actualizado: {new Date(deck.updatedAt).toLocaleDateString('es-MX')}
                  </span>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <Link
                  href={`/mazos/${params.id}/editar`}
                  className="btn btn-outline"
                >
                  <Edit className="w-5 h-5" />
                  Editar
                </Link>
                <button
                  onClick={handleDelete}
                  disabled={isDeleting}
                  className="btn btn-outline text-red-400 hover:bg-red-500/10 hover:border-red-500/30"
                >
                  {isDeleting ? (
                    <Loader2 className="w-5 h-5 animate-spin" />
                  ) : (
                    <Trash2 className="w-5 h-5" />
                  )}
                  Eliminar
                </button>
              </div>
            </div>
          </div>

          {/* Stats */}
          <div className="grid grid-cols-3 gap-4 mb-8">
            <div className="card p-4 text-center">
              <p className="text-3xl font-bold text-white mb-1">{counts.main}</p>
              <p className="text-sm text-gray-400">Main Deck</p>
            </div>
            <div className="card p-4 text-center">
              <p className="text-3xl font-bold text-rola-purple mb-1">{counts.extra}</p>
              <p className="text-sm text-gray-400">Extra Deck</p>
            </div>
            <div className="card p-4 text-center">
              <p className="text-3xl font-bold text-rola-gold mb-1">{counts.side}</p>
              <p className="text-sm text-gray-400">Side Deck</p>
            </div>
          </div>

          {/* Deck Sections */}
          <div className="space-y-8">
            {/* Main Deck */}
            {mainCards.length > 0 && (
              <div className="card p-6">
                <h2 className="font-display text-2xl font-bold text-white mb-4">
                  Main Deck ({counts.main})
                </h2>
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4">
                  {mainCards.map((card) => (
                    <div key={card.id} className="relative group">
                      <div className="aspect-[59/86] rounded-lg overflow-hidden border border-rola-gray/50">
                        {card.cardData?.card_images?.[0]?.image_url && (
                          <Image
                            src={card.cardData.card_images[0].image_url}
                            alt={card.cardData.name || 'Card'}
                            fill
                            className="object-cover"
                          />
                        )}
                      </div>
                      {card.quantity > 1 && (
                        <div className="absolute top-2 right-2 bg-black/80 text-white text-xs font-bold rounded-full w-6 h-6 flex items-center justify-center">
                          x{card.quantity}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Extra Deck */}
            {extraCards.length > 0 && (
              <div className="card p-6">
                <h2 className="font-display text-2xl font-bold text-rola-purple mb-4">
                  Extra Deck ({counts.extra})
                </h2>
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4">
                  {extraCards.map((card) => (
                    <div key={card.id} className="relative">
                      <div className="aspect-[59/86] rounded-lg overflow-hidden border border-rola-purple/50">
                        {card.cardData?.card_images?.[0]?.image_url && (
                          <Image
                            src={card.cardData.card_images[0].image_url}
                            alt={card.cardData.name || 'Card'}
                            fill
                            className="object-cover"
                          />
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Side Deck */}
            {sideCards.length > 0 && (
              <div className="card p-6">
                <h2 className="font-display text-2xl font-bold text-rola-gold mb-4">
                  Side Deck ({counts.side})
                </h2>
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4">
                  {sideCards.map((card) => (
                    <div key={card.id} className="relative">
                      <div className="aspect-[59/86] rounded-lg overflow-hidden border border-rola-gold/50">
                        {card.cardData?.card_images?.[0]?.image_url && (
                          <Image
                            src={card.cardData.card_images[0].image_url}
                            alt={card.cardData.name || 'Card'}
                            fill
                            className="object-cover"
                          />
                        )}
                      </div>
                      {card.quantity > 1 && (
                        <div className="absolute top-2 right-2 bg-black/80 text-white text-xs font-bold rounded-full w-6 h-6 flex items-center justify-center">
                          x{card.quantity}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      </main>
      <Footer />
    </>
  );
}
