import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import SearchFilter from './SearchFilter';
import QuantityFilter from './QuantityFilter';
import { categoryAPI, subCategoryAPI, productAPI } from '../utils/api';

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

// Product card for filtered results
const ProductCard = ({ product, onClick }) => (
  <div
    onClick={onClick}
    className="card p-4 cursor-pointer hover:shadow-md transition-shadow"
  >
    <div className="flex items-center gap-3">
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

  // Fetch categories
  useEffect(() => {
    const fetchCategories = async () => {
      try {
        const response = await categoryAPI.getAll();
        setCategories(response.data);
      } catch (error) {
        toast.error('Failed to load categories');
      } finally {
        setIsLoading(false);
      }
    };

    fetchCategories();
  }, []);

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
                  <ProductCard
                    key={product._id}
                    product={product}
                    onClick={() => handleProductClick(product)}
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
    </div>
  );
};

export default Dashboard;
