import { useState, useEffect, useCallback, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import SearchFilter from './SearchFilter';
import QuantityFilter from './QuantityFilter';
import CategoryModal from './CategoryModal';
import { categoryAPI, subCategoryAPI, productAPI } from '../utils/api';

// Long press hook
const useLongPress = (callback, ms = 500) => {
  const timerRef = useRef(null);
  const callbackRef = useRef(callback);
  
  useEffect(() => {
    callbackRef.current = callback;
  }, [callback]);

  const start = useCallback((e) => {
    if (e.type === 'touchstart') {
      e.preventDefault();
    }
    timerRef.current = setTimeout(() => {
      callbackRef.current(e);
    }, ms);
  }, [ms]);

  const stop = useCallback(() => {
    if (timerRef.current) {
      clearTimeout(timerRef.current);
      timerRef.current = null;
    }
  }, []);

  return {
    onMouseDown: start,
    onMouseUp: stop,
    onMouseLeave: stop,
    onTouchStart: start,
    onTouchEnd: stop,
    onTouchMove: stop,
  };
};

// Skeleton loader for cards
const CardSkeleton = () => (
  <div className="card p-4 animate-pulse">
    <div className="flex items-center gap-3">
      <div className="w-12 h-12 bg-gray-200 rounded-lg"></div>
      <div className="flex-1">
        <div className="h-4 bg-gray-200 rounded w-3/4 mb-2"></div>
        <div className="h-3 bg-gray-200 rounded w-1/2"></div>
      </div>
    </div>
  </div>
);

// Selectable Product card for filtered results
const SelectableProductCard = ({ 
  product, 
  onClick, 
  isSelectionMode, 
  isSelected, 
  onLongPress, 
  onToggleSelect 
}) => {
  const longPressHandlers = useLongPress(onLongPress, 500);

  const handleClick = (e) => {
    if (isSelectionMode) {
      e.preventDefault();
      e.stopPropagation();
      onToggleSelect();
    } else {
      onClick();
    }
  };

  return (
    <div
      {...longPressHandlers}
      onClick={handleClick}
      className={`card p-4 cursor-pointer hover:shadow-md transition-all select-none ${
        isSelected ? 'ring-2 ring-primary-500 bg-primary-50' : ''
      }`}
    >
      <div className="flex items-center gap-3">
        {isSelectionMode && (
          <div className="flex items-center">
            <input
              type="checkbox"
              checked={isSelected}
              onChange={onToggleSelect}
              onClick={(e) => e.stopPropagation()}
              className="w-5 h-5 text-primary-600 rounded border-gray-300 focus:ring-primary-500"
            />
          </div>
        )}
        {product.image ? (
          <img
            src={product.image}
            alt={product.name}
            className="w-12 h-12 object-cover rounded-lg"
            loading="lazy"
          />
        ) : (
          <div className="w-12 h-12 bg-gray-100 rounded-lg flex items-center justify-center">
            <svg className="w-6 h-6 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
            </svg>
          </div>
        )}
        <div className="flex-1 min-w-0">
          <h3 className="font-medium text-gray-800 truncate">{product.name}</h3>
          <p className="text-sm text-gray-500">
            Qty: {product.qty} | Rakam: ₹{product.rakam?.toLocaleString('en-IN') || 0}
          </p>
          <p className="text-xs text-gray-400 truncate">
            {product.subCategoryId?.categoryId?.name} → {product.subCategoryId?.name}
          </p>
        </div>
      </div>
    </div>
  );
};

const Dashboard = () => {
  const navigate = useNavigate();
  const [categories, setCategories] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchText, setSearchText] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [qtyFilter, setQtyFilter] = useState('');
  const [qtyMin, setQtyMin] = useState(null);
  const [qtyMax, setQtyMax] = useState(null);
  const [filteredProducts, setFilteredProducts] = useState([]);
  const [showFilteredProducts, setShowFilteredProducts] = useState(false);
  const [isSearching, setIsSearching] = useState(false);
  const [isCategoryModalOpen, setIsCategoryModalOpen] = useState(false);
  const [editingCategory, setEditingCategory] = useState(null);

  // Selection mode state
  const [isSelectionMode, setIsSelectionMode] = useState(false);
  const [selectedProducts, setSelectedProducts] = useState(new Set());
  const [isSharing, setIsSharing] = useState(false);

  // Clear selection when filters change
  useEffect(() => {
    setSelectedProducts(new Set());
    setIsSelectionMode(false);
  }, [searchText, qtyMin, qtyMax]);

  // Handle long press to enter selection mode
  const handleLongPress = useCallback((product) => {
    setIsSelectionMode(true);
    setSelectedProducts(new Set([product._id]));
    if (navigator.vibrate) {
      navigator.vibrate(50);
    }
  }, []);

  // Toggle product selection
  const toggleProductSelection = useCallback((productId) => {
    setSelectedProducts(prev => {
      const next = new Set(prev);
      if (next.has(productId)) {
        next.delete(productId);
      } else {
        next.add(productId);
      }
      if (next.size === 0) {
        setIsSelectionMode(false);
      }
      return next;
    });
  }, []);

  // Select all products
  const selectAllProducts = useCallback(() => {
    const allIds = filteredProducts.map(p => p._id);
    setSelectedProducts(new Set(allIds));
  }, [filteredProducts]);

  // Deselect all products
  const clearSelection = useCallback(() => {
    setSelectedProducts(new Set());
    setIsSelectionMode(false);
  }, []);

  // Share selected product images
  const shareSelectedImages = async () => {
    const selectedProductsList = filteredProducts.filter(p => selectedProducts.has(p._id) && p.image);
    
    if (selectedProductsList.length === 0) {
      toast.error('No images to share. Selected products have no images.');
      return;
    }

    setIsSharing(true);
    try {
      const imagePromises = selectedProductsList.map(async (product) => {
        try {
          const response = await fetch(product.image);
          const blob = await response.blob();
          const extension = blob.type.split('/')[1] || 'jpg';
          return new File([blob], `${product.name}.${extension}`, { type: blob.type });
        } catch (err) {
          console.error(`Failed to fetch image for ${product.name}:`, err);
          return null;
        }
      });

      const files = (await Promise.all(imagePromises)).filter(f => f !== null);

      if (files.length === 0) {
        toast.error('Failed to load images for sharing');
        return;
      }

      if (navigator.canShare && navigator.canShare({ files })) {
        await navigator.share({
          files,
          title: 'Product Images',
          text: `Sharing ${files.length} product image(s) from inventory`,
        });
        toast.success('Images shared successfully');
        clearSelection();
      } else {
        toast.error('Sharing not supported on this device. Please use a mobile device or a browser that supports sharing.');
      }
    } catch (error) {
      if (error.name !== 'AbortError') {
        console.error('Share failed:', error);
        toast.error('Failed to share images');
      }
    } finally {
      setIsSharing(false);
    }
  };

  // Fetch categories
  const fetchCategories = useCallback(async () => {
    try {
      const response = await categoryAPI.getAll();
      setCategories(response.data);
    } catch (error) {
      toast.error('Failed to load categories');
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchCategories();
  }, [fetchCategories]);

  // Debounced search for categories and subcategories
  useEffect(() => {
    const timer = setTimeout(async () => {
      if (searchText.trim()) {
        setIsSearching(true);
        try {
          const [catResponse, subCatResponse] = await Promise.all([
            categoryAPI.getAll(searchText),
            subCategoryAPI.getAll({ search: searchText })
          ]);

          const results = [
            ...catResponse.data.map(c => ({ ...c, type: 'category', id: c._id })),
            ...subCatResponse.data.map(sc => ({ ...sc, type: 'subcategory', id: sc._id }))
          ];

          setSearchResults(results);
        } catch (error) {
          console.error('Search error:', error);
        } finally {
          setIsSearching(false);
        }
      } else {
        setSearchResults([]);
      }
    }, 300);

    return () => clearTimeout(timer);
  }, [searchText]);

  // Fetch filtered products when quantity filter is applied
  useEffect(() => {
    const fetchFilteredProducts = async () => {
      if (qtyMin !== null || qtyMax !== null) {
        setShowFilteredProducts(true);
        setIsSearching(true);
        try {
          const params = {};
          if (qtyMin !== null) params.qtyMin = qtyMin;
          if (qtyMax !== null) params.qtyMax = qtyMax;
          if (searchText) params.search = searchText;

          const response = await productAPI.search(params);
          setFilteredProducts(response.data.products);
        } catch (error) {
          toast.error('Failed to filter products');
        } finally {
          setIsSearching(false);
        }
      } else {
        setShowFilteredProducts(false);
        setFilteredProducts([]);
      }
    };

    fetchFilteredProducts();
  }, [qtyMin, qtyMax, searchText]);

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    navigate('/login');
    toast.success('Logged out successfully');
  };

  const handleSearchResultClick = (result) => {
    if (result.type === 'category') {
      navigate(`/category/${result._id}`);
    } else {
      navigate(`/category/${result.categoryId._id || result.categoryId}/subcategory/${result._id}`);
    }
    setSearchText('');
  };

  const handleQuantityFilterChange = (value, min, max) => {
    setQtyFilter(value);
    setQtyMin(min);
    setQtyMax(max);
  };

  const handleProductClick = (product) => {
    const categoryId = product.subCategoryId?.categoryId?._id || product.subCategoryId?.categoryId;
    const subCategoryId = product.subCategoryId?._id || product.subCategoryId;
    navigate(`/category/${categoryId}/subcategory/${subCategoryId}`);
  };

  const handleSaveCategory = async (categoryData, categoryId) => {
    if (categoryId) {
      await categoryAPI.update(categoryId, categoryData);
    } else {
      await categoryAPI.create(categoryData);
    }
    fetchCategories();
  };

  const user = JSON.parse(localStorage.getItem('user') || '{}');

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm sticky top-0 z-40">
        <div className="px-4 py-3">
          <div className="flex items-center justify-between mb-3">
            <h1 className="text-xl font-bold text-gray-800">Veneer Inventory</h1>
            <div className="flex items-center gap-2">
              <span className="text-sm text-gray-500 hidden sm:inline">{user.username}</span>
              <button
                onClick={handleLogout}
                className="p-2 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
                title="Logout"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                </svg>
              </button>
            </div>
          </div>

          {/* Search and Filter */}
          <div className="flex gap-2">
            <SearchFilter
              value={searchText}
              onChange={setSearchText}
              placeholder="Search categories or subcategories..."
              results={searchResults}
              onResultClick={handleSearchResultClick}
            />
            <QuantityFilter
              value={qtyFilter}
              onChange={handleQuantityFilterChange}
            />
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="p-4">
        {/* Selection Mode Toolbar */}
        {isSelectionMode && showFilteredProducts && (
          <div className="fixed top-0 left-0 right-0 bg-primary-600 text-white px-4 py-3 z-50 shadow-lg animate-slide-down">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <button
                  onClick={clearSelection}
                  className="p-1 hover:bg-primary-700 rounded-lg transition-colors"
                >
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
                <span className="font-medium">{selectedProducts.size} selected</span>
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={selectedProducts.size === filteredProducts.length ? clearSelection : selectAllProducts}
                  className="px-3 py-1.5 text-sm bg-primary-700 hover:bg-primary-800 rounded-lg transition-colors"
                >
                  {selectedProducts.size === filteredProducts.length ? 'Deselect All' : 'Select All'}
                </button>
                <button
                  onClick={shareSelectedImages}
                  disabled={isSharing || selectedProducts.size === 0}
                  className="px-3 py-1.5 text-sm bg-white text-primary-600 hover:bg-gray-100 rounded-lg transition-colors flex items-center gap-2 disabled:opacity-50"
                >
                  {isSharing ? (
                    <>
                      <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                      </svg>
                      Sharing...
                    </>
                  ) : (
                    <>
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.368 2.684 3 3 0 00-5.368-2.684z" />
                      </svg>
                      Share Images
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Show filtered products or categories */}
        {showFilteredProducts ? (
          <div>
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold text-gray-800">
                Filtered Products ({filteredProducts.length})
              </h2>
              <button
                onClick={() => {
                  setQtyFilter('');
                  setQtyMin(null);
                  setQtyMax(null);
                  setSearchText('');
                  clearSelection();
                }}
                className="text-sm text-primary-600 hover:text-primary-700"
              >
                Clear filters
              </button>
            </div>

            {isSearching ? (
              <div className="grid gap-3">
                {[...Array(6)].map((_, i) => (
                  <CardSkeleton key={i} />
                ))}
              </div>
            ) : filteredProducts.length > 0 ? (
              <div className="grid gap-3">
                {filteredProducts.map((product) => (
                  <SelectableProductCard
                    key={product._id}
                    product={product}
                    onClick={() => handleProductClick(product)}
                    isSelectionMode={isSelectionMode}
                    isSelected={selectedProducts.has(product._id)}
                    onLongPress={() => handleLongPress(product)}
                    onToggleSelect={() => toggleProductSelection(product._id)}
                  />
                ))}
              </div>
            ) : (
              <div className="text-center py-12">
                <svg className="w-16 h-16 mx-auto text-gray-300 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9.172 16.172a4 4 0 015.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <p className="text-gray-500">No products match your filters</p>
              </div>
            )}
          </div>
        ) : (
          <div>
            <h2 className="text-lg font-semibold text-gray-800 mb-4">Categories</h2>

            {isLoading ? (
              <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                {[...Array(6)].map((_, i) => (
                  <CardSkeleton key={i} />
                ))}
              </div>
            ) : categories.length > 0 ? (
              <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                {categories.map((category) => (
                  <div
                    key={category._id}
                    onClick={() => navigate(`/category/${category._id}`)}
                    className="card p-4 cursor-pointer hover:shadow-md transition-shadow active:scale-[0.98]"
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-12 h-12 bg-primary-100 rounded-lg flex items-center justify-center">
                        <svg className="w-6 h-6 text-primary-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
                        </svg>
                      </div>
                      <div className="flex-1 min-w-0">
                        <h3 className="font-medium text-gray-800 truncate">{category.name}</h3>
                        <p className="text-sm text-gray-500">
                          {category.subCategoriesCount || 0} subcategories
                        </p>
                      </div>
                      <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5l7 7-7 7" />
                      </svg>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-12">
                <svg className="w-16 h-16 mx-auto text-gray-300 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
                </svg>
                <p className="text-gray-500">No categories yet</p>
              </div>
            )}
          </div>
        )}
      </main>

      {/* Floating Action Button */}
      <button
        onClick={() => {
          setEditingCategory(null);
          setIsCategoryModalOpen(true);
        }}
        className="fab fixed bottom-6 right-6 w-14 h-14 bg-primary-500 hover:bg-primary-600 text-white rounded-full shadow-lg flex items-center justify-center transition-colors z-30"
        title="Add Category"
      >
        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4v16m8-8H4" />
        </svg>
      </button>

      {/* Category Modal */}
      <CategoryModal
        isOpen={isCategoryModalOpen}
        onClose={() => {
          setIsCategoryModalOpen(false);
          setEditingCategory(null);
        }}
        onSave={handleSaveCategory}
        category={editingCategory}
      />
    </div>
  );
};

export default Dashboard;
