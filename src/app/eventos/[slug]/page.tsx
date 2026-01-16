import { notFound } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import {
  Calendar,
  MapPin,
  Users,
  DollarSign,
  Trophy,
  ArrowLeft,
  Clock,
  Gamepad2,
} from 'lucide-react';
import prisma from '@/lib/prisma';
import Header from '@/components/layout/Header';
import Footer from '@/components/layout/Footer';

interface EventPageProps {
  params: {
    slug: string;
  };
}

async function getEvent(slug: string) {
  const event = await prisma.event.findUnique({
    where: { slug },
    include: {
      creator: {
        select: {
          name: true,
          email: true,
        },
      },
    },
  });

  return event;
}

export default async function EventDetailPage({ params }: EventPageProps) {
  const event = await getEvent(params.slug);

  if (!event || !event.published) {
    notFound();
  }

  const eventDate = new Date(event.date);
  const endDate = event.endDate ? new Date(event.endDate) : null;
  const isUpcoming = eventDate > new Date();

  return (
    <>
      <Header />
      <main className="min-h-screen pt-24 pb-20">
        <div className="container-custom">
          {/* Breadcrumb */}
          <div className="mb-8">
            <Link
              href="/#eventos"
              className="inline-flex items-center gap-2 text-sm text-gray-400 hover:text-rola-gold transition-colors"
            >
              <ArrowLeft className="w-4 h-4" />
              Volver a eventos
            </Link>
          </div>

          <div className="grid lg:grid-cols-3 gap-8">
            {/* Main Content */}
            <div className="lg:col-span-2 space-y-8">
              {/* Image */}
              {event.imageUrl && (
                <div className="relative aspect-video w-full rounded-xl overflow-hidden">
                  <Image
                    src={event.imageUrl}
                    alt={event.title}
                    fill
                    className="object-cover"
                  />
                  {event.featured && (
                    <div className="absolute top-4 left-4 px-3 py-1 bg-rola-gold text-rola-black text-xs font-bold rounded-full">
                      DESTACADO
                    </div>
                  )}
                  {isUpcoming && (
                    <div className="absolute top-4 right-4 px-3 py-1 bg-green-500 text-white text-xs font-bold rounded-full">
                      PRÓXIMAMENTE
                    </div>
                  )}
                </div>
              )}

              {/* Title & Description */}
              <div>
                <h1 className="font-display text-4xl md:text-5xl font-bold text-white mb-4">
                  {event.title}
                </h1>
                <p className="text-xl text-gray-400">{event.description}</p>
              </div>

              {/* Content */}
              {event.content && (
                <div className="card p-8">
                  <h2 className="font-display text-2xl font-bold text-white mb-4">
                    Descripción del Evento
                  </h2>
                  <div
                    className="prose prose-invert max-w-none"
                    dangerouslySetInnerHTML={{ __html: event.content }}
                  />
                </div>
              )}

              {/* Prize Info */}
              {event.prizeInfo && (
                <div className="card p-8 bg-gradient-to-br from-rola-gold/10 to-transparent border-rola-gold/20">
                  <div className="flex items-start gap-4">
                    <Trophy className="w-8 h-8 text-rola-gold flex-shrink-0" />
                    <div>
                      <h3 className="font-display text-xl font-bold text-white mb-2">
                        Premios
                      </h3>
                      <div
                        className="text-gray-300"
                        dangerouslySetInnerHTML={{ __html: event.prizeInfo }}
                      />
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Sidebar */}
            <div className="space-y-6">
              {/* Event Details Card */}
              <div className="card p-6 sticky top-24">
                <h3 className="font-display text-xl font-bold text-white mb-6">
                  Detalles del Evento
                </h3>

                <div className="space-y-4">
                  {/* Date */}
                  <div className="flex items-start gap-3">
                    <Calendar className="w-5 h-5 text-rola-gold flex-shrink-0 mt-0.5" />
                    <div>
                      <p className="text-sm text-gray-400 mb-1">Fecha</p>
                      <p className="text-white font-medium">
                        {format(eventDate, "d 'de' MMMM, yyyy", { locale: es })}
                      </p>
                      {endDate && endDate.getTime() !== eventDate.getTime() && (
                        <p className="text-sm text-gray-400 mt-1">
                          hasta {format(endDate, "d 'de' MMMM, yyyy", { locale: es })}
                        </p>
                      )}
                    </div>
                  </div>

                  {/* Time */}
                  <div className="flex items-start gap-3">
                    <Clock className="w-5 h-5 text-rola-gold flex-shrink-0 mt-0.5" />
                    <div>
                      <p className="text-sm text-gray-400 mb-1">Hora</p>
                      <p className="text-white font-medium">
                        {format(eventDate, 'HH:mm', { locale: es })} hrs
                      </p>
                    </div>
                  </div>

                  {/* Location */}
                  {event.location && (
                    <div className="flex items-start gap-3">
                      <MapPin className="w-5 h-5 text-rola-gold flex-shrink-0 mt-0.5" />
                      <div>
                        <p className="text-sm text-gray-400 mb-1">Lugar</p>
                        <p className="text-white font-medium">{event.location}</p>
                      </div>
                    </div>
                  )}

                  {/* Format */}
                  {event.format && (
                    <div className="flex items-start gap-3">
                      <Gamepad2 className="w-5 h-5 text-rola-gold flex-shrink-0 mt-0.5" />
                      <div>
                        <p className="text-sm text-gray-400 mb-1">Formato</p>
                        <p className="text-white font-medium">{event.format}</p>
                      </div>
                    </div>
                  )}

                  {/* Entry Fee */}
                  {event.entryFee !== null && (
                    <div className="flex items-start gap-3">
                      <DollarSign className="w-5 h-5 text-rola-gold flex-shrink-0 mt-0.5" />
                      <div>
                        <p className="text-sm text-gray-400 mb-1">Entrada</p>
                        <p className="text-white font-medium">
                          {Number(event.entryFee) === 0 ? 'Gratis' : `$${event.entryFee} MXN`}
                        </p>
                      </div>
                    </div>
                  )}

                  {/* Max Players */}
                  {event.maxPlayers && (
                    <div className="flex items-start gap-3">
                      <Users className="w-5 h-5 text-rola-gold flex-shrink-0 mt-0.5" />
                      <div>
                        <p className="text-sm text-gray-400 mb-1">Jugadores</p>
                        <p className="text-white font-medium">
                          Máximo {event.maxPlayers} jugadores
                        </p>
                      </div>
                    </div>
                  )}
                </div>

                {/* CTA Button */}
                {isUpcoming && (
                  <div className="mt-6 pt-6 border-t border-rola-gray">
                    <Link
                      href="/contacto"
                      className="btn btn-primary w-full justify-center"
                    >
                      Inscribirse al Evento
                    </Link>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </main>
      <Footer />
    </>
  );
}

// Force dynamic rendering (no static generation during build)
export const dynamic = 'force-dynamic';
