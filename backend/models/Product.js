const mongoose = require('mongoose');

const productSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'Product name is required'],
    trim: true,
    maxlength: [200, 'Product name cannot exceed 200 characters']
  },
  subCategoryId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'SubCategory',
    required: [true, 'SubCategory ID is required']
  },
  qty: {
    type: Number,
    required: [true, 'Quantity is required'],
    min: [0, 'Quantity cannot be negative'],
    default: 0
  },
  price: {
    type: Number,
    required: [true, 'Price is required'],
    min: [0, 'Price cannot be negative'],
    default: 0
  },
  billing: {
    type: Number,
    required: [true, 'Billing is required'],
    min: [0, 'Billing cannot be negative'],
    default: 0
  },
  image: {
    type: String,
    default: ''
  },
  sampleLocation: {
    type: String,
    trim: true,
    maxlength: [200, 'Sample location cannot exceed 200 characters'],
    default: ''
  },
  ghodaLocation: {
    type: String,
    trim: true,
    maxlength: [200, 'Ghoda location cannot exceed 200 characters'],
    default: ''
  },
  createdAt: {
    type: Date,
    default: Date.now
  },
  updatedAt: {
    type: Date,
    default: Date.now
  }
});

// Virtual field for rakam (billing × price)
productSchema.virtual('rakam').get(function() {
  return this.billing * this.price;
});

// Update the updatedAt field before saving
productSchema.pre('save', function(next) {
  this.updatedAt = Date.now();
  next();
});

productSchema.pre('findOneAndUpdate', function(next) {
  this.set({ updatedAt: Date.now() });
  next();
});

// Ensure virtuals are included in JSON
productSchema.set('toJSON', { virtuals: true });
productSchema.set('toObject', { virtuals: true });

// Indexes for faster queries
productSchema.index({ subCategoryId: 1 });
productSchema.index({ name: 'text' });
productSchema.index({ qty: 1 });

module.exports = mongoose.model('Product', productSchema);
