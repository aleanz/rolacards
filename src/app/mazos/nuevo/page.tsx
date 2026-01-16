'use client';

import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { useEffect } from 'react';
import { ArrowLeft, Loader2 } from 'lucide-react';
import Link from 'next/link';
import Header from '@/components/layout/Header';
import Footer from '@/components/layout/Footer';
import DeckEditor from '@/components/deck-builder/DeckEditor';
import type { Deck } from '@/lib/deck-validation';

export default function NuevoMazoPage() {
  const { data: session, status } = useSession();
  const router = useRouter();

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/auth/login');
    }
  }, [status, router]);

  const handleSave = async (deck: Deck) => {
    try {
      const response = await fetch('/api/decks', {
        method: 'POST',
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

        // Si hay errores de validación, mostrarlos
        if (data.validationErrors && data.validationErrors.length > 0) {
          const errorMessages = data.validationErrors.map((e: any) => e.message).join('\n');
          throw new Error(`Errores de validación:\n\n${errorMessages}`);
        }

        throw new Error(data.error || 'Error al crear mazo');
      }

      const data = await response.json();
      router.push(`/mazos/${data.deck.id}`);
    } catch (error) {
      console.error('Error saving deck:', error);
      throw error;
    }
  };

  if (status === 'loading') {
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
            <h1 className="font-display text-4xl font-bold text-white mb-2">
              Crear Nuevo Mazo
            </h1>
            <p className="text-gray-400">
              Construye tu mazo agregando cartas del Main, Extra y Side Deck
            </p>
          </div>

          {/* Deck Editor */}
          <DeckEditor onSave={handleSave} />
        </div>
      </main>
      <Footer />
    </>
  );
}
