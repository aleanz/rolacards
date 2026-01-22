'use client';

import { useEffect, useState } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import toast from 'react-hot-toast';
import { Plus, Eye, Edit, Trash2, Loader2, Calendar } from 'lucide-react';
import Header from '@/components/layout/Header';
import Footer from '@/components/layout/Footer';

interface Deck {
  id: string;
  name: string;
  format?: string;
  createdAt: string;
  updatedAt: string;
  _count: {
    cards: number;
    registrations: number;
  };
}

export default function MazosPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [decks, setDecks] = useState<Deck[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/auth/login');
    } else if (status === 'authenticated') {
      fetchDecks();
    }
  }, [status, router]);

  const fetchDecks = async () => {
    try {
      const response = await fetch('/api/decks');
      if (response.ok) {
        const data = await response.json();
        setDecks(data.decks || []);
      }
    } catch (error) {
      console.error('Error fetching decks:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleDelete = async (id: string) => {
    setDeletingId(id);

    const deletePromise = new Promise(async (resolve, reject) => {
      try {
        const response = await fetch(`/api/decks/${id}`, {
          method: 'DELETE',
        });

        if (response.ok) {
          setDecks(decks.filter(d => d.id !== id));
          resolve('Mazo eliminado correctamente');
        } else {
          const data = await response.json();
          reject(data.error || 'Error al eliminar el mazo');
        }
      } catch (error) {
        console.error('Error deleting deck:', error);
        reject('Error al eliminar el mazo');
      } finally {
        setDeletingId(null);
      }
    });

    toast.promise(deletePromise, {
      loading: 'Eliminando mazo...',
      success: (msg) => msg as string,
      error: (err) => err as string,
    });
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

  return (
    <>
      <Header />
      <main className="min-h-screen pt-24 pb-20">
        <div className="container-custom">
          {/* Header */}
          <div className="flex items-center justify-between mb-8">
            <div>
              <h1 className="font-display text-4xl font-bold text-white mb-2">
                Mis Mazos
              </h1>
              <p className="text-gray-400">
                Gestiona tus mazos para inscribirte a torneos
              </p>
            </div>
            <Link href="/mazos/nuevo" className="btn btn-primary">
              <Plus className="w-5 h-5" />
              Crear Mazo
            </Link>
          </div>

          {/* Decks List */}
          {decks.length > 0 ? (
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
              {decks.map((deck) => (
                <div key={deck.id} className="card p-6">
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex-1">
                      <h3 className="font-display text-xl font-bold text-white mb-1">
                        {deck.name}
                      </h3>
                      {deck.format && (
                        <p className="text-sm text-rola-gold">{deck.format}</p>
                      )}
                    </div>
                  </div>

                  <div className="flex items-center gap-4 mb-4 text-sm text-gray-400">
                    <div>
                      <span className="font-medium text-white">{deck._count.cards}</span> cartas
                    </div>
                    {deck._count.registrations > 0 && (
                      <div>
                        <span className="font-medium text-rola-gold">{deck._count.registrations}</span> inscripciones
                      </div>
                    )}
                  </div>

                  <div className="flex items-center gap-2 text-xs text-gray-500 mb-4">
                    <Calendar className="w-3 h-3" />
                    <span>
                      Actualizado: {new Date(deck.updatedAt).toLocaleDateString('es-MX')}
                    </span>
                  </div>

                  <div className="flex items-center gap-2">
                    <Link
                      href={`/mazos/${deck.id}`}
                      className="btn btn-sm btn-outline flex-1"
                    >
                      <Eye className="w-4 h-4" />
                      Ver
                    </Link>
                    <Link
                      href={`/mazos/${deck.id}/editar`}
                      className="btn btn-sm btn-outline flex-1"
                    >
                      <Edit className="w-4 h-4" />
                      Editar
                    </Link>
                    <button
                      onClick={() => handleDelete(deck.id)}
                      disabled={deletingId === deck.id}
                      className="btn btn-sm btn-outline text-red-400 hover:bg-red-500/10 hover:border-red-500/30"
                    >
                      {deletingId === deck.id ? (
                        <Loader2 className="w-4 h-4 animate-spin" />
                      ) : (
                        <Trash2 className="w-4 h-4" />
                      )}
                    </button>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="card p-12 text-center">
              <div className="w-16 h-16 bg-rola-gray/30 rounded-full flex items-center justify-center mx-auto mb-4">
                <Plus className="w-8 h-8 text-gray-600" />
              </div>
              <h3 className="font-display text-xl font-bold text-white mb-2">
                No tienes mazos aún
              </h3>
              <p className="text-gray-400 mb-6">
                Crea tu primer mazo para inscribirte a torneos
              </p>
              <Link href="/mazos/nuevo" className="btn btn-primary">
                <Plus className="w-5 h-5" />
                Crear Mazo
              </Link>
            </div>
          )}
        </div>
      </main>
      <Footer />
    </>
  );
}
