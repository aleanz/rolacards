'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import Header from '@/components/layout/Header';
import Footer from '@/components/layout/Footer';
import { Search, Filter, Package } from 'lucide-react';
import { Prisma } from '@prisma/client';

type Product = {
  id: string;
  name: string;
  description: string | null;
  price: Prisma.Decimal;
  stock: number;
  sku: string | null;
  cardCode: string | null;
  category: string;
  condition: string | null;
  rarity: string | null;
  imageUrl: string | null;
  active: boolean;
};

const categories = [
  { value: '', label: 'Todas las categorías' },
  { value: 'YU_GI_OH', label: 'Yu-Gi-Oh!' },
  { value: 'POKEMON', label: 'Pokémon' },
  { value: 'MAGIC', label: 'Magic: The Gathering' },
  { value: 'ACCESSORIES', label: 'Accesorios' },
  { value: 'SEALED', label: 'Producto Sellado' },
];

const rarities = [
  'Common',
  'Rare',
  'Super Rare',
  'Ultra Rare',
  'Secret Rare',
  'Ultimate Rare',
  'Ghost Rare',
  'Starlight Rare',
];

export default function CatalogoPage() {
  const [products, setProducts] = useState<Product[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('');
  const [selectedRarity, setSelectedRarity] = useState('');
  const [showFilters, setShowFilters] = useState(false);
  const [searchTimeout, setSearchTimeout] = useState<NodeJS.Timeout | null>(null);

  useEffect(() => {
    fetchProducts();
  }, [selectedCategory, selectedRarity]);

  useEffect(() => {
    if (searchTimeout) {
      clearTimeout(searchTimeout);
    }

    const timeout = setTimeout(() => {
      fetchProducts();
    }, 300);

    setSearchTimeout(timeout);

    return () => {
      if (searchTimeout) clearTimeout(searchTimeout);
    };
  }, [searchTerm]);

  const fetchProducts = async () => {
    setIsLoading(true);
    try {
      const params = new URLSearchParams();
      params.append('active', 'true');
      if (searchTerm) params.append('search', searchTerm);
      if (selectedCategory) params.append('category', selectedCategory);
      if (selectedRarity) params.append('rarity', selectedRarity);

      const response = await fetch(`/api/inventory?${params.toString()}`);
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

  const clearFilters = () => {
    setSearchTerm('');
    setSelectedCategory('');
    setSelectedRarity('');
  };

  const getCategoryLabel = (category: string) => {
    const cat = categories.find((c) => c.value === category);
    return cat ? cat.label : category;
  };

  return (
    <>
      <Header />
      <main className="min-h-screen pt-20">
        <div className="section">
          <div className="container-custom space-y-4 sm:space-y-6">
            {/* Header */}
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 sm:gap-4">
              <div className="flex-1 min-w-0">
                <h1 className="font-display text-2xl sm:text-3xl md:text-4xl font-bold text-white mb-1 sm:mb-2">
                  Nuestro <span className="text-gradient">Catálogo</span>
                </h1>
                <p className="text-sm sm:text-base text-gray-400">
                  Explora nuestro inventario de cartas y accesorios
                </p>
              </div>
              <div className="flex-shrink-0">
                <button
                  onClick={() => setShowFilters(!showFilters)}
                  className="btn btn-outline btn-sm sm:btn w-full sm:w-auto"
                >
                  <Filter className="w-4 h-4" />
                  <span className="hidden sm:inline">{showFilters ? 'Ocultar' : 'Mostrar'} Filtros</span>
                  <span className="sm:hidden">{showFilters ? 'Ocultar' : 'Filtros'}</span>
                </button>
              </div>
            </div>

            {/* Search Bar */}
            <div className="card p-3 sm:p-4">
              <div className="relative">
                <Search className="absolute left-3 sm:left-4 top-1/2 -translate-y-1/2 w-4 h-4 sm:w-5 sm:h-5 text-gray-500" />
                <input
                  type="text"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  placeholder="Buscar por nombre, SKU o código..."
                  className="w-full pl-10 sm:pl-12 pr-3 sm:pr-4 py-2 sm:py-3 text-sm sm:text-base bg-rola-gray/50 border border-rola-gray rounded-lg text-white placeholder-gray-500 focus:outline-none focus:border-rola-gold transition-colors"
                />
              </div>
            </div>

            {/* Filters */}
            {showFilters && (
              <div className="card p-4 sm:p-6 space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {/* Categoría */}
                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2">
                      Categoría
                    </label>
                    <select
                      value={selectedCategory}
                      onChange={(e) => setSelectedCategory(e.target.value)}
                      className="w-full px-4 py-2 bg-rola-gray/50 border border-rola-gray rounded-lg text-white focus:outline-none focus:border-rola-gold transition-colors"
                    >
                      {categories.map((cat) => (
                        <option key={cat.value} value={cat.value}>
                          {cat.label}
                        </option>
                      ))}
                    </select>
                  </div>

                  {/* Rareza */}
                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2">
                      Rareza
                    </label>
                    <select
                      value={selectedRarity}
                      onChange={(e) => setSelectedRarity(e.target.value)}
                      className="w-full px-4 py-2 bg-rola-gray/50 border border-rola-gray rounded-lg text-white focus:outline-none focus:border-rola-gold transition-colors"
                    >
                      <option value="">Todas las rarezas</option>
                      {rarities.map((rarity) => (
                        <option key={rarity} value={rarity}>
                          {rarity}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                <button onClick={clearFilters} className="btn btn-ghost btn-sm sm:btn w-full">
                  Limpiar Filtros
                </button>
              </div>
            )}

            {/* Results */}
            {isLoading ? (
              <div className="text-center py-12 card">
                <div className="w-12 h-12 border-4 border-rola-gold border-t-transparent rounded-full animate-spin mx-auto mb-4" />
                <p className="text-gray-400">Cargando productos...</p>
              </div>
            ) : products.length > 0 ? (
              <div>
                <div className="mb-4 text-gray-400">
                  {products.length} producto{products.length !== 1 ? 's' : ''} disponible
                  {products.length !== 1 ? 's' : ''}
                </div>
                <div className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3 sm:gap-4 md:gap-6">
                  {products.map((product) => (
                    <Link
                      key={product.id}
                      href={`/catalogo/${product.id}`}
                      className="card p-3 sm:p-4 hover:border-rola-gold transition-all group cursor-pointer"
                    >
                      {/* Image */}
                      <div className="relative aspect-[3/4] mb-4 bg-rola-gray/30 rounded-lg overflow-hidden">
                        {product.imageUrl ? (
                          <img
                            src={product.imageUrl}
                            alt={product.name}
                            className="w-full h-full object-cover group-hover:scale-105 transition-transform"
                          />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center">
                            <Package className="w-12 h-12 text-gray-600" />
                          </div>
                        )}
                        {product.stock <= 5 && product.stock > 0 && (
                          <div className="absolute top-2 right-2 px-2 py-1 bg-rola-red/90 text-white text-xs font-bold rounded">
                            ¡Últimas {product.stock}!
                          </div>
                        )}
                        {product.stock === 0 && (
                          <div className="absolute inset-0 bg-black/60 flex items-center justify-center">
                            <span className="text-white font-bold text-lg">Agotado</span>
                          </div>
                        )}
                      </div>

                      {/* Info */}
                      <div className="space-y-2">
                        <div className="flex items-start justify-between gap-2">
                          <h3 className="text-white font-semibold text-sm line-clamp-2 flex-1">
                            {product.name}
                          </h3>
                          {product.rarity && (
                            <span className="px-2 py-0.5 bg-rola-purple/20 text-rola-purple-light text-xs rounded flex-shrink-0">
                              {product.rarity}
                            </span>
                          )}
                        </div>

                        <div className="flex items-center justify-between">
                          <span className="text-gray-500 text-xs">
                            {getCategoryLabel(product.category)}
                          </span>
                          {product.cardCode && (
                            <span className="text-gray-500 text-xs">{product.cardCode}</span>
                          )}
                        </div>

                        {product.condition && (
                          <p className="text-gray-400 text-xs">Condición: {product.condition}</p>
                        )}

                        <div className="pt-2 border-t border-rola-gray/30">
                          <div className="flex items-center justify-between">
                            <span className="text-rola-gold font-bold text-lg">
                              ${parseFloat(product.price.toString()).toFixed(2)}
                            </span>
                            <div className="flex items-center gap-1 text-gray-400 text-sm">
                              <Package className="w-4 h-4" />
                              <span>{product.stock} en stock</span>
                            </div>
                          </div>
                        </div>
                      </div>
                    </Link>
                  ))}
                </div>
              </div>
            ) : (
              <div className="text-center py-12 card">
                <Package className="w-12 h-12 text-gray-600 mx-auto mb-4" />
                <p className="text-gray-400">No se encontraron productos</p>
              </div>
            )}
          </div>
        </div>
      </main>
      <Footer />
    </>
  );
}
