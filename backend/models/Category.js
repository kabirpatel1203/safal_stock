const mongoose = require('mongoose');

const categorySchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'Category name is required'],
    unique: true,
    trim: true,
    maxlength: [100, 'Category name cannot exceed 100 characters']
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
});

// Virtual for subcategories count
categorySchema.virtual('subCategoriesCount', {
  ref: 'SubCategory',
  localField: '_id',
  foreignField: 'categoryId',
  count: true
});

categorySchema.set('toJSON', { virtuals: true });
categorySchema.set('toObject', { virtuals: true });

module.exports = mongoose.model('Category', categorySchema);
