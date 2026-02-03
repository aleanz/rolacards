'use client';

import { useEffect, useState } from 'react';
import { useSession } from 'next-auth/react';
import toast from 'react-hot-toast';
import { useModal } from '@/hooks/useModal';
import {
  Handshake,
  Plus,
  Edit,
  Trash2,
  Save,
  X,
  Upload,
  ExternalLink,
  Eye,
  EyeOff,
  GripVertical,
} from 'lucide-react';
import Image from 'next/image';
import PageHeader from '@/components/admin/PageHeader';
import { Tooltip } from '@/components/ui/Tooltip';

interface Sponsor {
  id: string;
  name: string;
  logoUrl: string;
  linkUrl: string;
  order: number;
  active: boolean;
  createdAt: string;
  updatedAt: string;
}

export default function SponsorsPage() {
  const { data: session } = useSession();
  const [sponsors, setSponsors] = useState<Sponsor[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingSponsor, setEditingSponsor] = useState<Sponsor | null>(null);
  const [formError, setFormError] = useState('');
  const [isUploading, setIsUploading] = useState(false);
  const [logoPreview, setLogoPreview] = useState('');

  const [formData, setFormData] = useState({
    name: '',
    logoUrl: '',
    linkUrl: '',
    order: 0,
    active: true,
  });

  const isAdmin = session?.user?.role === 'ADMIN';

  useEffect(() => {
    fetchSponsors();
  }, []);

  const fetchSponsors = async () => {
    setIsLoading(true);
    try {
      const response = await fetch('/api/sponsors');
      if (response.ok) {
        const data = await response.json();
        setSponsors(data);
      }
    } catch (error) {
      console.error('Error fetching sponsors:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setEditingSponsor(null);
    setFormError('');
    setLogoPreview('');
    setFormData({
      name: '',
      logoUrl: '',
      linkUrl: '',
      order: 0,
      active: true,
    });
  };

  const { handleBackdropClick } = useModal({ isOpen: isModalOpen, onClose: handleCloseModal });

  const handleOpenModal = (sponsor?: Sponsor) => {
    if (sponsor) {
      setEditingSponsor(sponsor);
      setFormData({
        name: sponsor.name,
        logoUrl: sponsor.logoUrl,
        linkUrl: sponsor.linkUrl,
        order: sponsor.order,
        active: sponsor.active,
      });
      setLogoPreview(sponsor.logoUrl);
    } else {
      setFormData({
        name: '',
        logoUrl: '',
        linkUrl: '',
        order: sponsors.length,
        active: true,
      });
    }
    setIsModalOpen(true);
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsUploading(true);
    setFormError('');
    try {
      const formDataUpload = new FormData();
      formDataUpload.append('file', file);
      formDataUpload.append('type', 'sponsors');

      const response = await fetch('/api/upload', {
        method: 'POST',
        body: formDataUpload,
      });

      if (!response.ok) {
        const error = await response.json();
        setFormError(error.error || 'Error al subir imagen');
        toast.error(error.error || 'Error al subir imagen');
        return;
      }

      const data = await response.json();
      setFormData((prev) => ({ ...prev, logoUrl: data.url }));
      setLogoPreview(data.url);
      toast.success('Logo subido correctamente');
    } catch (error) {
      console.error('Error uploading logo:', error);
      setFormError('Error al subir el logo');
      toast.error('Error al subir el logo');
    } finally {
      setIsUploading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError('');

    if (!formData.name || !formData.logoUrl || !formData.linkUrl) {
      setFormError('Nombre, logo y enlace son requeridos');
      return;
    }

    try {
      const url = editingSponsor
        ? `/api/sponsors/${editingSponsor.id}`
        : '/api/sponsors';
      const method = editingSponsor ? 'PUT' : 'POST';

      const response = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });

      if (!response.ok) {
        const error = await response.json();
        setFormError(error.error || 'Error al guardar sponsor');
        return;
      }

      toast.success(editingSponsor ? 'Sponsor actualizado' : 'Sponsor creado');
      handleCloseModal();
      fetchSponsors();
    } catch (error) {
      console.error('Error saving sponsor:', error);
      setFormError('Error al guardar sponsor');
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('¿Estás seguro de eliminar este sponsor?')) return;

    try {
      const response = await fetch(`/api/sponsors/${id}`, {
        method: 'DELETE',
      });

      if (!response.ok) {
        toast.error('Error al eliminar sponsor');
        return;
      }

      toast.success('Sponsor eliminado');
      fetchSponsors();
    } catch (error) {
      console.error('Error deleting sponsor:', error);
      toast.error('Error al eliminar sponsor');
    }
  };

  const handleToggleActive = async (sponsor: Sponsor) => {
    try {
      const response = await fetch(`/api/sponsors/${sponsor.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ active: !sponsor.active }),
      });

      if (!response.ok) {
        toast.error('Error al actualizar sponsor');
        return;
      }

      toast.success(sponsor.active ? 'Sponsor desactivado' : 'Sponsor activado');
      fetchSponsors();
    } catch (error) {
      console.error('Error toggling sponsor:', error);
      toast.error('Error al actualizar sponsor');
    }
  };

  if (!isAdmin) {
    return (
      <div className="p-8">
        <div className="card p-12 text-center">
          <Handshake className="w-16 h-16 text-gray-600 mx-auto mb-4" />
          <h2 className="text-xl font-bold text-white mb-2">Acceso Restringido</h2>
          <p className="text-gray-400">Solo los administradores pueden gestionar sponsors.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-4 md:p-8">
      <PageHeader
        title="Sponsors"
        description="Gestiona los sponsors que se muestran en la página de inicio"
        action={
          <button onClick={() => handleOpenModal()} className="btn btn-primary">
            <Plus className="w-4 h-4" />
            Nuevo Sponsor
          </button>
        }
      />

      {/* Sponsors List */}
      {isLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[1, 2, 3].map((i) => (
            <div key={i} className="card p-6 animate-pulse">
              <div className="w-32 h-32 bg-rola-gray/50 rounded-lg mx-auto mb-4" />
              <div className="h-4 bg-rola-gray/50 rounded w-3/4 mx-auto mb-2" />
              <div className="h-3 bg-rola-gray/50 rounded w-1/2 mx-auto" />
            </div>
          ))}
        </div>
      ) : sponsors.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {sponsors.map((sponsor) => (
            <div
              key={sponsor.id}
              className={`card p-6 ${!sponsor.active ? 'opacity-50' : ''}`}
            >
              {/* Logo */}
              <div className="relative w-32 h-32 mx-auto mb-4 rounded-lg overflow-hidden bg-white/5">
                <Image
                  src={sponsor.logoUrl}
                  alt={sponsor.name}
                  fill
                  className="object-contain p-2"
                  sizes="128px"
                />
              </div>

              {/* Info */}
              <div className="text-center mb-4">
                <h3 className="font-semibold text-white mb-1">{sponsor.name}</h3>
                <a
                  href={sponsor.linkUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-sm text-rola-gold hover:underline inline-flex items-center gap-1"
                >
                  <ExternalLink className="w-3 h-3" />
                  Ver enlace
                </a>
              </div>

              {/* Status Badge */}
              <div className="flex justify-center mb-4">
                <span
                  className={`px-3 py-1 text-xs rounded-full ${
                    sponsor.active
                      ? 'bg-green-500/20 text-green-400'
                      : 'bg-red-500/20 text-red-400'
                  }`}
                >
                  {sponsor.active ? 'Activo' : 'Inactivo'}
                </span>
              </div>

              {/* Actions */}
              <div className="flex gap-2 justify-center">
                <Tooltip content={sponsor.active ? 'Desactivar' : 'Activar'}>
                  <button
                    onClick={() => handleToggleActive(sponsor)}
                    className="btn btn-ghost btn-sm"
                  >
                    {sponsor.active ? (
                      <EyeOff className="w-4 h-4" />
                    ) : (
                      <Eye className="w-4 h-4" />
                    )}
                  </button>
                </Tooltip>
                <button
                  onClick={() => handleOpenModal(sponsor)}
                  className="btn btn-ghost btn-sm"
                >
                  <Edit className="w-4 h-4" />
                </button>
                <button
                  onClick={() => handleDelete(sponsor.id)}
                  className="btn btn-ghost btn-sm text-red-400 hover:text-red-300"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="text-center py-12 card">
          <Handshake className="w-12 h-12 text-gray-600 mx-auto mb-4" />
          <p className="text-gray-400 mb-4">No hay sponsors registrados</p>
          <button onClick={() => handleOpenModal()} className="btn btn-primary">
            <Plus className="w-4 h-4" />
            Agregar Primer Sponsor
          </button>
        </div>
      )}

      {/* Modal */}
      {isModalOpen && (
        <div
          className="fixed inset-0 bg-black/80 z-50 overflow-y-auto"
          onClick={handleBackdropClick}
        >
          <div className="min-h-screen flex items-center justify-center p-4">
            <div className="card p-6 max-w-lg w-full my-8" onClick={(e) => e.stopPropagation()}>
              <div className="flex items-center justify-between mb-6">
                <h2 className="font-display text-2xl font-bold text-white">
                  {editingSponsor ? 'Editar Sponsor' : 'Nuevo Sponsor'}
                </h2>
                <button
                  onClick={handleCloseModal}
                  className="text-gray-400 hover:text-white transition-colors"
                >
                  <X className="w-6 h-6" />
                </button>
              </div>

              {formError && (
                <div className="mb-4 p-3 bg-red-500/20 border border-red-500/50 rounded-lg text-red-400 text-sm">
                  {formError}
                </div>
              )}

              <form onSubmit={handleSubmit} className="space-y-4">
                {/* Logo Upload */}
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    Logo del Sponsor *
                  </label>
                  <div className="flex items-center gap-4">
                    <div className="relative w-24 h-24 bg-rola-gray/50 rounded-lg overflow-hidden flex items-center justify-center">
                      {logoPreview ? (
                        <Image
                          src={logoPreview}
                          alt="Preview"
                          fill
                          className="object-contain p-2"
                          sizes="96px"
                        />
                      ) : (
                        <Handshake className="w-8 h-8 text-gray-500" />
                      )}
                    </div>
                    <div className="flex-1">
                      <label className="btn btn-ghost btn-sm cursor-pointer">
                        <Upload className="w-4 h-4" />
                        {isUploading ? 'Subiendo...' : 'Subir Logo'}
                        <input
                          type="file"
                          accept="image/*"
                          onChange={handleFileUpload}
                          className="hidden"
                          disabled={isUploading}
                        />
                      </label>
                      <p className="text-xs text-gray-500 mt-2">
                        PNG o JPG. Se recomienda fondo transparente.
                      </p>
                    </div>
                  </div>
                  {/* URL manual option */}
                  <div className="mt-2">
                    <input
                      type="text"
                      placeholder="O ingresa URL del logo directamente"
                      value={formData.logoUrl}
                      onChange={(e) => {
                        setFormData((prev) => ({ ...prev, logoUrl: e.target.value }));
                        setLogoPreview(e.target.value);
                      }}
                      className="input text-sm"
                    />
                  </div>
                </div>

                {/* Name */}
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    Nombre del Sponsor *
                  </label>
                  <input
                    type="text"
                    value={formData.name}
                    onChange={(e) => setFormData((prev) => ({ ...prev, name: e.target.value }))}
                    className="input"
                    placeholder="Ej: Top Cut Store"
                    required
                  />
                </div>

                {/* Link URL */}
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    Enlace (URL) *
                  </label>
                  <input
                    type="url"
                    value={formData.linkUrl}
                    onChange={(e) => setFormData((prev) => ({ ...prev, linkUrl: e.target.value }))}
                    className="input"
                    placeholder="https://www.instagram.com/..."
                    required
                  />
                </div>

                {/* Order */}
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    Orden de Aparición
                  </label>
                  <input
                    type="number"
                    value={formData.order}
                    onChange={(e) => setFormData((prev) => ({ ...prev, order: parseInt(e.target.value) || 0 }))}
                    className="input"
                    min="0"
                  />
                  <p className="text-xs text-gray-500 mt-1">
                    Menor número = aparece primero
                  </p>
                </div>

                {/* Active Toggle */}
                <div className="flex items-center gap-3">
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input
                      type="checkbox"
                      checked={formData.active}
                      onChange={(e) => setFormData((prev) => ({ ...prev, active: e.target.checked }))}
                      className="sr-only peer"
                    />
                    <div className="w-11 h-6 bg-gray-600 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full rtl:peer-checked:after:-translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:start-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-rola-gold"></div>
                  </label>
                  <span className="text-sm text-gray-300">
                    {formData.active ? 'Activo (visible en la página)' : 'Inactivo (oculto)'}
                  </span>
                </div>

                {/* Submit Button */}
                <div className="flex gap-3 pt-4">
                  <button type="button" onClick={handleCloseModal} className="btn btn-ghost flex-1">
                    Cancelar
                  </button>
                  <button type="submit" className="btn btn-primary flex-1">
                    <Save className="w-4 h-4" />
                    {editingSponsor ? 'Actualizar' : 'Crear'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
