'use client';

import { useEffect, useState } from 'react';
import { useSession } from 'next-auth/react';
import {
  Package,
  Plus,
  Search,
  Edit,
  Trash2,
  Save,
  X,
  Upload,
  CreditCard,
  Box,
  Eye,
  EyeOff,
} from 'lucide-react';

interface Product {
  id: string;
  sku: string;
  name: string;
  description: string | null;
  type: string;
  price: string;
  cost: string | null;
  stock: number;
  minStock: number;
  imageUrl: string | null;
  cardId: number | null;
  cardName: string | null;
  cardSet: string | null;
  cardRarity: string | null;
  cardCondition: string | null;
  cardLanguage: string | null;
  cardData: any;
  setCode: string | null;
  releaseDate: string | null;
  arrivalDate: string | null;
  location: string | null;
  notes: string | null;
  active: boolean;
  createdAt: string;
  updatedAt: string;
  category: any;
}

const CARD_CONDITIONS = ['MINT', 'NEAR_MINT', 'LIGHT_PLAY', 'MODERATE_PLAY', 'HEAVY_PLAY', 'DAMAGED'];
const SEALED_TYPES = ['BOOSTER', 'BOX', 'STRUCTURE', 'TIN', 'ACCESSORY', 'OTHER'];

export default function InventarioPage() {
  const { data: session } = useSession();
  const [activeTab, setActiveTab] = useState<'SINGLE' | 'SEALED'>('SINGLE');
  const [products, setProducts] = useState<Product[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [showCardSearch, setShowCardSearch] = useState(false);
  const [formError, setFormError] = useState('');
  const [isUploading, setIsUploading] = useState(false);

  // Card search states
  const [cardSearchTerm, setCardSearchTerm] = useState('');
  const [searchResults, setSearchResults] = useState<any[]>([]);
  const [isSearching, setIsSearching] = useState(false);

  // Form data for single cards
  const [singleCardForm, setSingleCardForm] = useState({
    sku: '',
    cardId: '',
    cardName: '',
    cardSet: '',
    cardRarity: '',
    cardCondition: 'NEAR_MINT',
    cardLanguage: 'es',
    price: '',
    cost: '',
    stock: '1',
    minStock: '1',
    imageUrl: '',
    location: '',
    notes: '',
    active: true,
    cardData: null as any,
  });

  // Form data for sealed products
  const [sealedProductForm, setSealedProductForm] = useState({
    sku: '',
    name: '',
    description: '',
    type: 'BOX',
    price: '',
    cost: '',
    stock: '0',
    minStock: '0',
    imageUrl: '',
    setCode: '',
    releaseDate: '',
    arrivalDate: '',
    location: '',
    notes: '',
    active: true,
  });

  useEffect(() => {
    fetchProducts();
  }, [activeTab]);

  const fetchProducts = async () => {
    setIsLoading(true);
    try {
      const response = await fetch(`/api/inventory?type=${activeTab}`);
      if (response.ok) {
        const data = await response.json();
        setProducts(data);
      }
    } catch (error) {
      console.error('Error fetching products:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsUploading(true);
    try {
      const formDataUpload = new FormData();
      formDataUpload.append('file', file);

      const response = await fetch('/api/upload', {
        method: 'POST',
        body: formDataUpload,
      });

      if (!response.ok) {
        const error = await response.json();
        setFormError(error.error || 'Error al subir imagen');
        return;
      }

      const data = await response.json();

      if (activeTab === 'SINGLE') {
        setSingleCardForm((prev) => ({ ...prev, imageUrl: data.url }));
      } else {
        setSealedProductForm((prev) => ({ ...prev, imageUrl: data.url }));
      }
    } catch (error) {
      setFormError('Error al subir imagen');
    } finally {
      setIsUploading(false);
    }
  };

  const handleOpenModal = (product?: Product) => {
    if (product) {
      setEditingProduct(product);

      if (product.type === 'SINGLE') {
        setSingleCardForm({
          sku: product.sku,
          cardId: product.cardId?.toString() || '',
          cardName: product.cardName || '',
          cardSet: product.cardSet || '',
          cardRarity: product.cardRarity || '',
          cardCondition: product.cardCondition || 'NEAR_MINT',
          cardLanguage: product.cardLanguage || 'es',
          price: product.price,
          cost: product.cost || '',
          stock: product.stock.toString(),
          minStock: product.minStock.toString(),
          imageUrl: product.imageUrl || '',
          location: product.location || '',
          notes: product.notes || '',
          active: product.active,
          cardData: product.cardData,
        });
      } else {
        setSealedProductForm({
          sku: product.sku,
          name: product.name,
          description: product.description || '',
          type: product.type,
          price: product.price,
          cost: product.cost || '',
          stock: product.stock.toString(),
          minStock: product.minStock.toString(),
          imageUrl: product.imageUrl || '',
          setCode: product.setCode || '',
          releaseDate: product.releaseDate ? new Date(product.releaseDate).toISOString().slice(0, 10) : '',
          arrivalDate: product.arrivalDate ? new Date(product.arrivalDate).toISOString().slice(0, 10) : '',
          location: product.location || '',
          notes: product.notes || '',
          active: product.active,
        });
      }
    } else {
      setEditingProduct(null);
      resetForms();
    }
    setFormError('');
    setIsModalOpen(true);
  };

  const resetForms = () => {
    setSingleCardForm({
      sku: '',
      cardId: '',
      cardName: '',
      cardSet: '',
      cardRarity: '',
      cardCondition: 'NEAR_MINT',
      cardLanguage: 'es',
      price: '',
      cost: '',
      stock: '1',
      minStock: '1',
      imageUrl: '',
      location: '',
      notes: '',
      active: true,
      cardData: null,
    });
    setSealedProductForm({
      sku: '',
      name: '',
      description: '',
      type: 'BOX',
      price: '',
      cost: '',
      stock: '0',
      minStock: '0',
      imageUrl: '',
      setCode: '',
      releaseDate: '',
      arrivalDate: '',
      location: '',
      notes: '',
      active: true,
    });
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setEditingProduct(null);
    setShowCardSearch(false);
    setCardSearchTerm('');
    setSearchResults([]);
    setFormError('');
    resetForms();
  };

  const searchYGOProCards = async () => {
    if (!cardSearchTerm.trim()) return;

    setIsSearching(true);
    try {
      const response = await fetch(
        `https://db.ygoprodeck.com/api/v7/cardinfo.php?fname=${encodeURIComponent(cardSearchTerm)}`
      );
      if (response.ok) {
        const data = await response.json();
        setSearchResults(data.data?.slice(0, 20) || []);
      } else {
        setSearchResults([]);
      }
    } catch (error) {
      console.error('Error searching cards:', error);
      setSearchResults([]);
    } finally {
      setIsSearching(false);
    }
  };

  const selectCard = (card: any) => {
    // Generar SKU automático basado en el ID de la carta
    const autoSKU = `YGO-${card.id}`;

    // Obtener el primer set de la carta si existe
    const cardSet = card.card_sets?.[0]?.set_name || '';
    const cardRarity = card.card_sets?.[0]?.set_rarity || '';

    setSingleCardForm({
      ...singleCardForm,
      sku: autoSKU,
      cardId: card.id.toString(),
      cardName: card.name,
      cardSet: cardSet,
      cardRarity: cardRarity,
      imageUrl: card.card_images[0].image_url,
      cardData: card,
    });

    setShowCardSearch(false);
    setCardSearchTerm('');
    setSearchResults([]);
  };

  const generateSKU = async () => {
    const form = activeTab === 'SINGLE' ? singleCardForm : sealedProductForm;
    const baseName = activeTab === 'SINGLE'
      ? form.cardName || 'CARD'
      : sealedProductForm.name || 'PRODUCT';

    // Crear prefijo basado en el tipo
    let prefix = '';
    if (activeTab === 'SINGLE') {
      prefix = 'YGO-SINGLE';
    } else {
      switch (sealedProductForm.type) {
        case 'BOX':
          prefix = 'YGO-BOX';
          break;
        case 'BOOSTER':
          prefix = 'YGO-BOOST';
          break;
        case 'STRUCTURE':
          prefix = 'YGO-SD';
          break;
        case 'TIN':
          prefix = 'YGO-TIN';
          break;
        case 'ACCESSORY':
          prefix = 'YGO-ACC';
          break;
        default:
          prefix = 'YGO-OTHER';
      }
    }

    // Generar un número aleatorio de 4 dígitos
    const randomNum = Math.floor(1000 + Math.random() * 9000);
    let generatedSKU = `${prefix}-${randomNum}`;

    // Verificar que no exista
    try {
      const response = await fetch(`/api/inventory?search=${generatedSKU}`);
      if (response.ok) {
        const products = await response.json();
        // Si existe, generar uno nuevo recursivamente
        if (products.some((p: any) => p.sku === generatedSKU)) {
          return generateSKU();
        }
      }
    } catch (error) {
      console.error('Error checking SKU:', error);
    }

    // Actualizar el formulario correspondiente
    if (activeTab === 'SINGLE') {
      setSingleCardForm({ ...singleCardForm, sku: generatedSKU });
    } else {
      setSealedProductForm({ ...sealedProductForm, sku: generatedSKU });
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError('');

    try {
      const isCard = activeTab === 'SINGLE';
      const formData = isCard ? {
        ...singleCardForm,
        name: singleCardForm.cardName,
        type: 'SINGLE',
      } : sealedProductForm;

      if (editingProduct) {
        const response = await fetch(`/api/inventory/${editingProduct.id}`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(formData),
        });

        if (!response.ok) {
          const error = await response.json();
          setFormError(error.error || 'Error al actualizar producto');
          return;
        }
      } else {
        const response = await fetch('/api/inventory', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(formData),
        });

        if (!response.ok) {
          const error = await response.json();
          setFormError(error.error || 'Error al crear producto');
          return;
        }
      }

      await fetchProducts();
      handleCloseModal();
    } catch (error) {
      setFormError('Ocurrió un error. Intenta de nuevo.');
    }
  };

  const handleDelete = async (productId: string) => {
    if (!confirm('¿Estás seguro de que deseas eliminar este producto?')) {
      return;
    }

    try {
      const response = await fetch(`/api/inventory/${productId}`, {
        method: 'DELETE',
      });

      if (response.ok) {
        await fetchProducts();
      } else {
        const error = await response.json();
        alert(error.error || 'Error al eliminar producto');
      }
    } catch (error) {
      alert('Error al eliminar producto');
    }
  };

  const filteredProducts = products.filter(
    (product) =>
      product.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      product.sku.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-display text-3xl font-bold text-white mb-2">
            Inventario
          </h1>
          <p className="text-gray-400">Gestiona tu inventario de cartas sueltas y producto sellado</p>
        </div>
        <button onClick={() => handleOpenModal()} className="btn btn-primary">
          <Plus className="w-5 h-5" />
          Agregar Producto
        </button>
      </div>

      {/* Tabs */}
      <div className="card p-1">
        <div className="flex gap-1">
          <button
            onClick={() => setActiveTab('SINGLE')}
            className={`flex-1 flex items-center justify-center gap-2 px-4 py-3 rounded-lg font-medium transition-colors ${
              activeTab === 'SINGLE'
                ? 'bg-rola-gold text-rola-black'
                : 'text-gray-400 hover:text-white hover:bg-rola-gray/50'
            }`}
          >
            <CreditCard className="w-5 h-5" />
            Cartas Sueltas
          </button>
          <button
            onClick={() => setActiveTab('SEALED')}
            className={`flex-1 flex items-center justify-center gap-2 px-4 py-3 rounded-lg font-medium transition-colors ${
              activeTab === 'SEALED'
                ? 'bg-rola-gold text-rola-black'
                : 'text-gray-400 hover:text-white hover:bg-rola-gray/50'
            }`}
          >
            <Box className="w-5 h-5" />
            Producto Sellado
          </button>
        </div>
      </div>

      {/* Search */}
      <div className="card p-4">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-500" />
          <input
            type="text"
            placeholder={`Buscar ${activeTab === 'SINGLE' ? 'cartas' : 'productos'}...`}
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2 bg-rola-gray/50 border border-rola-gray rounded-lg text-white placeholder-gray-500 focus:outline-none focus:border-rola-gold transition-colors"
          />
        </div>
      </div>

      {/* Products List */}
      {isLoading ? (
        <div className="text-center py-12 card">
          <div className="w-12 h-12 border-4 border-rola-gold border-t-transparent rounded-full animate-spin mx-auto mb-4" />
          <p className="text-gray-400">Cargando inventario...</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {filteredProducts.map((product) => (
            <div key={product.id} className="card p-4">
              {product.imageUrl && (
                <img
                  src={product.imageUrl}
                  alt={product.name}
                  className="w-full h-48 object-cover rounded-lg mb-3"
                />
              )}

              <div className="flex items-start justify-between mb-2">
                <div className="flex-1">
                  <h3 className="text-white font-semibold truncate">{product.name}</h3>
                  <p className="text-gray-500 text-xs">{product.sku}</p>
                </div>
                {!product.active && (
                  <span className="px-2 py-0.5 text-xs rounded bg-red-500/20 text-red-400">
                    Inactivo
                  </span>
                )}
              </div>

              <div className="space-y-2 mb-4 text-sm">
                <div className="flex justify-between">
                  <span className="text-gray-400">Stock:</span>
                  <span className={`font-semibold ${product.stock <= product.minStock ? 'text-red-400' : 'text-white'}`}>
                    {product.stock}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-400">Precio:</span>
                  <span className="text-rola-gold font-semibold">${product.price}</span>
                </div>
                {product.location && (
                  <div className="flex justify-between">
                    <span className="text-gray-400">Ubicación:</span>
                    <span className="text-gray-300 text-xs">{product.location}</span>
                  </div>
                )}
              </div>

              <div className="flex gap-2">
                <button
                  onClick={() => handleOpenModal(product)}
                  className="flex-1 btn btn-ghost btn-sm"
                >
                  <Edit className="w-4 h-4" />
                  Editar
                </button>
                <button
                  onClick={() => handleDelete(product.id)}
                  className="btn btn-ghost btn-sm text-red-400 hover:bg-red-500/10"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {filteredProducts.length === 0 && !isLoading && (
        <div className="text-center py-12 card">
          <Package className="w-12 h-12 text-gray-600 mx-auto mb-4" />
          <p className="text-gray-400">No se encontraron productos</p>
        </div>
      )}

      {/* Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-black/80 z-50 overflow-y-auto">
          <div className="min-h-screen flex items-center justify-center p-4">
            <div className="card p-6 max-w-3xl w-full my-8">
              <div className="flex items-center justify-between mb-6">
                <h2 className="font-display text-2xl font-bold text-white">
                  {editingProduct ? 'Editar Producto' : `Agregar ${activeTab === 'SINGLE' ? 'Carta' : 'Producto Sellado'}`}
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
                {activeTab === 'SINGLE' ? (
                  /* Single Card Form */
                  <>
                    {/* Image Upload */}
                    <div>
                      <label className="block text-sm font-medium text-gray-300 mb-2">
                        Imagen
                      </label>
                      {singleCardForm.imageUrl && (
                        <img
                          src={singleCardForm.imageUrl}
                          alt="Preview"
                          className="w-full max-w-xs h-auto object-cover rounded-lg mb-2"
                        />
                      )}
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
                    </div>

                    {/* YGOProDeck Card Search */}
                    <div className="border border-rola-gray/50 rounded-lg p-4 bg-rola-gray/20">
                      <button
                        type="button"
                        onClick={() => setShowCardSearch(!showCardSearch)}
                        className="flex items-center gap-2 text-rola-gold hover:text-rola-gold-light transition-colors mb-3"
                      >
                        <CreditCard className="w-4 h-4" />
                        <span className="text-sm font-medium">
                          {showCardSearch ? 'Ocultar búsqueda' : 'Buscar en YGOProDeck'}
                        </span>
                      </button>

                      {showCardSearch && (
                        <div className="space-y-3">
                          <div className="flex gap-2">
                            <input
                              type="text"
                              placeholder="Buscar carta por nombre..."
                              value={cardSearchTerm}
                              onChange={(e) => setCardSearchTerm(e.target.value)}
                              onKeyPress={(e) => e.key === 'Enter' && searchYGOProCards()}
                              className="flex-1 px-4 py-2 bg-rola-gray/50 border border-rola-gray rounded-lg text-white placeholder-gray-500 focus:outline-none focus:border-rola-gold"
                            />
                            <button
                              type="button"
                              onClick={searchYGOProCards}
                              disabled={isSearching || !cardSearchTerm.trim()}
                              className="px-4 py-2 bg-rola-gold text-rola-black rounded-lg hover:bg-rola-gold-light transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                              {isSearching ? 'Buscando...' : 'Buscar'}
                            </button>
                          </div>

                          {searchResults.length > 0 && (
                            <div className="max-h-64 overflow-y-auto space-y-2 border border-rola-gray/50 rounded-lg p-2 bg-rola-darker/50">
                              {searchResults.map((card: any) => (
                                <button
                                  key={card.id}
                                  type="button"
                                  onClick={() => selectCard(card)}
                                  className="w-full flex items-center gap-3 p-2 rounded-lg hover:bg-rola-gray/50 transition-colors text-left"
                                >
                                  <img
                                    src={card.card_images[0].image_url_small}
                                    alt={card.name}
                                    className="w-12 h-16 object-cover rounded"
                                  />
                                  <div className="flex-1 min-w-0">
                                    <p className="text-sm font-medium text-white truncate">{card.name}</p>
                                    <p className="text-xs text-gray-400 truncate">{card.type}</p>
                                    {card.card_sets?.[0] && (
                                      <p className="text-xs text-gray-500 truncate">
                                        {card.card_sets[0].set_name}
                                      </p>
                                    )}
                                  </div>
                                </button>
                              ))}
                            </div>
                          )}
                        </div>
                      )}
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-300 mb-2">
                        SKU *
                      </label>
                      <div className="flex gap-2">
                        <input
                          type="text"
                          value={singleCardForm.sku}
                          onChange={(e) => setSingleCardForm({ ...singleCardForm, sku: e.target.value })}
                          className="flex-1 px-4 py-2 bg-rola-gray/50 border border-rola-gray rounded-lg text-white focus:outline-none focus:border-rola-gold"
                          placeholder="Ej: YGO-12345"
                          required
                        />
                        <button
                          type="button"
                          onClick={generateSKU}
                          className="px-4 py-2 bg-rola-gold/20 text-rola-gold border border-rola-gold/50 rounded-lg hover:bg-rola-gold/30 transition-colors whitespace-nowrap"
                          title="Generar SKU automático"
                        >
                          Generar
                        </button>
                      </div>
                      <p className="text-xs text-gray-500 mt-1">
                        Se genera automáticamente al buscar carta, o genera uno manual
                      </p>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-300 mb-2">
                        ID de YGOProDeck
                      </label>
                      <input
                        type="number"
                        value={singleCardForm.cardId}
                        onChange={(e) => setSingleCardForm({ ...singleCardForm, cardId: e.target.value })}
                        className="w-full px-4 py-2 bg-rola-gray/50 border border-rola-gray rounded-lg text-white focus:outline-none focus:border-rola-gold"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-300 mb-2">
                        Nombre de la carta *
                      </label>
                      <input
                        type="text"
                        value={singleCardForm.cardName}
                        onChange={(e) => setSingleCardForm({ ...singleCardForm, cardName: e.target.value })}
                        className="w-full px-4 py-2 bg-rola-gray/50 border border-rola-gray rounded-lg text-white focus:outline-none focus:border-rola-gold"
                        required
                      />
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-300 mb-2">
                          Set
                        </label>
                        <input
                          type="text"
                          value={singleCardForm.cardSet}
                          onChange={(e) => setSingleCardForm({ ...singleCardForm, cardSet: e.target.value })}
                          className="w-full px-4 py-2 bg-rola-gray/50 border border-rola-gray rounded-lg text-white focus:outline-none focus:border-rola-gold"
                        />
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-300 mb-2">
                          Rareza
                        </label>
                        <input
                          type="text"
                          value={singleCardForm.cardRarity}
                          onChange={(e) => setSingleCardForm({ ...singleCardForm, cardRarity: e.target.value })}
                          className="w-full px-4 py-2 bg-rola-gray/50 border border-rola-gray rounded-lg text-white focus:outline-none focus:border-rola-gold"
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-300 mb-2">
                          Condición *
                        </label>
                        <select
                          value={singleCardForm.cardCondition}
                          onChange={(e) => setSingleCardForm({ ...singleCardForm, cardCondition: e.target.value })}
                          className="w-full px-4 py-2 bg-rola-gray/50 border border-rola-gray rounded-lg text-white focus:outline-none focus:border-rola-gold"
                        >
                          {CARD_CONDITIONS.map((condition) => (
                            <option key={condition} value={condition}>
                              {condition.replace('_', ' ')}
                            </option>
                          ))}
                        </select>
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-300 mb-2">
                          Idioma
                        </label>
                        <select
                          value={singleCardForm.cardLanguage}
                          onChange={(e) => setSingleCardForm({ ...singleCardForm, cardLanguage: e.target.value })}
                          className="w-full px-4 py-2 bg-rola-gray/50 border border-rola-gray rounded-lg text-white focus:outline-none focus:border-rola-gold"
                        >
                          <option value="es">Español</option>
                          <option value="en">English</option>
                          <option value="jp">日本語</option>
                        </select>
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-300 mb-2">
                          Precio de venta *
                        </label>
                        <input
                          type="number"
                          step="0.01"
                          value={singleCardForm.price}
                          onChange={(e) => setSingleCardForm({ ...singleCardForm, price: e.target.value })}
                          className="w-full px-4 py-2 bg-rola-gray/50 border border-rola-gray rounded-lg text-white focus:outline-none focus:border-rola-gold"
                          required
                        />
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-300 mb-2">
                          Costo
                        </label>
                        <input
                          type="number"
                          step="0.01"
                          value={singleCardForm.cost}
                          onChange={(e) => setSingleCardForm({ ...singleCardForm, cost: e.target.value })}
                          className="w-full px-4 py-2 bg-rola-gray/50 border border-rola-gray rounded-lg text-white focus:outline-none focus:border-rola-gold"
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-3 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-300 mb-2">
                          Stock *
                        </label>
                        <input
                          type="number"
                          value={singleCardForm.stock}
                          onChange={(e) => setSingleCardForm({ ...singleCardForm, stock: e.target.value })}
                          className="w-full px-4 py-2 bg-rola-gray/50 border border-rola-gray rounded-lg text-white focus:outline-none focus:border-rola-gold"
                          required
                        />
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-300 mb-2">
                          Stock mínimo
                        </label>
                        <input
                          type="number"
                          value={singleCardForm.minStock}
                          onChange={(e) => setSingleCardForm({ ...singleCardForm, minStock: e.target.value })}
                          className="w-full px-4 py-2 bg-rola-gray/50 border border-rola-gray rounded-lg text-white focus:outline-none focus:border-rola-gold"
                        />
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-300 mb-2">
                          Ubicación
                        </label>
                        <input
                          type="text"
                          value={singleCardForm.location}
                          onChange={(e) => setSingleCardForm({ ...singleCardForm, location: e.target.value })}
                          placeholder="Ej: E2-C3"
                          className="w-full px-4 py-2 bg-rola-gray/50 border border-rola-gray rounded-lg text-white focus:outline-none focus:border-rola-gold"
                        />
                      </div>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-300 mb-2">
                        Notas
                      </label>
                      <textarea
                        value={singleCardForm.notes}
                        onChange={(e) => setSingleCardForm({ ...singleCardForm, notes: e.target.value })}
                        rows={2}
                        className="w-full px-4 py-2 bg-rola-gray/50 border border-rola-gray rounded-lg text-white focus:outline-none focus:border-rola-gold resize-none"
                      />
                    </div>

                    <label className="flex items-center gap-2 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={singleCardForm.active}
                        onChange={(e) => setSingleCardForm({ ...singleCardForm, active: e.target.checked })}
                        className="w-4 h-4 rounded border-rola-gray bg-rola-gray/50 text-rola-gold"
                      />
                      <span className="text-sm text-gray-300 flex items-center gap-1">
                        {singleCardForm.active ? <Eye className="w-4 h-4" /> : <EyeOff className="w-4 h-4" />}
                        Activo
                      </span>
                    </label>
                  </>
                ) : (
                  /* Sealed Product Form */
                  <>
                    {/* Image Upload */}
                    <div>
                      <label className="block text-sm font-medium text-gray-300 mb-2">
                        Imagen *
                      </label>
                      {sealedProductForm.imageUrl && (
                        <img
                          src={sealedProductForm.imageUrl}
                          alt="Preview"
                          className="w-full max-w-xs h-auto object-cover rounded-lg mb-2"
                        />
                      )}
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
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-300 mb-2">
                        SKU *
                      </label>
                      <div className="flex gap-2">
                        <input
                          type="text"
                          value={sealedProductForm.sku}
                          onChange={(e) => setSealedProductForm({ ...sealedProductForm, sku: e.target.value })}
                          className="flex-1 px-4 py-2 bg-rola-gray/50 border border-rola-gray rounded-lg text-white focus:outline-none focus:border-rola-gold"
                          placeholder="Ej: YGO-BOX-1234"
                          required
                        />
                        <button
                          type="button"
                          onClick={generateSKU}
                          className="px-4 py-2 bg-rola-gold/20 text-rola-gold border border-rola-gold/50 rounded-lg hover:bg-rola-gold/30 transition-colors whitespace-nowrap"
                          title="Generar SKU automático"
                        >
                          Generar
                        </button>
                      </div>
                      <p className="text-xs text-gray-500 mt-1">
                        Formato: YGO-[TIPO]-[NÚMERO]
                      </p>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-300 mb-2">
                          Tipo *
                        </label>
                        <select
                          value={sealedProductForm.type}
                          onChange={(e) => setSealedProductForm({ ...sealedProductForm, type: e.target.value })}
                          className="w-full px-4 py-2 bg-rola-gray/50 border border-rola-gray rounded-lg text-white focus:outline-none focus:border-rola-gold"
                        >
                          {SEALED_TYPES.map((type) => (
                            <option key={type} value={type}>
                              {type}
                            </option>
                          ))}
                        </select>
                      </div>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-300 mb-2">
                        Nombre del producto *
                      </label>
                      <input
                        type="text"
                        value={sealedProductForm.name}
                        onChange={(e) => setSealedProductForm({ ...sealedProductForm, name: e.target.value })}
                        className="w-full px-4 py-2 bg-rola-gray/50 border border-rola-gray rounded-lg text-white focus:outline-none focus:border-rola-gold"
                        required
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-300 mb-2">
                        Descripción
                      </label>
                      <textarea
                        value={sealedProductForm.description}
                        onChange={(e) => setSealedProductForm({ ...sealedProductForm, description: e.target.value })}
                        rows={2}
                        className="w-full px-4 py-2 bg-rola-gray/50 border border-rola-gray rounded-lg text-white focus:outline-none focus:border-rola-gold resize-none"
                      />
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-300 mb-2">
                          Código de set
                        </label>
                        <input
                          type="text"
                          value={sealedProductForm.setCode}
                          onChange={(e) => setSealedProductForm({ ...sealedProductForm, setCode: e.target.value })}
                          className="w-full px-4 py-2 bg-rola-gray/50 border border-rola-gray rounded-lg text-white focus:outline-none focus:border-rola-gold"
                        />
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-300 mb-2">
                          Fecha de lanzamiento
                        </label>
                        <input
                          type="date"
                          value={sealedProductForm.releaseDate}
                          onChange={(e) => setSealedProductForm({ ...sealedProductForm, releaseDate: e.target.value })}
                          className="w-full px-4 py-2 bg-rola-gray/50 border border-rola-gray rounded-lg text-white focus:outline-none focus:border-rola-gold"
                        />
                      </div>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-300 mb-2">
                        Fecha de llegada a tienda *
                      </label>
                      <input
                        type="date"
                        value={sealedProductForm.arrivalDate}
                        onChange={(e) => setSealedProductForm({ ...sealedProductForm, arrivalDate: e.target.value })}
                        className="w-full px-4 py-2 bg-rola-gray/50 border border-rola-gray rounded-lg text-white focus:outline-none focus:border-rola-gold"
                        required
                      />
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-300 mb-2">
                          Precio de venta *
                        </label>
                        <input
                          type="number"
                          step="0.01"
                          value={sealedProductForm.price}
                          onChange={(e) => setSealedProductForm({ ...sealedProductForm, price: e.target.value })}
                          className="w-full px-4 py-2 bg-rola-gray/50 border border-rola-gray rounded-lg text-white focus:outline-none focus:border-rola-gold"
                          required
                        />
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-300 mb-2">
                          Costo
                        </label>
                        <input
                          type="number"
                          step="0.01"
                          value={sealedProductForm.cost}
                          onChange={(e) => setSealedProductForm({ ...sealedProductForm, cost: e.target.value })}
                          className="w-full px-4 py-2 bg-rola-gray/50 border border-rola-gray rounded-lg text-white focus:outline-none focus:border-rola-gold"
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-3 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-300 mb-2">
                          Stock *
                        </label>
                        <input
                          type="number"
                          value={sealedProductForm.stock}
                          onChange={(e) => setSealedProductForm({ ...sealedProductForm, stock: e.target.value })}
                          className="w-full px-4 py-2 bg-rola-gray/50 border border-rola-gray rounded-lg text-white focus:outline-none focus:border-rola-gold"
                          required
                        />
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-300 mb-2">
                          Stock mínimo
                        </label>
                        <input
                          type="number"
                          value={sealedProductForm.minStock}
                          onChange={(e) => setSealedProductForm({ ...sealedProductForm, minStock: e.target.value })}
                          className="w-full px-4 py-2 bg-rola-gray/50 border border-rola-gray rounded-lg text-white focus:outline-none focus:border-rola-gold"
                        />
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-300 mb-2">
                          Ubicación
                        </label>
                        <input
                          type="text"
                          value={sealedProductForm.location}
                          onChange={(e) => setSealedProductForm({ ...sealedProductForm, location: e.target.value })}
                          placeholder="Ej: Estante A"
                          className="w-full px-4 py-2 bg-rola-gray/50 border border-rola-gray rounded-lg text-white focus:outline-none focus:border-rola-gold"
                        />
                      </div>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-300 mb-2">
                        Notas
                      </label>
                      <textarea
                        value={sealedProductForm.notes}
                        onChange={(e) => setSealedProductForm({ ...sealedProductForm, notes: e.target.value })}
                        rows={2}
                        className="w-full px-4 py-2 bg-rola-gray/50 border border-rola-gray rounded-lg text-white focus:outline-none focus:border-rola-gold resize-none"
                      />
                    </div>

                    <label className="flex items-center gap-2 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={sealedProductForm.active}
                        onChange={(e) => setSealedProductForm({ ...sealedProductForm, active: e.target.checked })}
                        className="w-4 h-4 rounded border-rola-gray bg-rola-gray/50 text-rola-gold"
                      />
                      <span className="text-sm text-gray-300 flex items-center gap-1">
                        {sealedProductForm.active ? <Eye className="w-4 h-4" /> : <EyeOff className="w-4 h-4" />}
                        Activo
                      </span>
                    </label>
                  </>
                )}

                <div className="flex gap-3 pt-4">
                  <button type="button" onClick={handleCloseModal} className="flex-1 btn btn-ghost">
                    Cancelar
                  </button>
                  <button type="submit" className="flex-1 btn btn-primary">
                    <Save className="w-4 h-4" />
                    {editingProduct ? 'Actualizar' : 'Crear'}
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
