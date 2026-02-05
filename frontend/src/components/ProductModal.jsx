import { useState, useEffect } from 'react';
import toast from 'react-hot-toast';

const ProductModal = ({ isOpen, onClose, onSave, product = null, subCategoryId }) => {
  const [formData, setFormData] = useState({
    name: '',
    qty: '',
    price: '',
    billing: '',
    image: '',
    sampleLocation: '',
    ghodaLocation: '',
  });
  const [imageInputType, setImageInputType] = useState('url'); // 'url' or 'file'
  const [isLoading, setIsLoading] = useState(false);

  // Initialize form data when product changes
  useEffect(() => {
    if (product) {
      setFormData({
        name: product.name || '',
        qty: product.qty?.toString() || '',
        price: product.price?.toString() || '',
        billing: product.billing?.toString() || '',
        image: product.image || '',
        sampleLocation: product.sampleLocation || '',
        ghodaLocation: product.ghodaLocation || '',
      });
    } else {
      setFormData({
        name: '',
        qty: '',
        price: '',
        billing: '',
        image: '',
        sampleLocation: '',
        ghodaLocation: '',
      });
    }
  }, [product, isOpen]);

  // Prevent body scroll when modal is open
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }
    return () => {
      document.body.style.overflow = 'unset';
    };
  }, [isOpen]);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      // Check file size (max 5MB)
      if (file.size > 5 * 1024 * 1024) {
        toast.error('Image size must be less than 5MB');
        return;
      }

      // Convert to base64
      const reader = new FileReader();
      reader.onload = (e) => {
        setFormData(prev => ({ ...prev, image: e.target.result }));
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    // Validation
    if (!formData.name.trim()) {
      toast.error('Product name is required');
      return;
    }
    if (!formData.qty || Number(formData.qty) < 0) {
      toast.error('Valid quantity is required');
      return;
    }
    if (!formData.price || Number(formData.price) < 0) {
      toast.error('Valid price is required');
      return;
    }
    if (!formData.billing || Number(formData.billing) < 0) {
      toast.error('Valid billing is required');
      return;
    }

    setIsLoading(true);

    try {
      const payload = {
        ...formData,
        qty: Number(formData.qty),
        price: Number(formData.price),
        billing: Number(formData.billing),
        subCategoryId: product?.subCategoryId?._id || product?.subCategoryId || subCategoryId,
      };

      await onSave(payload, product?._id);
      toast.success(product ? 'Product updated!' : 'Product added!');
      onClose();
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to save product');
    } finally {
      setIsLoading(false);
    }
  };

  // Calculate rakam
  const rakam = (Number(formData.billing) || 0) * (Number(formData.price) || 0);

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-end sm:items-center justify-center modal-overlay"
      onClick={onClose}
    >
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/50"></div>

      {/* Modal Content */}
      <div
        className="relative bg-white w-full sm:max-w-lg sm:rounded-xl rounded-t-xl max-h-[90vh] overflow-hidden modal-content"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-gray-200">
          <h2 className="text-lg font-semibold text-gray-800">
            {product ? 'Edit Product' : 'Add Product'}
          </h2>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-full transition-colors"
          >
            <svg className="w-5 h-5 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-4 overflow-y-auto max-h-[calc(90vh-140px)]">
          <div className="space-y-4">
            {/* Name */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Product Name *
              </label>
              <input
                type="text"
                name="name"
                value={formData.name}
                onChange={handleInputChange}
                className="input-field"
                placeholder="Enter product name"
                disabled={isLoading}
              />
            </div>

            {/* Qty & Price Row */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Quantity *
                </label>
                <input
                  type="number"
                  name="qty"
                  value={formData.qty}
                  onChange={handleInputChange}
                  className="input-field"
                  placeholder="0"
                  min="0"
                  disabled={isLoading}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Price *
                </label>
                <input
                  type="number"
                  name="price"
                  value={formData.price}
                  onChange={handleInputChange}
                  className="input-field"
                  placeholder="0"
                  min="0"
                  step="0.01"
                  disabled={isLoading}
                />
              </div>
            </div>

            {/* Billing & Rakam Row */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Billing *
                </label>
                <input
                  type="number"
                  name="billing"
                  value={formData.billing}
                  onChange={handleInputChange}
                  className="input-field"
                  placeholder="0"
                  min="0"
                  step="0.01"
                  disabled={isLoading}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Rakam (auto)
                </label>
                <div className="input-field bg-gray-50 text-gray-600 font-medium">
                  {rakam.toLocaleString('en-IN', { maximumFractionDigits: 2 })}
                </div>
              </div>
            </div>

            {/* Image */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Image
              </label>
              <div className="flex gap-2 mb-2">
                <button
                  type="button"
                  onClick={() => setImageInputType('url')}
                  className={`px-3 py-1 text-sm rounded-full transition-colors ${
                    imageInputType === 'url'
                      ? 'bg-primary-100 text-primary-600'
                      : 'bg-gray-100 text-gray-600'
                  }`}
                >
                  URL
                </button>
                <button
                  type="button"
                  onClick={() => setImageInputType('file')}
                  className={`px-3 py-1 text-sm rounded-full transition-colors ${
                    imageInputType === 'file'
                      ? 'bg-primary-100 text-primary-600'
                      : 'bg-gray-100 text-gray-600'
                  }`}
                >
                  Upload
                </button>
              </div>

              {imageInputType === 'url' ? (
                <input
                  type="url"
                  name="image"
                  value={formData.image.startsWith('data:') ? '' : formData.image}
                  onChange={handleInputChange}
                  className="input-field"
                  placeholder="https://example.com/image.jpg"
                  disabled={isLoading}
                />
              ) : (
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleFileChange}
                  className="w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-medium file:bg-primary-50 file:text-primary-600 hover:file:bg-primary-100"
                  disabled={isLoading}
                />
              )}

              {/* Image Preview */}
              {formData.image && (
                <div className="mt-2 relative inline-block">
                  <img
                    src={formData.image}
                    alt="Preview"
                    className="h-20 w-20 object-cover rounded-lg border border-gray-200"
                  />
                  <button
                    type="button"
                    onClick={() => setFormData(prev => ({ ...prev, image: '' }))}
                    className="absolute -top-2 -right-2 w-6 h-6 bg-red-500 text-white rounded-full flex items-center justify-center"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecup="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                </div>
              )}
            </div>

            {/* Locations */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Sample Location
                </label>
                <input
                  type="text"
                  name="sampleLocation"
                  value={formData.sampleLocation}
                  onChange={handleInputChange}
                  className="input-field"
                  placeholder="e.g., A1"
                  disabled={isLoading}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Ghoda Location
                </label>
                <input
                  type="text"
                  name="ghodaLocation"
                  value={formData.ghodaLocation}
                  onChange={handleInputChange}
                  className="input-field"
                  placeholder="e.g., G1"
                  disabled={isLoading}
                />
              </div>
            </div>
          </div>

          {/* Actions */}
          <div className="flex gap-3 mt-6">
            <button
              type="button"
              onClick={onClose}
              className="btn-secondary flex-1"
              disabled={isLoading}
            >
              Cancel
            </button>
            <button
              type="submit"
              className="btn-primary flex-1"
              disabled={isLoading}
            >
              {isLoading ? (
                <span className="flex items-center justify-center">
                  <svg className="animate-spin -ml-1 mr-2 h-5 w-5 text-white" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  Saving...
                </span>
              ) : (
                'Save'
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default ProductModal;
