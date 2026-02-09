import { useState, useEffect } from 'react';
import toast from 'react-hot-toast';
import PasscodeModal from './PasscodeModal';

const SubCategoryModal = ({ isOpen, onClose, onSave, onDelete, subCategory = null, categoryId }) => {
  const [name, setName] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [showPasscodeModal, setShowPasscodeModal] = useState(false);

  // Initialize form data when subCategory changes
  useEffect(() => {
    if (subCategory) {
      setName(subCategory.name || '');
    } else {
      setName('');
    }
  }, [subCategory, isOpen]);

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

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!name.trim()) {
      toast.error('Subcategory name is required');
      return;
    }

    setIsLoading(true);

    try {
      const payload = {
        name: name.trim(),
        categoryId: subCategory?.categoryId?._id || subCategory?.categoryId || categoryId,
      };
      await onSave(payload, subCategory?._id);
      toast.success(subCategory ? 'Subcategory updated!' : 'Subcategory added!');
      onClose();
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to save subcategory');
    } finally {
      setIsLoading(false);
    }
  };

  const handleDelete = async () => {
    if (onDelete && subCategory?._id) {
      await onDelete(subCategory._id);
      toast.success('Subcategory deleted!');
      onClose();
    }
  };

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
        className="relative bg-white w-full sm:max-w-md sm:rounded-xl rounded-t-xl overflow-hidden modal-content"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-gray-200">
          <h2 className="text-lg font-semibold text-gray-800">
            {subCategory ? 'Edit Subcategory' : 'Add Subcategory'}
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
        <form onSubmit={handleSubmit} className="p-4">
          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Subcategory Name <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="input-field"
              placeholder="Enter subcategory name"
              autoFocus
              maxLength={100}
            />
          </div>

          {/* Delete Button (only for editing existing subcategory) */}
          {subCategory && onDelete && (
            <div className="mb-4 p-3 bg-red-50 rounded-lg border border-red-100">
              <p className="text-sm text-red-600 mb-2">
                Deleting this subcategory will also delete all its products.
              </p>
              <button
                type="button"
                onClick={() => setShowPasscodeModal(true)}
                className="w-full btn-danger text-sm py-2"
              >
                <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                </svg>
                Delete Subcategory
              </button>
            </div>
          )}

          {/* Actions */}
          <div className="flex gap-3 mt-6">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 btn-secondary"
              disabled={isLoading}
            >
              Cancel
            </button>
            <button
              type="submit"
              className="flex-1 btn-primary"
              disabled={isLoading}
            >
              {isLoading ? (
                <span className="flex items-center justify-center">
                  <svg className="animate-spin -ml-1 mr-2 h-5 w-5" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  Saving...
                </span>
              ) : (
                subCategory ? 'Update' : 'Add Subcategory'
              )}
            </button>
          </div>
        </form>
      </div>

      {/* Passcode Modal for Delete Confirmation */}
      <PasscodeModal
        isOpen={showPasscodeModal}
        onClose={() => setShowPasscodeModal(false)}
        onConfirm={handleDelete}
        title="Delete Subcategory"
        message={`Enter passcode to delete "${subCategory?.name}". This will also delete all products in this subcategory.`}
      />
    </div>
  );
};

export default SubCategoryModal;
