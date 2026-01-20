'use client';

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';
import {
  User,
  Mail,
  Calendar,
  Shield,
  Camera,
  Key,
  Save,
  Loader2,
  Eye,
  EyeOff,
  Trophy,
  Layers,
  FileCheck,
  CheckCircle,
  Clock as ClockIcon,
  XCircle,
} from 'lucide-react';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import Header from '@/components/layout/Header';
import Footer from '@/components/layout/Footer';

interface UserProfile {
  id: string;
  name: string;
  email: string;
  avatar: string | null;
  konamiId: string | null;
  emailVerified: boolean;
  createdAt: string;
  role: string;
}

interface EventRegistration {
  id: string;
  status: 'PENDIENTE' | 'APROBADO' | 'RECHAZADO';
  event: {
    title: string;
    slug: string;
    date: string;
  };
}

interface Deck {
  id: string;
  name: string;
  format: string | null;
  isActive: boolean;
  cards: any[];
}

export default function PerfilPage() {
  const { data: session, status, update } = useSession();
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [user, setUser] = useState<UserProfile | null>(null);
  const [registrations, setRegistrations] = useState<EventRegistration[]>([]);
  const [decks, setDecks] = useState<Deck[]>([]);

  // Form states
  const [name, setName] = useState('');
  const [konamiId, setKonamiId] = useState('');
  const [avatar, setAvatar] = useState<File | null>(null);
  const [avatarPreview, setAvatarPreview] = useState<string | null>(null);
  const [avatarError, setAvatarError] = useState(false);

  // Password change states
  const [showPasswordForm, setShowPasswordForm] = useState(false);
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);

  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(
    null
  );

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/auth/login?callbackUrl=/perfil');
    } else if (status === 'authenticated') {
      fetchUserData();
    }
  }, [status, router]);

  const fetchUserData = async () => {
    try {
      setLoading(true);

      // Fetch user profile
      const profileRes = await fetch('/api/user/profile');
      if (profileRes.ok) {
        const data = await profileRes.json();
        setUser(data.user);
        setName(data.user.name);
        setKonamiId(data.user.konamiId || '');
        // Solo establecer avatar si es una URL de Cloudinary válida
        if (data.user.avatar && data.user.avatar.includes('cloudinary.com')) {
          setAvatarPreview(data.user.avatar);
        } else {
          setAvatarPreview(null);
        }
      }

      // Fetch registrations
      const regsRes = await fetch('/api/events/my-registrations');
      if (regsRes.ok) {
        const data = await regsRes.json();
        setRegistrations(data.registrations);
      }

      // Fetch decks
      const decksRes = await fetch('/api/decks');
      if (decksRes.ok) {
        const data = await decksRes.json();
        setDecks(data.decks);
      }
    } catch (error) {
      console.error('Error fetching user data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleAvatarChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validar tipo
    const validTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];
    if (!validTypes.includes(file.type)) {
      setMessage({ type: 'error', text: 'Solo se permiten imágenes JPG, PNG o WEBP' });
      return;
    }

    // Validar tamaño (2MB)
    if (file.size > 2 * 1024 * 1024) {
      setMessage({ type: 'error', text: 'La imagen no debe superar los 2MB' });
      return;
    }

    setAvatar(file);
    setAvatarPreview(URL.createObjectURL(file));
  };

  const handleProfileUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setMessage(null);

    try {
      // Upload avatar if changed
      if (avatar) {
        const formData = new FormData();
        formData.append('avatar', avatar);

        const avatarRes = await fetch('/api/user/avatar', {
          method: 'POST',
          body: formData,
        });

        if (!avatarRes.ok) {
          const error = await avatarRes.json();
          throw new Error(error.error || 'Error al subir avatar');
        }

        const avatarData = await avatarRes.json();
        setAvatarPreview(avatarData.user.avatar);
        setAvatar(null);
      }

      // Update profile
      const response = await fetch('/api/user/profile', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, konamiId }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Error al actualizar perfil');
      }

      const data = await response.json();
      setUser(data.user);
      setMessage({ type: 'success', text: 'Perfil actualizado exitosamente' });

      // Update session and force reload to refresh the header
      await update();

      // Small delay to ensure session is updated, then reload
      setTimeout(() => {
        window.location.reload();
      }, 500);
    } catch (error: any) {
      setMessage({ type: 'error', text: error.message || 'Error al actualizar perfil' });
    } finally {
      setSaving(false);
    }
  };

  const handlePasswordChange = async (e: React.FormEvent) => {
    e.preventDefault();
    setMessage(null);

    if (newPassword !== confirmPassword) {
      setMessage({ type: 'error', text: 'Las contraseñas no coinciden' });
      return;
    }

    setSaving(true);

    try {
      const response = await fetch('/api/user/change-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ currentPassword, newPassword }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Error al cambiar contraseña');
      }

      setMessage({ type: 'success', text: 'Contraseña actualizada exitosamente' });
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
      setShowPasswordForm(false);
    } catch (error: any) {
      setMessage({ type: 'error', text: error.message || 'Error al cambiar contraseña' });
    } finally {
      setSaving(false);
    }
  };

  if (status === 'loading' || loading) {
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

  if (!user) {
    return null;
  }

  const pendingRegs = registrations.filter((r) => r.status === 'PENDIENTE').length;
  const approvedRegs = registrations.filter((r) => r.status === 'APROBADO').length;

  return (
    <>
      <Header />
      <main className="min-h-screen pt-24 pb-20 bg-rola-black">
        <div className="container-custom">
          {/* Header */}
          <div className="mb-8">
            <h1 className="font-display text-4xl md:text-5xl font-bold text-white mb-2">
              Mi Perfil
            </h1>
            <p className="text-xl text-gray-400">Gestiona tu información personal</p>
          </div>

          {/* Message */}
          {message && (
            <div
              className={`mb-6 p-4 rounded-lg ${
                message.type === 'success'
                  ? 'bg-green-500/10 border border-green-500/50 text-green-500'
                  : 'bg-red-500/10 border border-red-500/50 text-red-500'
              }`}
            >
              {message.text}
            </div>
          )}

          <div className="grid lg:grid-cols-3 gap-8">
            {/* Left Column - Profile Info */}
            <div className="lg:col-span-2 space-y-6">
              {/* Profile Form */}
              <div className="card p-8">
                <h2 className="font-display text-2xl font-bold text-white mb-6">
                  Información Personal
                </h2>

                <form onSubmit={handleProfileUpdate} className="space-y-6">
                  {/* Avatar */}
                  <div className="flex items-center gap-6">
                    <div className="relative">
                      <div className="w-24 h-24 rounded-full overflow-hidden bg-rola-gray border-2 border-rola-gold">
                        {avatarPreview && !avatarError ? (
                          <Image
                            src={avatarPreview}
                            alt={name}
                            width={96}
                            height={96}
                            className="w-full h-full object-cover"
                            onError={() => setAvatarError(true)}
                          />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center">
                            <User className="w-12 h-12 text-gray-600" />
                          </div>
                        )}
                      </div>
                      <label
                        htmlFor="avatar-upload"
                        className="absolute bottom-0 right-0 p-2 bg-rola-gold rounded-full cursor-pointer hover:bg-rola-gold-dark transition-colors"
                      >
                        <Camera className="w-4 h-4 text-rola-black" />
                        <input
                          id="avatar-upload"
                          type="file"
                          accept="image/jpeg,image/jpg,image/png,image/webp"
                          onChange={handleAvatarChange}
                          className="hidden"
                        />
                      </label>
                    </div>
                    <div>
                      <p className="text-white font-medium mb-1">Foto de Perfil</p>
                      <p className="text-sm text-gray-400">
                        JPG, PNG o WEBP. Máximo 2MB.
                      </p>
                    </div>
                  </div>

                  {/* Name */}
                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2">
                      <User className="w-4 h-4 inline mr-2" />
                      Nombre Completo
                    </label>
                    <input
                      type="text"
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      className="input"
                      required
                    />
                  </div>

                  {/* Email (read-only) */}
                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2">
                      <Mail className="w-4 h-4 inline mr-2" />
                      Correo Electrónico
                    </label>
                    <input
                      type="email"
                      value={user.email}
                      className="input bg-rola-gray cursor-not-allowed"
                      disabled
                    />
                    <p className="text-xs text-gray-500 mt-1">
                      El email no puede ser modificado
                    </p>
                  </div>

                  {/* Konami ID */}
                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2">
                      <Trophy className="w-4 h-4 inline mr-2" />
                      Konami ID (Opcional)
                    </label>
                    <input
                      type="text"
                      value={konamiId}
                      onChange={(e) => setKonamiId(e.target.value)}
                      placeholder="Tu Konami ID"
                      className="input"
                    />
                  </div>

                  {/* Submit */}
                  <button
                    type="submit"
                    disabled={saving}
                    className="btn btn-primary"
                  >
                    {saving ? (
                      <>
                        <Loader2 className="w-4 h-4 animate-spin" />
                        Guardando...
                      </>
                    ) : (
                      <>
                        <Save className="w-4 h-4" />
                        Guardar Cambios
                      </>
                    )}
                  </button>
                </form>
              </div>

              {/* Change Password */}
              <div className="card p-8">
                <div className="flex items-center justify-between mb-6">
                  <h2 className="font-display text-2xl font-bold text-white">
                    Cambiar Contraseña
                  </h2>
                  {!showPasswordForm && (
                    <button
                      onClick={() => setShowPasswordForm(true)}
                      className="btn btn-secondary text-sm"
                    >
                      <Key className="w-4 h-4" />
                      Cambiar
                    </button>
                  )}
                </div>

                {showPasswordForm && (
                  <form onSubmit={handlePasswordChange} className="space-y-4">
                    {/* Current Password */}
                    <div>
                      <label className="block text-sm font-medium text-gray-300 mb-2">
                        Contraseña Actual
                      </label>
                      <div className="relative">
                        <input
                          type={showCurrentPassword ? 'text' : 'password'}
                          value={currentPassword}
                          onChange={(e) => setCurrentPassword(e.target.value)}
                          className="input pr-10"
                          required
                        />
                        <button
                          type="button"
                          onClick={() => setShowCurrentPassword(!showCurrentPassword)}
                          className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-white"
                        >
                          {showCurrentPassword ? (
                            <EyeOff className="w-5 h-5" />
                          ) : (
                            <Eye className="w-5 h-5" />
                          )}
                        </button>
                      </div>
                    </div>

                    {/* New Password */}
                    <div>
                      <label className="block text-sm font-medium text-gray-300 mb-2">
                        Nueva Contraseña
                      </label>
                      <div className="relative">
                        <input
                          type={showNewPassword ? 'text' : 'password'}
                          value={newPassword}
                          onChange={(e) => setNewPassword(e.target.value)}
                          className="input pr-10"
                          required
                          minLength={6}
                        />
                        <button
                          type="button"
                          onClick={() => setShowNewPassword(!showNewPassword)}
                          className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-white"
                        >
                          {showNewPassword ? (
                            <EyeOff className="w-5 h-5" />
                          ) : (
                            <Eye className="w-5 h-5" />
                          )}
                        </button>
                      </div>
                    </div>

                    {/* Confirm Password */}
                    <div>
                      <label className="block text-sm font-medium text-gray-300 mb-2">
                        Confirmar Nueva Contraseña
                      </label>
                      <input
                        type="password"
                        value={confirmPassword}
                        onChange={(e) => setConfirmPassword(e.target.value)}
                        className="input"
                        required
                      />
                    </div>

                    <div className="flex gap-3">
                      <button
                        type="submit"
                        disabled={saving}
                        className="btn btn-primary"
                      >
                        {saving ? (
                          <>
                            <Loader2 className="w-4 h-4 animate-spin" />
                            Actualizando...
                          </>
                        ) : (
                          'Actualizar Contraseña'
                        )}
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          setShowPasswordForm(false);
                          setCurrentPassword('');
                          setNewPassword('');
                          setConfirmPassword('');
                        }}
                        className="btn btn-secondary"
                      >
                        Cancelar
                      </button>
                    </div>
                  </form>
                )}
              </div>
            </div>

            {/* Right Column - Stats & Summary */}
            <div className="space-y-6">
              {/* Account Info */}
              <div className="card p-6">
                <h3 className="font-display text-xl font-bold text-white mb-4">
                  Información de Cuenta
                </h3>

                <div className="space-y-3">
                  <div className="flex items-center gap-3 text-sm">
                    <Shield className="w-4 h-4 text-rola-gold" />
                    <div>
                      <p className="text-gray-400">Rol</p>
                      <p className="text-white font-medium">{user.role}</p>
                    </div>
                  </div>

                  <div className="flex items-center gap-3 text-sm">
                    <Calendar className="w-4 h-4 text-rola-gold" />
                    <div>
                      <p className="text-gray-400">Miembro desde</p>
                      <p className="text-white font-medium">
                        {user.createdAt
                          ? format(new Date(user.createdAt), "d 'de' MMMM, yyyy", {
                              locale: es,
                            })
                          : 'No disponible'}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-3 text-sm">
                    <Mail className="w-4 h-4 text-rola-gold" />
                    <div>
                      <p className="text-gray-400">Estado del Email</p>
                      <p className={user.emailVerified ? 'text-green-500' : 'text-yellow-500'}>
                        {user.emailVerified ? 'Verificado' : 'Sin verificar'}
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Stats Cards */}
              <div className="card p-6">
                <h3 className="font-display text-xl font-bold text-white mb-4">
                  Resumen
                </h3>

                <div className="space-y-4">
                  {/* Decks */}
                  <Link
                    href="/mazos"
                    className="flex items-center justify-between p-4 bg-rola-gray rounded-lg hover:bg-rola-gray/70 transition-colors"
                  >
                    <div className="flex items-center gap-3">
                      <Layers className="w-5 h-5 text-rola-gold" />
                      <div>
                        <p className="text-white font-medium">Mazos Creados</p>
                        <p className="text-sm text-gray-400">
                          {decks.filter((d) => d.isActive).length} activos
                        </p>
                      </div>
                    </div>
                    <span className="text-2xl font-bold text-white">{decks.length}</span>
                  </Link>

                  {/* Registrations */}
                  <Link
                    href="/mis-inscripciones"
                    className="flex items-center justify-between p-4 bg-rola-gray rounded-lg hover:bg-rola-gray/70 transition-colors"
                  >
                    <div className="flex items-center gap-3">
                      <FileCheck className="w-5 h-5 text-rola-gold" />
                      <div>
                        <p className="text-white font-medium">Inscripciones</p>
                        <p className="text-sm text-gray-400">
                          {approvedRegs} aprobadas
                        </p>
                      </div>
                    </div>
                    <span className="text-2xl font-bold text-white">
                      {registrations.length}
                    </span>
                  </Link>
                </div>
              </div>

              {/* Recent Registrations */}
              {registrations.length > 0 && (
                <div className="card p-6">
                  <h3 className="font-display text-xl font-bold text-white mb-4">
                    Inscripciones Recientes
                  </h3>

                  <div className="space-y-3">
                    {registrations.slice(0, 3).map((reg) => (
                      <Link
                        key={reg.id}
                        href={`/eventos/${reg.event.slug}`}
                        className="block p-3 bg-rola-gray rounded-lg hover:bg-rola-gray/70 transition-colors"
                      >
                        <div className="flex items-start justify-between gap-2">
                          <div className="flex-1 min-w-0">
                            <p className="text-white font-medium text-sm truncate">
                              {reg.event.title}
                            </p>
                            <p className="text-xs text-gray-400">
                              {format(new Date(reg.event.date), "d 'de' MMM", {
                                locale: es,
                              })}
                            </p>
                          </div>
                          <div>
                            {reg.status === 'APROBADO' && (
                              <CheckCircle className="w-4 h-4 text-green-500" />
                            )}
                            {reg.status === 'PENDIENTE' && (
                              <ClockIcon className="w-4 h-4 text-yellow-500" />
                            )}
                            {reg.status === 'RECHAZADO' && (
                              <XCircle className="w-4 h-4 text-red-500" />
                            )}
                          </div>
                        </div>
                      </Link>
                    ))}
                  </div>

                  <Link
                    href="/mis-inscripciones"
                    className="block mt-4 text-center text-sm text-rola-gold hover:underline"
                  >
                    Ver todas las inscripciones →
                  </Link>
                </div>
              )}
            </div>
          </div>
        </div>
      </main>
      <Footer />
    </>
  );
}
