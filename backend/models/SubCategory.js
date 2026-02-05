const mongoose = require('mongoose');

const subCategorySchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'SubCategory name is required'],
    trim: true,
    maxlength: [100, 'SubCategory name cannot exceed 100 characters']
  },
  categoryId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Category',
    required: [true, 'Category ID is required']
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
});

// Compound index for unique subcategory name within a category
subCategorySchema.index({ name: 1, categoryId: 1 }, { unique: true });

// Virtual for products count
subCategorySchema.virtual('productsCount', {
  ref: 'Product',
  localField: '_id',
  foreignField: 'subCategoryId',
  count: true
});

subCategorySchema.set('toJSON', { virtuals: true });
subCategorySchema.set('toObject', { virtuals: true });

module.exports = mongoose.model('SubCategory', subCategorySchema);
