import { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import toast from 'react-hot-toast';
import SearchFilter from './SearchFilter';
import QuantityFilter from './QuantityFilter';
import SubCategoryModal from './SubCategoryModal';
import { categoryAPI, subCategoryAPI, productAPI } from '../utils/api';

// Skeleton loader
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
          {product.subCategoryId?.name}
        </p>
      </div>
    </div>
  </div>
);

const CategoryView = () => {
  const { categoryId } = useParams();
  const navigate = useNavigate();
  const [category, setCategory] = useState(null);
  const [subCategories, setSubCategories] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchText, setSearchText] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [qtyFilter, setQtyFilter] = useState('');
  const [qtyMin, setQtyMin] = useState(null);
  const [qtyMax, setQtyMax] = useState(null);
  const [filteredProducts, setFilteredProducts] = useState([]);
  const [showFilteredProducts, setShowFilteredProducts] = useState(false);
  const [isSearching, setIsSearching] = useState(false);
  const [isSubCategoryModalOpen, setIsSubCategoryModalOpen] = useState(false);
  const [editingSubCategory, setEditingSubCategory] = useState(null);

  // Fetch category and subcategories
  const fetchData = useCallback(async () => {
    setIsLoading(true);
    try {
      const [catResponse, subCatResponse] = await Promise.all([
        categoryAPI.getById(categoryId),
        subCategoryAPI.getAll({ categoryId })
      ]);
      setCategory(catResponse.data);
      setSubCategories(subCatResponse.data);
    } catch (error) {
      toast.error('Failed to load data');
      navigate('/');
    } finally {
      setIsLoading(false);
    }
  }, [categoryId, navigate]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  // Debounced search for subcategories
  useEffect(() => {
    const timer = setTimeout(async () => {
      if (searchText.trim()) {
        setIsSearching(true);
        try {
          const response = await subCategoryAPI.getAll({ 
            categoryId, 
            search: searchText 
          });
          setSearchResults(response.data.map(sc => ({ 
            ...sc, 
            type: 'subcategory', 
            id: sc._id 
          })));
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
  }, [searchText, categoryId]);

  // Fetch filtered products when quantity filter is applied
  useEffect(() => {
    const fetchFilteredProducts = async () => {
      if (qtyMin !== null || qtyMax !== null) {
        setShowFilteredProducts(true);
        setIsSearching(true);
        try {
          const params = { categoryId };
          if (qtyMin !== null) params.qtyMin = qtyMin;
          if (qtyMax !== null) params.qtyMax = qtyMax;
          if (searchText) params.search = searchText;

          const response = await productAPI.getAll(params);
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
  }, [qtyMin, qtyMax, searchText, categoryId]);

  const handleSearchResultClick = (result) => {
    navigate(`/category/${categoryId}/subcategory/${result._id}`);
    setSearchText('');
  };

  const handleQuantityFilterChange = (value, min, max) => {
    setQtyFilter(value);
    setQtyMin(min);
    setQtyMax(max);
  };

  const handleProductClick = (product) => {
    const subCategoryId = product.subCategoryId?._id || product.subCategoryId;
    navigate(`/category/${categoryId}/subcategory/${subCategoryId}`);
  };

  const handleSaveSubCategory = async (subCategoryData, subCategoryId) => {
    if (subCategoryId) {
      await subCategoryAPI.update(subCategoryId, subCategoryData);
    } else {
      await subCategoryAPI.create(subCategoryData);
    }
    fetchData();
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm sticky top-0 z-40">
        <div className="px-4 py-3">
          {/* Breadcrumb */}
          <nav className="flex items-center gap-2 text-sm mb-3 overflow-x-auto hide-scrollbar">
            <Link to="/" className="text-primary-600 hover:text-primary-700 whitespace-nowrap">
              Home
            </Link>
            <svg className="w-4 h-4 text-gray-400 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5l7 7-7 7" />
            </svg>
            <span className="text-gray-800 font-medium truncate">
              {category?.name || 'Loading...'}
            </span>
          </nav>

          {/* Search and Filter */}
          <div className="flex gap-2">
            <SearchFilter
              value={searchText}
              onChange={setSearchText}
              placeholder="Search subcategories..."
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
        {/* Show filtered products or subcategories */}
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
            <h2 className="text-lg font-semibold text-gray-800 mb-4">Subcategories</h2>

            {isLoading ? (
              <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                {[...Array(6)].map((_, i) => (
                  <CardSkeleton key={i} />
                ))}
              </div>
            ) : subCategories.length > 0 ? (
              <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                {subCategories.map((subCategory) => (
                  <div
                    key={subCategory._id}
                    onClick={() => navigate(`/category/${categoryId}/subcategory/${subCategory._id}`)}
                    className="card p-4 cursor-pointer hover:shadow-md transition-shadow active:scale-[0.98]"
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center">
                        <svg className="w-6 h-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z" />
                        </svg>
                      </div>
                      <div className="flex-1 min-w-0">
                        <h3 className="font-medium text-gray-800 truncate">{subCategory.name}</h3>
                        <p className="text-sm text-gray-500">
                          {subCategory.productsCount || 0} products
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
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z" />
                </svg>
                <p className="text-gray-500">No subcategories yet</p>
              </div>
            )}
          </div>
        )}
      </main>

      {/* Floating Action Button */}
      <button
        onClick={() => {
          setEditingSubCategory(null);
          setIsSubCategoryModalOpen(true);
        }}
        className="fab fixed bottom-6 right-6 w-14 h-14 bg-primary-500 hover:bg-primary-600 text-white rounded-full shadow-lg flex items-center justify-center transition-colors z-30"
        title="Add Subcategory"
      >
        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4v16m8-8H4" />
        </svg>
      </button>

      {/* SubCategory Modal */}
      <SubCategoryModal
        isOpen={isSubCategoryModalOpen}
        onClose={() => {
          setIsSubCategoryModalOpen(false);
          setEditingSubCategory(null);
        }}
        onSave={handleSaveSubCategory}
        subCategory={editingSubCategory}
        categoryId={categoryId}
      />
    </div>
  );
};

export default CategoryView;
