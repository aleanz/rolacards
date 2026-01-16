'use client';

import { useEffect, useState } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeft, Loader2 } from 'lucide-react';
import Header from '@/components/layout/Header';
import Footer from '@/components/layout/Footer';
import DeckEditor from '@/components/deck-builder/DeckEditor';
import type { Deck } from '@/lib/deck-validation';

export default function EditDeckPage({ params }: { params: { id: string } }) {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [initialDeck, setInitialDeck] = useState<Deck | null>(null);
  const [isLoading, setIsLoading] = useState(true);

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
        setInitialDeck({
          id: data.deck.id,
          name: data.deck.name,
          description: data.deck.description,
          format: data.deck.format,
          cards: data.deck.cards.map((card: any) => ({
            id: card.id,
            cardId: card.cardId,
            quantity: card.quantity,
            deckType: card.deckType,
            cardData: card.cardData,
          })),
        });
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

  const handleSave = async (deck: Deck) => {
    const response = await fetch(`/api/decks/${params.id}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        name: deck.name,
        description: deck.description,
        format: deck.format,
        cards: deck.cards.map(card => ({
          cardId: card.cardId,
          quantity: card.quantity,
          deckType: card.deckType,
          cardData: card.cardData,
        })),
      }),
    });

    if (!response.ok) {
      const data = await response.json();
      throw new Error(data.error || 'Error al actualizar mazo');
    }

    router.push(`/mazos/${params.id}`);
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

  if (!initialDeck) {
    return null;
  }

  return (
    <>
      <Header />
      <main className="min-h-screen pt-24 pb-20">
        <div className="container-custom">
          {/* Header */}
          <div className="mb-8">
            <Link
              href={`/mazos/${params.id}`}
              className="inline-flex items-center gap-2 text-sm text-gray-400 hover:text-rola-gold transition-colors mb-4"
            >
              <ArrowLeft className="w-4 h-4" />
              Volver al mazo
            </Link>
            <h1 className="font-display text-4xl font-bold text-white mb-2">
              Editar Mazo
            </h1>
            <p className="text-gray-400">
              Modifica las cartas y la información de tu mazo
            </p>
          </div>

          {/* Deck Editor */}
          <DeckEditor
            deckId={params.id}
            initialDeck={initialDeck}
            onSave={handleSave}
          />
        </div>
      </main>
      <Footer />
    </>
  );
}
