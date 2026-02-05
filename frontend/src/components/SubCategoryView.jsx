import { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import toast from 'react-hot-toast';
import SearchFilter from './SearchFilter';
import QuantityFilter from './QuantityFilter';
import ProductModal from './ProductModal';
import ImageModal from './ImageModal';
import { categoryAPI, subCategoryAPI, productAPI } from '../utils/api';

// Skeleton loader
const ProductSkeleton = () => (
  <div className="card p-4 animate-pulse">
    <div className="flex gap-4">
      <div className="w-14 h-14 bg-gray-200 rounded-lg flex-shrink-0"></div>
      <div className="flex-1">
        <div className="h-4 bg-gray-200 rounded w-3/4 mb-2"></div>
        <div className="h-3 bg-gray-200 rounded w-1/2 mb-2"></div>
        <div className="h-3 bg-gray-200 rounded w-1/3"></div>
      </div>
    </div>
  </div>
);

const SubCategoryView = () => {
  const { categoryId, subCategoryId } = useParams();
  const navigate = useNavigate();
  
  const [category, setCategory] = useState(null);
  const [subCategory, setSubCategory] = useState(null);
  const [products, setProducts] = useState([]);
  const [pagination, setPagination] = useState({ page: 1, pages: 1, total: 0 });
  const [isLoading, setIsLoading] = useState(true);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  
  const [searchText, setSearchText] = useState('');
  const [qtyFilter, setQtyFilter] = useState('');
  const [qtyMin, setQtyMin] = useState(null);
  const [qtyMax, setQtyMax] = useState(null);
  
  const [isProductModalOpen, setIsProductModalOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState(null);
  const [isImageModalOpen, setIsImageModalOpen] = useState(false);
  const [selectedImage, setSelectedImage] = useState({ url: '', name: '' });
  const [deletingProductId, setDeletingProductId] = useState(null);

  // Fetch initial data
  useEffect(() => {
    const fetchData = async () => {
      setIsLoading(true);
      try {
        const [catResponse, subCatResponse] = await Promise.all([
          categoryAPI.getById(categoryId),
          subCategoryAPI.getById(subCategoryId)
        ]);
        setCategory(catResponse.data);
        setSubCategory(subCatResponse.data);
      } catch (error) {
        toast.error('Failed to load data');
        navigate('/');
      } finally {
        setIsLoading(false);
      }
    };

    fetchData();
  }, [categoryId, subCategoryId, navigate]);

  // Fetch products with debounce and filters
  const fetchProducts = useCallback(async (page = 1, append = false) => {
    if (append) {
      setIsLoadingMore(true);
    } else {
      setIsLoading(true);
    }

    try {
      const params = {
        subCategoryId,
        page,
        limit: 20
      };

      if (searchText) params.search = searchText;
      if (qtyMin !== null) params.qtyMin = qtyMin;
      if (qtyMax !== null) params.qtyMax = qtyMax;

      const response = await productAPI.getAll(params);
      
      if (append) {
        setProducts(prev => [...prev, ...response.data.products]);
      } else {
        setProducts(response.data.products);
      }
      setPagination(response.data.pagination);
    } catch (error) {
      toast.error('Failed to load products');
    } finally {
      setIsLoading(false);
      setIsLoadingMore(false);
    }
  }, [subCategoryId, searchText, qtyMin, qtyMax]);

  // Debounced fetch when filters change
  useEffect(() => {
    const timer = setTimeout(() => {
      fetchProducts(1, false);
    }, 300);

    return () => clearTimeout(timer);
  }, [fetchProducts]);

  const handleQuantityFilterChange = (value, min, max) => {
    setQtyFilter(value);
    setQtyMin(min);
    setQtyMax(max);
  };

  const handleLoadMore = () => {
    if (pagination.page < pagination.pages && !isLoadingMore) {
      fetchProducts(pagination.page + 1, true);
    }
  };

  const handleSaveProduct = async (productData, productId) => {
    if (productId) {
      // Update existing product
      await productAPI.update(productId, productData);
    } else {
      // Create new product
      await productAPI.create(productData);
    }
    fetchProducts(1, false);
  };

  const handleDeleteProduct = async (productId) => {
    if (!window.confirm('Are you sure you want to delete this product?')) {
      return;
    }

    setDeletingProductId(productId);
    try {
      await productAPI.delete(productId);
      toast.success('Product deleted');
      fetchProducts(1, false);
    } catch (error) {
      toast.error('Failed to delete product');
    } finally {
      setDeletingProductId(null);
    }
  };

  const handleEditProduct = (product) => {
    setEditingProduct(product);
    setIsProductModalOpen(true);
  };

  const handleViewImage = (imageUrl, productName) => {
    setSelectedImage({ url: imageUrl, name: productName });
    setIsImageModalOpen(true);
  };

  return (
    <div className="min-h-screen bg-gray-50 pb-20">
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
            <Link 
              to={`/category/${categoryId}`} 
              className="text-primary-600 hover:text-primary-700 whitespace-nowrap"
            >
              {category?.name || 'Loading...'}
            </Link>
            <svg className="w-4 h-4 text-gray-400 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5l7 7-7 7" />
            </svg>
            <span className="text-gray-800 font-medium truncate">
              {subCategory?.name || 'Loading...'}
            </span>
          </nav>

          {/* Search and Filter */}
          <div className="flex gap-2">
            <SearchFilter
              value={searchText}
              onChange={setSearchText}
              placeholder="Search products..."
              results={[]}
              onResultClick={() => {}}
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
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold text-gray-800">
            Products ({pagination.total})
          </h2>
          {(searchText || qtyFilter) && (
            <button
              onClick={() => {
                setSearchText('');
                setQtyFilter('');
                setQtyMin(null);
                setQtyMax(null);
              }}
              className="text-sm text-primary-600 hover:text-primary-700"
            >
              Clear filters
            </button>
          )}
        </div>

        {isLoading && products.length === 0 ? (
          <div className="space-y-3">
            {[...Array(6)].map((_, i) => (
              <ProductSkeleton key={i} />
            ))}
          </div>
        ) : products.length > 0 ? (
          <>
            {/* Mobile Product Cards */}
            <div className="block lg:hidden space-y-3">
              {products.map((product) => (
                <div key={product._id} className="card p-4">
                  <div className="flex gap-4">
                    {/* Image */}
                    <div
                      onClick={() => product.image && handleViewImage(product.image, product.name)}
                      className={`w-14 h-14 rounded-lg flex-shrink-0 overflow-hidden ${
                        product.image ? 'cursor-pointer' : ''
                      }`}
                    >
                      {product.image ? (
                        <img
                          src={product.image}
                          alt={product.name}
                          className="w-full h-full object-cover"
                          loading="lazy"
                        />
                      ) : (
                        <div className="w-full h-full bg-gray-100 flex items-center justify-center">
                          <svg className="w-6 h-6 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                          </svg>
                        </div>
                      )}
                    </div>

                    {/* Details */}
                    <div className="flex-1 min-w-0">
                      <h3 className="font-medium text-gray-800 truncate">{product.name}</h3>
                      <div className="mt-1 grid grid-cols-2 gap-x-4 gap-y-1 text-sm">
                        <p className="text-gray-500">
                          Qty: <span className="font-medium text-gray-700">{product.qty}</span>
                        </p>
                        <p className="text-gray-500">
                          Price: <span className="font-medium text-gray-700">₹{product.price}</span>
                        </p>
                        <p className="text-gray-500">
                          Billing: <span className="font-medium text-gray-700">{product.billing}</span>
                        </p>
                        <p className="text-gray-500">
                          Rakam: <span className="font-medium text-green-600">₹{product.rakam?.toLocaleString('en-IN')}</span>
                        </p>
                      </div>
                      <div className="mt-1 text-xs text-gray-400">
                        {product.sampleLocation && <span>Sample: {product.sampleLocation}</span>}
                        {product.sampleLocation && product.ghodaLocation && <span> | </span>}
                        {product.ghodaLocation && <span>Ghoda: {product.ghodaLocation}</span>}
                      </div>
                    </div>

                    {/* Actions */}
                    <div className="flex flex-col gap-2">
                      <button
                        onClick={() => handleEditProduct(product)}
                        className="p-2 text-primary-600 hover:bg-primary-50 rounded-lg transition-colors"
                        title="Edit"
                      >
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                        </svg>
                      </button>
                      <button
                        onClick={() => handleDeleteProduct(product._id)}
                        disabled={deletingProductId === product._id}
                        className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors disabled:opacity-50"
                        title="Delete"
                      >
                        {deletingProductId === product._id ? (
                          <svg className="w-5 h-5 animate-spin" fill="none" viewBox="0 0 24 24">
                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                          </svg>
                        ) : (
                          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                          </svg>
                        )}
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {/* Desktop Table */}
            <div className="hidden lg:block overflow-x-auto">
              <table className="w-full bg-white rounded-xl shadow-sm">
                <thead>
                  <tr className="border-b border-gray-100">
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Image</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Name</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Qty</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Price</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Billing</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Rakam</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Sample Loc</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Ghoda Loc</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {products.map((product) => (
                    <tr key={product._id} className="hover:bg-gray-50">
                      <td className="px-4 py-3">
                        <div
                          onClick={() => product.image && handleViewImage(product.image, product.name)}
                          className={`w-12 h-12 rounded-lg overflow-hidden ${
                            product.image ? 'cursor-pointer' : ''
                          }`}
                        >
                          {product.image ? (
                            <img
                              src={product.image}
                              alt={product.name}
                              className="w-full h-full object-cover"
                              loading="lazy"
                            />
                          ) : (
                            <div className="w-full h-full bg-gray-100 flex items-center justify-center">
                              <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                              </svg>
                            </div>
                          )}
                        </div>
                      </td>
                      <td className="px-4 py-3 font-medium text-gray-800">{product.name}</td>
                      <td className="px-4 py-3 text-gray-600">{product.qty}</td>
                      <td className="px-4 py-3 text-gray-600">₹{product.price}</td>
                      <td className="px-4 py-3 text-gray-600">{product.billing}</td>
                      <td className="px-4 py-3 font-medium text-green-600">₹{product.rakam?.toLocaleString('en-IN')}</td>
                      <td className="px-4 py-3 text-gray-600">{product.sampleLocation || '-'}</td>
                      <td className="px-4 py-3 text-gray-600">{product.ghodaLocation || '-'}</td>
                      <td className="px-4 py-3">
                        <div className="flex gap-2">
                          <button
                            onClick={() => handleEditProduct(product)}
                            className="p-2 text-primary-600 hover:bg-primary-50 rounded-lg transition-colors"
                            title="Edit"
                          >
                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                            </svg>
                          </button>
                          <button
                            onClick={() => handleDeleteProduct(product._id)}
                            disabled={deletingProductId === product._id}
                            className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors disabled:opacity-50"
                            title="Delete"
                          >
                            {deletingProductId === product._id ? (
                              <svg className="w-5 h-5 animate-spin" fill="none" viewBox="0 0 24 24">
                                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                              </svg>
                            ) : (
                              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                              </svg>
                            )}
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Load More */}
            {pagination.page < pagination.pages && (
              <div className="mt-6 text-center">
                <button
                  onClick={handleLoadMore}
                  disabled={isLoadingMore}
                  className="btn-secondary"
                >
                  {isLoadingMore ? (
                    <span className="flex items-center">
                      <svg className="animate-spin -ml-1 mr-2 h-5 w-5" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                      </svg>
                      Loading...
                    </span>
                  ) : (
                    `Load More (${pagination.page}/${pagination.pages})`
                  )}
                </button>
              </div>
            )}
          </>
        ) : (
          <div className="text-center py-12">
            <svg className="w-16 h-16 mx-auto text-gray-300 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
            </svg>
            <p className="text-gray-500 mb-4">
              {searchText || qtyFilter ? 'No products match your filters' : 'No products yet'}
            </p>
            {!searchText && !qtyFilter && (
              <button
                onClick={() => setIsProductModalOpen(true)}
                className="btn-primary"
              >
                Add First Product
              </button>
            )}
          </div>
        )}
      </main>

      {/* Floating Action Button */}
      <button
        onClick={() => {
          setEditingProduct(null);
          setIsProductModalOpen(true);
        }}
        className="fab fixed bottom-6 right-6 w-14 h-14 bg-primary-500 hover:bg-primary-600 text-white rounded-full shadow-lg flex items-center justify-center transition-colors z-30"
        title="Add Product"
      >
        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4v16m8-8H4" />
        </svg>
      </button>

      {/* Product Modal */}
      <ProductModal
        isOpen={isProductModalOpen}
        onClose={() => {
          setIsProductModalOpen(false);
          setEditingProduct(null);
        }}
        onSave={handleSaveProduct}
        product={editingProduct}
        subCategoryId={subCategoryId}
      />

      {/* Image Modal */}
      <ImageModal
        isOpen={isImageModalOpen}
        onClose={() => setIsImageModalOpen(false)}
        imageUrl={selectedImage.url}
        productName={selectedImage.name}
      />
    </div>
  );
};

export default SubCategoryView;
