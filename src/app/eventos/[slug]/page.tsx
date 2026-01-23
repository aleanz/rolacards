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
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import prisma from '@/lib/prisma';
import Header from '@/components/layout/Header';
import Footer from '@/components/layout/Footer';
import RegistrationForm from '@/components/eventos/RegistrationForm';

interface EventPageProps {
  params: {
    slug: string;
  };
}

async function getEvent(slug: string, userId?: string) {
  const event = await prisma.event.findUnique({
    where: { slug },
    include: {
      User: {
        select: {
          name: true,
          email: true,
        },
      },
      EventRegistration: {
        where: {
          status: { in: ['PENDIENTE', 'APROBADO'] },
        },
        include: {
          User: {
            select: {
              id: true,
              name: true,
            },
          },
        },
      },
    },
  });

  return event;
}

export default async function EventDetailPage({ params }: EventPageProps) {
  const session = await getServerSession(authOptions);
  const event = await getEvent(params.slug, session?.user?.id);

  if (!event || !event.published) {
    notFound();
  }

  const eventDate = new Date(event.date);
  const endDate = event.endDate ? new Date(event.endDate) : null;
  const isUpcoming = eventDate > new Date();

  // Verificar si el usuario ya está registrado
  const userRegistration = session?.user?.id
    ? event.EventRegistration.find((reg) => reg.User.id === session.user.id)
    : null;

  // Contar registros por status
  const approvedRegistrations = event.EventRegistration.filter(reg => reg.status === 'APROBADO');
  const currentRegistrations = event.EventRegistration.length;

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

          {/* Detectar si hay contenido adicional para decidir el layout */}
          {(() => {
            const hasAdditionalContent = event.imageUrl || event.description || event.content || event.prizeInfo;

            return (
              <div className={hasAdditionalContent ? "grid lg:grid-cols-3 gap-8" : "max-w-4xl mx-auto"}>
                {/* Main Content */}
                {hasAdditionalContent && (
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
                      {event.description && (
                        <p className="text-xl text-gray-400">{event.description}</p>
                      )}
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
                )}

                {/* Título simple cuando no hay contenido adicional */}
                {!hasAdditionalContent && (
                  <div className="mb-8">
                    <h1 className="font-display text-4xl md:text-5xl font-bold text-white text-center">
                      {event.title}
                    </h1>
                  </div>
                )}

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
                    <div className="flex-1">
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
                    <div className="flex-1">
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
                      <div className="flex-1">
                        <p className="text-sm text-gray-400 mb-1">Lugar</p>
                        <p className="text-white font-medium">{event.location}</p>
                      </div>
                    </div>
                  )}

                  {/* Format */}
                  {event.format && (
                    <div className="flex items-start gap-3">
                      <Gamepad2 className="w-5 h-5 text-rola-gold flex-shrink-0 mt-0.5" />
                      <div className="flex-1">
                        <p className="text-sm text-gray-400 mb-1">Formato</p>
                        <p className="text-white font-medium">{event.format}</p>
                      </div>
                    </div>
                  )}

                  {/* Entry Fee */}
                  <div className="flex items-start gap-3">
                    <DollarSign className="w-5 h-5 text-rola-gold flex-shrink-0 mt-0.5" />
                    <div className="flex-1">
                      <p className="text-sm text-gray-400 mb-1">Precio</p>
                      <p className="text-white font-medium">
                        {!event.entryFee || Number(event.entryFee) === 0 ? 'GRATIS' : `$${event.entryFee} MXN`}
                      </p>
                    </div>
                  </div>

                  {/* Max Players & Current Count */}
                  {event.maxPlayers && (
                    <div className="flex items-start gap-3">
                      <Users className="w-5 h-5 text-rola-gold flex-shrink-0 mt-0.5" />
                      <div className="flex-1">
                        <p className="text-sm text-gray-400 mb-1">Cupos</p>
                        <div className="flex items-center justify-between mb-2">
                          <p className="text-white font-medium">
                            {approvedRegistrations.length} / {event.maxPlayers}
                          </p>
                          <span className={`text-xs px-2 py-1 rounded-full ${
                            approvedRegistrations.length >= event.maxPlayers
                              ? 'bg-red-500/20 text-red-400'
                              : approvedRegistrations.length >= event.maxPlayers * 0.8
                              ? 'bg-yellow-500/20 text-yellow-400'
                              : 'bg-green-500/20 text-green-400'
                          }`}>
                            {approvedRegistrations.length >= event.maxPlayers
                              ? 'Lleno'
                              : `${event.maxPlayers - approvedRegistrations.length} disponibles`
                            }
                          </span>
                        </div>
                        {/* Progress bar */}
                        <div className="w-full bg-gray-700 rounded-full h-2 overflow-hidden">
                          <div
                            className={`h-full transition-all ${
                              approvedRegistrations.length >= event.maxPlayers
                                ? 'bg-red-500'
                                : approvedRegistrations.length >= event.maxPlayers * 0.8
                                ? 'bg-yellow-500'
                                : 'bg-green-500'
                            }`}
                            style={{
                              width: `${Math.min((approvedRegistrations.length / event.maxPlayers) * 100, 100)}%`
                            }}
                          />
                        </div>
                      </div>
                    </div>
                  )}
                </div>

                {/* Registration Status */}
                {isUpcoming && session?.user?.id && userRegistration && (
                  <div className="mt-6 pt-6 border-t border-rola-gray">
                    <div
                      className={`p-4 rounded-lg text-center ${
                        userRegistration.status === 'APROBADO'
                          ? 'bg-green-500/10 border border-green-500/50'
                          : userRegistration.status === 'PENDIENTE'
                          ? 'bg-yellow-500/10 border border-yellow-500/50'
                          : 'bg-red-500/10 border border-red-500/50'
                      }`}
                    >
                      <p
                        className={`font-medium ${
                          userRegistration.status === 'APROBADO'
                            ? 'text-green-500'
                            : userRegistration.status === 'PENDIENTE'
                            ? 'text-yellow-500'
                            : 'text-red-500'
                        }`}
                      >
                        {userRegistration.status === 'APROBADO'
                          ? '✓ Inscripción Aprobada'
                          : userRegistration.status === 'PENDIENTE'
                          ? '⏳ Solicitud Pendiente'
                          : '✗ Solicitud Rechazada'}
                      </p>
                      {userRegistration.status === 'RECHAZADO' &&
                        userRegistration.rejectionNote && (
                          <p className="text-sm text-gray-400 mt-2">
                            {userRegistration.rejectionNote}
                          </p>
                        )}
                    </div>
                  </div>
                )}

              </div>

              {/* Registration Form - Only if logged in and not registered yet */}
              {isUpcoming && session?.user?.id && !userRegistration && (
                <RegistrationForm
                  eventId={event.id}
                  eventFormat={event.format}
                  entryFee={event.entryFee?.toString() || null}
                  maxPlayers={event.maxPlayers}
                  currentRegistrations={currentRegistrations}
                  userId={session.user.id}
                />
              )}

              {/* Login CTA - Only if not logged in */}
              {isUpcoming && !session?.user?.id && (
                <div className="card p-8">
                  <h3 className="font-display text-2xl font-bold text-white mb-4">
                    Inscribirse al Evento
                  </h3>
                  <div className="bg-blue-500/10 border border-blue-500/30 rounded-lg p-6 mb-6">
                    <p className="text-gray-300 text-center mb-4">
                      Debes iniciar sesión para poder inscribirte a este evento
                    </p>
                    <Link
                      href={`/auth/login?callbackUrl=/eventos/${event.slug}`}
                      className="btn btn-primary w-full justify-center"
                    >
                      Iniciar Sesión
                    </Link>
                    <div className="mt-4 text-center">
                      <p className="text-sm text-gray-400">
                        ¿No tienes cuenta?{' '}
                        <Link
                          href={`/auth/register?callbackUrl=/eventos/${event.slug}`}
                          className="text-rola-gold hover:underline"
                        >
                          Regístrate aquí
                        </Link>
                      </p>
                    </div>
                  </div>
                </div>
              )}
                </div>
              </div>
            );
          })()}
        </div>
      </main>
      <Footer />
    </>
  );
}

// Force dynamic rendering (no static generation during build)
export const dynamic = 'force-dynamic';
