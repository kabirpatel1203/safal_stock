import { useEffect } from 'react';

const ImageModal = ({ isOpen, onClose, imageUrl, productName }) => {
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

  // Close on escape key
  useEffect(() => {
    const handleEscape = (e) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handleEscape);
    return () => window.removeEventListener('keydown', handleEscape);
  }, [onClose]);

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 modal-overlay"
      onClick={onClose}
    >
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/80"></div>

      {/* Modal Content */}
      <div
        className="relative max-w-4xl max-h-[90vh] w-full modal-content"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute -top-12 right-0 text-white hover:text-gray-300 transition-colors z-10"
        >
          <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>

        {/* Product Name */}
        {productName && (
          <p className="absolute -top-12 left-0 text-white font-medium truncate max-w-[calc(100%-60px)]">
            {productName}
          </p>
        )}

        {/* Image */}
        <div className="bg-white rounded-lg overflow-hidden">
          {imageUrl ? (
            <img
              src={imageUrl}
              alt={productName || 'Product image'}
              className="w-full h-auto max-h-[80vh] object-contain"
              loading="eager"
            />
          ) : (
            <div className="w-full h-64 flex items-center justify-center bg-gray-100">
              <div className="text-gray-400 text-center">
                <svg className="w-16 h-16 mx-auto mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                </svg>
                <p>No image available</p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default ImageModal;
