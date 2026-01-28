'use client';

import { useEffect, useState } from 'react';
import { useSession } from 'next-auth/react';
import toast from 'react-hot-toast';
import { useModal } from '@/hooks/useModal';
import {
  Users as UsersIcon,
  Plus,
  Edit,
  Trash2,
  Search,
  X,
  Save,
  Upload,
  User,
  Layers,
  Calendar,
  CheckCircle,
  Clock,
  XCircle,
  ChevronDown,
  ChevronUp,
  Eye,
} from 'lucide-react';
import Image from 'next/image';
import PageHeader from '@/components/admin/PageHeader';

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
  format: string | null;
  isActive: boolean;
  createdAt: string;
  DeckCard?: DeckCard[];
}

interface EventRegistration {
  id: string;
  status: 'PENDIENTE' | 'APROBADO' | 'RECHAZADO';
  createdAt: string;
  Event: {
    id: string;
    title: string;
    date: string;
    type: string;
    format: string | null;
  };
  Deck: {
    id: string;
    name: string;
  };
}

interface User {
  id: string;
  email: string;
  name: string;
  role: string;
  avatar: string | null;
  emailVerified: boolean;
  createdAt: string;
  updatedAt?: string;
  Deck?: Deck[];
  EventRegistration?: EventRegistration[];
}

interface UserFormData {
  email: string;
  password: string;
  name: string;
  role: 'ADMIN' | 'STAFF' | 'CLIENTE';
  avatar: string;
}

export default function UsuariosPage() {
  const { data: session } = useSession();
  const [users, setUsers] = useState<User[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingUser, setEditingUser] = useState<User | null>(null);
  const [formData, setFormData] = useState<UserFormData>({
    email: '',
    password: '',
    name: '',
    role: 'STAFF',
    avatar: '',
  });
  const [formError, setFormError] = useState('');
  const [isUploading, setIsUploading] = useState(false);
  const [avatarPreview, setAvatarPreview] = useState('');
  const [expandedUsers, setExpandedUsers] = useState<Set<string>>(new Set());
  const [selectedDeck, setSelectedDeck] = useState<Deck | null>(null);
  const [showDeckModal, setShowDeckModal] = useState(false);

  const openDeckModal = (deck: Deck) => {
    setSelectedDeck(deck);
    setShowDeckModal(true);
  };

  const closeDeckModal = () => {
    setShowDeckModal(false);
    setSelectedDeck(null);
  };

  const { handleBackdropClick: handleDeckBackdropClick } = useModal({ isOpen: showDeckModal, onClose: closeDeckModal });

  const toggleUserExpanded = (userId: string) => {
    setExpandedUsers(prev => {
      const newSet = new Set(prev);
      if (newSet.has(userId)) {
        newSet.delete(userId);
      } else {
        newSet.add(userId);
      }
      return newSet;
    });
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'APROBADO':
        return <CheckCircle className="w-3 h-3 text-green-400" />;
      case 'PENDIENTE':
        return <Clock className="w-3 h-3 text-yellow-400" />;
      case 'RECHAZADO':
        return <XCircle className="w-3 h-3 text-red-400" />;
      default:
        return null;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'APROBADO':
        return 'text-green-400';
      case 'PENDIENTE':
        return 'text-yellow-400';
      case 'RECHAZADO':
        return 'text-red-400';
      default:
        return 'text-gray-400';
    }
  };

  const formatDate = (date: string) => {
    return new Date(date).toLocaleDateString('es-MX', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
    });
  };

  useEffect(() => {
    fetchUsers();
  }, []);

  const fetchUsers = async () => {
    try {
      const response = await fetch('/api/users', {
        cache: 'no-store',
      });
      if (response.ok) {
        const data = await response.json();
        setUsers(data);
      }
    } catch (error) {
      console.error('Error fetching users:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Mostrar preview
    const reader = new FileReader();
    reader.onloadend = () => {
      setAvatarPreview(reader.result as string);
    };
    reader.readAsDataURL(file);

    // Subir archivo
    setIsUploading(true);
    try {
      const formData = new FormData();
      formData.append('file', file);
      formData.append('type', 'avatars');

      const response = await fetch('/api/upload', {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) {
        const error = await response.json();
        setFormError(error.error || 'Error al subir imagen');
        return;
      }

      const data = await response.json();
      setFormData((prev) => ({ ...prev, avatar: data.url }));
    } catch (error) {
      setFormError('Error al subir imagen');
    } finally {
      setIsUploading(false);
    }
  };

  const handleOpenModal = (user?: User) => {
    if (user) {
      setEditingUser(user);
      setFormData({
        email: user.email,
        password: '',
        name: user.name,
        role: user.role as 'ADMIN' | 'STAFF' | 'CLIENTE',
        avatar: user.avatar || '',
      });
      setAvatarPreview(user.avatar || '');
    } else {
      setEditingUser(null);
      setFormData({
        email: '',
        password: '',
        name: '',
        role: 'STAFF',
        avatar: '',
      });
      setAvatarPreview('');
    }
    setFormError('');
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setEditingUser(null);
    setFormError('');
  };

  const { handleBackdropClick } = useModal({ isOpen: isModalOpen, onClose: handleCloseModal });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError('');

    try {
      if (editingUser) {
        // Actualizar usuario
        const response = await fetch(`/api/users/${editingUser.id}`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(formData),
        });

        if (!response.ok) {
          const error = await response.json();
          setFormError(error.error || 'Error al actualizar usuario');
          return;
        }
      } else {
        // Crear usuario
        const response = await fetch('/api/users', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(formData),
        });

        if (!response.ok) {
          const error = await response.json();
          setFormError(error.error || 'Error al crear usuario');
          return;
        }
      }

      await fetchUsers();
      handleCloseModal();
    } catch (error) {
      setFormError('Ocurrió un error. Intenta de nuevo.');
    }
  };

  const handleDelete = async (userId: string) => {
    // Usar toast.promise para mejor UX
    const deletePromise = new Promise(async (resolve, reject) => {
      try {
        const response = await fetch(`/api/users/${userId}`, {
          method: 'DELETE',
        });

        if (response.ok) {
          await fetchUsers();
          resolve('Usuario eliminado correctamente');
        } else {
          const error = await response.json();
          reject(error.error || 'Error al eliminar usuario');
        }
      } catch (error) {
        reject('Error al eliminar usuario');
      }
    });

    toast.promise(deletePromise, {
      loading: 'Eliminando usuario...',
      success: (msg) => msg as string,
      error: (err) => err as string,
    });
  };

  const filteredUsers = users.filter(
    (user) =>
      user.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      user.email.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const isAdmin = session?.user.role === 'ADMIN';

  return (
    <div className="space-y-4 sm:space-y-6">
      {/* Header */}
      <PageHeader
        title="Gestión de Usuarios"
        description="Administra los usuarios del sistema"
        action={
          isAdmin ? (
            <button onClick={() => handleOpenModal()} className="btn btn-primary btn-sm sm:btn w-full sm:w-auto">
              <Plus className="w-4 h-4 sm:w-5 sm:h-5" />
              <span className="hidden sm:inline">Nuevo Usuario</span>
              <span className="sm:hidden">Nuevo</span>
            </button>
          ) : undefined
        }
      />

      {/* Search */}
      <div className="card p-4">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-500" />
          <input
            type="text"
            placeholder="Buscar usuarios..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2 bg-rola-gray/50 border border-rola-gray rounded-lg text-white placeholder-gray-500 focus:outline-none focus:border-rola-gold transition-colors"
          />
        </div>
      </div>

      {/* Users List */}
      {isLoading ? (
        <div className="text-center py-12">
          <div className="w-12 h-12 border-4 border-rola-gold border-t-transparent rounded-full animate-spin mx-auto mb-4" />
          <p className="text-gray-400">Cargando usuarios...</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredUsers.map((user) => (
            <div key={user.id} className="card p-6">
              {/* Avatar */}
              <div className="flex items-start justify-between mb-4">
                <div className="flex items-center gap-3">
                  {user.avatar ? (
                    <img
                      src={user.avatar}
                      alt={user.name}
                      className="w-12 h-12 rounded-full object-cover"
                    />
                  ) : (
                    <div className="w-12 h-12 rounded-full bg-rola-gold/20 flex items-center justify-center">
                      <User className="w-6 h-6 text-rola-gold" />
                    </div>
                  )}
                  <div>
                    <h3 className="font-semibold text-white">{user.name}</h3>
                    <p className="text-sm text-gray-400">{user.email}</p>
                  </div>
                </div>
              </div>

              {/* Role Badge & Email Verification */}
              <div className="mb-4 flex flex-wrap gap-2">
                <span
                  className={`inline-block px-2 py-1 text-xs rounded ${
                    user.role === 'ADMIN'
                      ? 'bg-rola-gold/20 text-rola-gold'
                      : user.role === 'STAFF'
                      ? 'bg-blue-500/20 text-blue-400'
                      : 'bg-purple-500/20 text-purple-400'
                  }`}
                >
                  {user.role}
                </span>
                {user.role === 'CLIENTE' && !user.emailVerified && (
                  <span className="inline-block px-2 py-1 text-xs rounded bg-yellow-500/20 text-yellow-500">
                    ⚠️ No verificado
                  </span>
                )}
              </div>

              {/* Stats summary */}
              {user.role === 'CLIENTE' && (
                <div className="flex gap-4 mb-4 text-sm">
                  <div className="flex items-center gap-1 text-gray-400">
                    <Layers className="w-4 h-4" />
                    <span>{user.Deck?.length || 0} mazos</span>
                  </div>
                  <div className="flex items-center gap-1 text-gray-400">
                    <Calendar className="w-4 h-4" />
                    <span>{user.EventRegistration?.length || 0} eventos</span>
                  </div>
                </div>
              )}

              {/* Expandable section for decks and events */}
              {user.role === 'CLIENTE' && ((user.Deck && user.Deck.length > 0) || (user.EventRegistration && user.EventRegistration.length > 0)) && (
                <>
                  <button
                    onClick={() => toggleUserExpanded(user.id)}
                    className="w-full flex items-center justify-between py-2 px-3 bg-rola-gray/30 rounded-lg text-sm text-gray-400 hover:bg-rola-gray/50 transition-colors mb-4"
                  >
                    <span>Ver mazos y eventos</span>
                    {expandedUsers.has(user.id) ? (
                      <ChevronUp className="w-4 h-4" />
                    ) : (
                      <ChevronDown className="w-4 h-4" />
                    )}
                  </button>

                  {expandedUsers.has(user.id) && (
                    <div className="space-y-4 mb-4">
                      {/* Decks Section */}
                      {user.Deck && user.Deck.length > 0 && (
                        <div className="p-3 bg-rola-gray/20 rounded-lg">
                          <h4 className="text-xs font-semibold text-gray-300 mb-2 flex items-center gap-2">
                            <Layers className="w-3 h-3" />
                            Mazos ({user.Deck.length})
                          </h4>
                          <div className="space-y-2 max-h-32 overflow-y-auto">
                            {user.Deck.map((deck) => (
                              <div
                                key={deck.id}
                                className="flex items-center justify-between text-xs py-1 px-2 bg-rola-darker/50 rounded group"
                              >
                                <button
                                  onClick={() => openDeckModal(deck)}
                                  className="text-white truncate flex-1 text-left hover:text-rola-gold transition-colors"
                                  title="Ver cartas del mazo"
                                >
                                  {deck.name}
                                </button>
                                <div className="flex items-center gap-2">
                                  {deck.format && (
                                    <span className="text-gray-500 capitalize">{deck.format}</span>
                                  )}
                                  {!deck.isActive && (
                                    <span className="text-red-400 text-[10px]">Inactivo</span>
                                  )}
                                  <button
                                    onClick={() => openDeckModal(deck)}
                                    className="p-1 text-gray-500 hover:text-rola-gold transition-colors opacity-0 group-hover:opacity-100"
                                    title="Ver cartas del mazo"
                                  >
                                    <Eye className="w-3 h-3" />
                                  </button>
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}

                      {/* Event Registrations Section */}
                      {user.EventRegistration && user.EventRegistration.length > 0 && (
                        <div className="p-3 bg-rola-gray/20 rounded-lg">
                          <h4 className="text-xs font-semibold text-gray-300 mb-2 flex items-center gap-2">
                            <Calendar className="w-3 h-3" />
                            Inscripciones a Eventos ({user.EventRegistration.length})
                          </h4>
                          <div className="space-y-2 max-h-40 overflow-y-auto">
                            {user.EventRegistration.map((registration) => (
                              <div
                                key={registration.id}
                                className="text-xs py-2 px-2 bg-rola-darker/50 rounded"
                              >
                                <div className="flex items-start justify-between gap-2">
                                  <div className="flex-1 min-w-0">
                                    <p className="text-white font-medium truncate">
                                      {registration.Event.title}
                                    </p>
                                    <p className="text-gray-500 text-[10px]">
                                      {formatDate(registration.Event.date)}
                                    </p>
                                  </div>
                                  <div className="flex items-center gap-1">
                                    {getStatusIcon(registration.status)}
                                    <span className={`text-[10px] ${getStatusColor(registration.status)}`}>
                                      {registration.status}
                                    </span>
                                  </div>
                                </div>
                                <div className="mt-1 flex items-center justify-between text-[10px] text-gray-500">
                                  <span>Mazo: {registration.Deck.name}</span>
                                  {registration.Event.format && (
                                    <span className="capitalize">{registration.Event.format}</span>
                                  )}
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  )}
                </>
              )}

              {/* Actions */}
              {isAdmin && (
                <div className="flex gap-2 pt-4 border-t border-rola-gray/30">
                  <button
                    onClick={() => handleOpenModal(user)}
                    className="flex-1 btn btn-ghost btn-sm"
                  >
                    <Edit className="w-4 h-4" />
                    Editar
                  </button>
                  {session.user.id !== user.id && (
                    <button
                      onClick={() => handleDelete(user.id)}
                      className="btn btn-ghost btn-sm text-red-400 hover:bg-red-500/10"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  )}
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {filteredUsers.length === 0 && !isLoading && (
        <div className="text-center py-12 card">
          <UsersIcon className="w-12 h-12 text-gray-600 mx-auto mb-4" />
          <p className="text-gray-400">No se encontraron usuarios</p>
        </div>
      )}

      {/* Modal */}
      {isModalOpen && (
        <div
          className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50"
          onClick={handleBackdropClick}
        >
          <div className="card p-6 max-w-md w-full max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-6">
              <h2 className="font-display text-2xl font-bold text-white">
                {editingUser ? 'Editar Usuario' : 'Nuevo Usuario'}
              </h2>
              <button
                onClick={handleCloseModal}
                className="text-gray-400 hover:text-white transition-colors"
              >
                <X className="w-6 h-6" />
              </button>
            </div>

            {formError && (
              <div className="mb-4 p-3 rounded-lg bg-red-500/10 border border-red-500/20 text-red-400 text-sm">
                {formError}
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-4">
              {/* Avatar Upload */}
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Foto de perfil
                </label>
                <div className="flex items-center gap-4">
                  {avatarPreview || formData.avatar ? (
                    <img
                      src={avatarPreview || formData.avatar}
                      alt="Avatar preview"
                      className="w-20 h-20 rounded-full object-cover"
                    />
                  ) : (
                    <div className="w-20 h-20 rounded-full bg-rola-gray/50 flex items-center justify-center">
                      <User className="w-10 h-10 text-gray-500" />
                    </div>
                  )}
                  <div className="flex-1">
                    <label className="btn btn-outline btn-sm cursor-pointer">
                      <Upload className="w-4 h-4" />
                      {isUploading ? 'Subiendo...' : 'Subir imagen'}
                      <input
                        type="file"
                        accept="image/*"
                        onChange={handleFileUpload}
                        className="hidden"
                        disabled={isUploading}
                      />
                    </label>
                    <p className="text-xs text-gray-500 mt-1">
                      JPG, PNG o GIF (máx. 5MB)
                    </p>
                  </div>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Nombre completo
                </label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="w-full px-4 py-2 bg-rola-gray/50 border border-rola-gray rounded-lg text-white placeholder-gray-500 focus:outline-none focus:border-rola-gold transition-colors"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Email
                </label>
                <input
                  type="email"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  className="w-full px-4 py-2 bg-rola-gray/50 border border-rola-gray rounded-lg text-white placeholder-gray-500 focus:outline-none focus:border-rola-gold transition-colors"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Contraseña {editingUser && '(dejar vacío para mantener)'}
                </label>
                <input
                  type="password"
                  value={formData.password}
                  onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                  className="w-full px-4 py-2 bg-rola-gray/50 border border-rola-gray rounded-lg text-white placeholder-gray-500 focus:outline-none focus:border-rola-gold transition-colors"
                  required={!editingUser}
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Rol
                </label>
                <select
                  value={formData.role}
                  onChange={(e) =>
                    setFormData({ ...formData, role: e.target.value as 'ADMIN' | 'STAFF' | 'CLIENTE' })
                  }
                  className="w-full px-4 py-2 bg-rola-gray/50 border border-rola-gray rounded-lg text-white focus:outline-none focus:border-rola-gold transition-colors"
                >
                  <option value="CLIENTE">Cliente</option>
                  <option value="STAFF">Staff</option>
                  <option value="ADMIN">Admin</option>
                </select>
              </div>

              {/* Verificación de email - solo para clientes no verificados */}
              {editingUser && editingUser.role === 'CLIENTE' && !editingUser.emailVerified && (
                <div className="bg-yellow-500/10 border border-yellow-500/30 rounded-lg p-4">
                  <p className="text-sm text-yellow-500 mb-3">
                    ⚠️ Email no verificado. El usuario no podrá iniciar sesión hasta verificar su email.
                  </p>
                  <button
                    type="button"
                    onClick={async () => {
                      const verifyPromise = new Promise(async (resolve, reject) => {
                        try {
                          const response = await fetch(`/api/users/${editingUser.id}/verify-email`, {
                            method: 'POST',
                          });
                          if (response.ok) {
                            // Actualizar el estado del usuario que se está editando
                            const updatedUser = {
                              ...editingUser,
                              emailVerified: true,
                            };
                            setEditingUser(updatedUser);

                            // Actualizar también la lista de usuarios con un nuevo array
                            setUsers(prevUsers =>
                              prevUsers.map(u =>
                                u.id === editingUser.id
                                  ? { ...u, emailVerified: true }
                                  : u
                              )
                            );

                            resolve('Email verificado correctamente');
                          } else {
                            const error = await response.json();
                            reject(error.error || 'Error al verificar email');
                          }
                        } catch (error) {
                          reject('Error al verificar email');
                        }
                      });

                      toast.promise(verifyPromise, {
                        loading: 'Verificando email...',
                        success: (msg) => msg as string,
                        error: (err) => err as string,
                      });
                    }}
                    className="btn btn-sm btn-outline w-full"
                  >
                    ✓ Verificar Email Manualmente
                  </button>
                </div>
              )}

              <div className="flex gap-3 pt-4">
                <button type="button" onClick={handleCloseModal} className="flex-1 btn btn-ghost">
                  Cancelar
                </button>
                <button type="submit" className="flex-1 btn btn-primary">
                  <Save className="w-4 h-4" />
                  {editingUser ? 'Actualizar' : 'Crear'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Deck View Modal */}
      {showDeckModal && selectedDeck && (
        <div
          className="fixed inset-0 bg-black/80 z-50 overflow-y-auto"
          onClick={handleDeckBackdropClick}
        >
          <div className="min-h-screen flex items-center justify-center p-4">
            <div className="card p-6 max-w-4xl w-full my-8" onClick={(e) => e.stopPropagation()}>
              <div className="flex items-center justify-between mb-6">
                <div>
                  <h2 className="font-display text-2xl font-bold text-white">
                    {selectedDeck.name}
                  </h2>
                  <div className="flex items-center gap-2 mt-1">
                    {selectedDeck.format && (
                      <span className="text-sm text-gray-400 capitalize">
                        Formato: {selectedDeck.format}
                      </span>
                    )}
                    {selectedDeck.DeckCard && (
                      <span className="text-sm text-gray-500">
                        ({selectedDeck.DeckCard.reduce((acc, c) => acc + c.quantity, 0)} cartas)
                      </span>
                    )}
                    {!selectedDeck.isActive && (
                      <span className="px-2 py-0.5 text-xs rounded bg-red-500/20 text-red-400">
                        Inactivo
                      </span>
                    )}
                  </div>
                </div>
                <button
                  onClick={closeDeckModal}
                  className="text-gray-400 hover:text-white transition-colors"
                >
                  <X className="w-6 h-6" />
                </button>
              </div>

              {selectedDeck.DeckCard && selectedDeck.DeckCard.length > 0 ? (
                <div className="space-y-6">
                  {/* Main Deck */}
                  {(() => {
                    const mainCards = selectedDeck.DeckCard.filter(c => c.deckType === 'MAIN');
                    const mainCount = mainCards.reduce((acc, c) => acc + c.quantity, 0);
                    if (mainCards.length === 0) return null;
                    return (
                      <div>
                        <h3 className="text-sm font-semibold text-gray-300 mb-3 flex items-center gap-2">
                          <Layers className="w-4 h-4" />
                          Main Deck ({mainCount})
                        </h3>
                        <div className="grid grid-cols-5 sm:grid-cols-8 md:grid-cols-10 gap-2">
                          {mainCards.map((card) => (
                            <div key={card.id} className="relative group" title={card.cardData?.name || 'Carta'}>
                              <div className="aspect-[59/86] rounded overflow-hidden border border-rola-gray/30 hover:border-rola-gold/50 transition-colors">
                                {card.cardData?.card_images?.[0]?.image_url_small ? (
                                  <Image
                                    src={card.cardData.card_images[0].image_url_small}
                                    alt={card.cardData.name || 'Carta'}
                                    fill
                                    className="object-cover"
                                    sizes="80px"
                                  />
                                ) : (
                                  <div className="w-full h-full bg-gray-700 flex items-center justify-center text-xs text-gray-500">
                                    ?
                                  </div>
                                )}
                              </div>
                              {card.quantity > 1 && (
                                <div className="absolute -top-1 -right-1 bg-rola-gold text-black text-[10px] font-bold rounded-full w-5 h-5 flex items-center justify-center">
                                  {card.quantity}
                                </div>
                              )}
                              <p className="text-[9px] text-gray-400 truncate mt-1 text-center">
                                {card.cardData?.name || 'Carta'}
                              </p>
                            </div>
                          ))}
                        </div>
                      </div>
                    );
                  })()}

                  {/* Extra Deck */}
                  {(() => {
                    const extraCards = selectedDeck.DeckCard.filter(c => c.deckType === 'EXTRA');
                    const extraCount = extraCards.reduce((acc, c) => acc + c.quantity, 0);
                    if (extraCards.length === 0) return null;
                    return (
                      <div>
                        <h3 className="text-sm font-semibold text-rola-purple mb-3 flex items-center gap-2">
                          <Layers className="w-4 h-4" />
                          Extra Deck ({extraCount})
                        </h3>
                        <div className="grid grid-cols-5 sm:grid-cols-8 md:grid-cols-10 gap-2">
                          {extraCards.map((card) => (
                            <div key={card.id} className="relative group" title={card.cardData?.name || 'Carta'}>
                              <div className="aspect-[59/86] rounded overflow-hidden border border-rola-purple/30 hover:border-rola-purple/50 transition-colors">
                                {card.cardData?.card_images?.[0]?.image_url_small ? (
                                  <Image
                                    src={card.cardData.card_images[0].image_url_small}
                                    alt={card.cardData.name || 'Carta'}
                                    fill
                                    className="object-cover"
                                    sizes="80px"
                                  />
                                ) : (
                                  <div className="w-full h-full bg-gray-700 flex items-center justify-center text-xs text-gray-500">
                                    ?
                                  </div>
                                )}
                              </div>
                              {card.quantity > 1 && (
                                <div className="absolute -top-1 -right-1 bg-rola-purple text-white text-[10px] font-bold rounded-full w-5 h-5 flex items-center justify-center">
                                  {card.quantity}
                                </div>
                              )}
                              <p className="text-[9px] text-gray-400 truncate mt-1 text-center">
                                {card.cardData?.name || 'Carta'}
                              </p>
                            </div>
                          ))}
                        </div>
                      </div>
                    );
                  })()}

                  {/* Side Deck */}
                  {(() => {
                    const sideCards = selectedDeck.DeckCard.filter(c => c.deckType === 'SIDE');
                    const sideCount = sideCards.reduce((acc, c) => acc + c.quantity, 0);
                    if (sideCards.length === 0) return null;
                    return (
                      <div>
                        <h3 className="text-sm font-semibold text-rola-gold mb-3 flex items-center gap-2">
                          <Layers className="w-4 h-4" />
                          Side Deck ({sideCount})
                        </h3>
                        <div className="grid grid-cols-5 sm:grid-cols-8 md:grid-cols-10 gap-2">
                          {sideCards.map((card) => (
                            <div key={card.id} className="relative group" title={card.cardData?.name || 'Carta'}>
                              <div className="aspect-[59/86] rounded overflow-hidden border border-rola-gold/30 hover:border-rola-gold/50 transition-colors">
                                {card.cardData?.card_images?.[0]?.image_url_small ? (
                                  <Image
                                    src={card.cardData.card_images[0].image_url_small}
                                    alt={card.cardData.name || 'Carta'}
                                    fill
                                    className="object-cover"
                                    sizes="80px"
                                  />
                                ) : (
                                  <div className="w-full h-full bg-gray-700 flex items-center justify-center text-xs text-gray-500">
                                    ?
                                  </div>
                                )}
                              </div>
                              {card.quantity > 1 && (
                                <div className="absolute -top-1 -right-1 bg-rola-gold text-black text-[10px] font-bold rounded-full w-5 h-5 flex items-center justify-center">
                                  {card.quantity}
                                </div>
                              )}
                              <p className="text-[9px] text-gray-400 truncate mt-1 text-center">
                                {card.cardData?.name || 'Carta'}
                              </p>
                            </div>
                          ))}
                        </div>
                      </div>
                    );
                  })()}
                </div>
              ) : (
                <div className="text-center py-12">
                  <Layers className="w-12 h-12 text-gray-600 mx-auto mb-4" />
                  <p className="text-gray-400">Este mazo no tiene cartas</p>
                </div>
              )}

              <div className="mt-6 pt-4 border-t border-rola-gray/30">
                <button
                  onClick={closeDeckModal}
                  className="btn btn-ghost w-full"
                >
                  Cerrar
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
