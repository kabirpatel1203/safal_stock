const express = require('express');
const { body, validationResult } = require('express-validator');
const Product = require('../models/Product');
const SubCategory = require('../models/SubCategory');
const { protect } = require('../middleware/auth');

const router = express.Router();

// @route   GET /api/products
// @desc    Get products with filters and pagination
// @access  Private
router.get('/', protect, async (req, res) => {
  try {
    const { 
      subCategoryId, 
      categoryId,
      search, 
      qtyMin, 
      qtyMax, 
      page = 1, 
      limit = 20 
    } = req.query;

    let query = {};

    // Filter by subcategory
    if (subCategoryId) {
      query.subCategoryId = subCategoryId;
    }

    // Filter by category (get all products in subcategories of this category)
    if (categoryId && !subCategoryId) {
      const subCategories = await SubCategory.find({ categoryId });
      const subCategoryIds = subCategories.map(sc => sc._id);
      query.subCategoryId = { $in: subCategoryIds };
    }

    // Search by name
    if (search) {
      query.name = { $regex: search, $options: 'i' };
    }

    // Quantity filter
    if (qtyMin !== undefined || qtyMax !== undefined) {
      query.qty = {};
      if (qtyMin !== undefined) {
        query.qty.$gte = Number(qtyMin);
      }
      if (qtyMax !== undefined) {
        query.qty.$lte = Number(qtyMax);
      }
    }

    const skip = (Number(page) - 1) * Number(limit);

    const [products, total] = await Promise.all([
      Product.find(query)
        .populate({
          path: 'subCategoryId',
          select: 'name categoryId',
          populate: {
            path: 'categoryId',
            select: 'name'
          }
        })
        .sort({ updatedAt: -1 })
        .skip(skip)
        .limit(Number(limit)),
      Product.countDocuments(query)
    ]);

    res.json({
      products,
      pagination: {
        page: Number(page),
        limit: Number(limit),
        total,
        pages: Math.ceil(total / Number(limit))
      }
    });
  } catch (error) {
    console.error('Get products error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   GET /api/products/search
// @desc    Search products across all categories (for global search)
// @access  Private
router.get('/search', protect, async (req, res) => {
  try {
    const { search, qtyMin, qtyMax, page = 1, limit = 20 } = req.query;

    let query = {};

    if (search) {
      query.name = { $regex: search, $options: 'i' };
    }

    if (qtyMin !== undefined || qtyMax !== undefined) {
      query.qty = {};
      if (qtyMin !== undefined) {
        query.qty.$gte = Number(qtyMin);
      }
      if (qtyMax !== undefined) {
        query.qty.$lte = Number(qtyMax);
      }
    }

    const skip = (Number(page) - 1) * Number(limit);

    const [products, total] = await Promise.all([
      Product.find(query)
        .populate({
          path: 'subCategoryId',
          select: 'name categoryId',
          populate: {
            path: 'categoryId',
            select: 'name'
          }
        })
        .sort({ updatedAt: -1 })
        .skip(skip)
        .limit(Number(limit)),
      Product.countDocuments(query)
    ]);

    res.json({
      products,
      pagination: {
        page: Number(page),
        limit: Number(limit),
        total,
        pages: Math.ceil(total / Number(limit))
      }
    });
  } catch (error) {
    console.error('Search products error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   GET /api/products/:id
// @desc    Get single product
// @access  Private
router.get('/:id', protect, async (req, res) => {
  try {
    const product = await Product.findById(req.params.id)
      .populate({
        path: 'subCategoryId',
        select: 'name categoryId',
        populate: {
          path: 'categoryId',
          select: 'name'
        }
      });

    if (!product) {
      return res.status(404).json({ message: 'Product not found' });
    }

    res.json(product);
  } catch (error) {
    console.error('Get product error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   POST /api/products
// @desc    Create product
// @access  Private
router.post('/', protect, [
  body('name').trim().notEmpty().withMessage('Product name is required')
    .isLength({ max: 200 }).withMessage('Product name cannot exceed 200 characters'),
  body('subCategoryId').notEmpty().withMessage('SubCategory ID is required'),
  body('qty').isNumeric().withMessage('Quantity must be a number')
    .custom(val => val >= 0).withMessage('Quantity cannot be negative'),
  body('price').isNumeric().withMessage('Price must be a number')
    .custom(val => val >= 0).withMessage('Price cannot be negative'),
  body('billing').isNumeric().withMessage('Billing must be a number')
    .custom(val => val >= 0).withMessage('Billing cannot be negative')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { name, subCategoryId, qty, price, billing, image, sampleLocation, ghodaLocation } = req.body;

    // Verify subcategory exists
    const subCategory = await SubCategory.findById(subCategoryId);
    if (!subCategory) {
      return res.status(400).json({ message: 'SubCategory not found' });
    }

    const product = await Product.create({
      name,
      subCategoryId,
      qty: Number(qty),
      price: Number(price),
      billing: Number(billing),
      image: image || '',
      sampleLocation: sampleLocation || '',
      ghodaLocation: ghodaLocation || ''
    });

    // Populate and return
    const populatedProduct = await Product.findById(product._id)
      .populate({
        path: 'subCategoryId',
        select: 'name categoryId',
        populate: {
          path: 'categoryId',
          select: 'name'
        }
      });

    res.status(201).json(populatedProduct);
  } catch (error) {
    console.error('Create product error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   PUT /api/products/:id
// @desc    Update product
// @access  Private
router.put('/:id', protect, [
  body('name').optional().trim().notEmpty().withMessage('Product name cannot be empty')
    .isLength({ max: 200 }).withMessage('Product name cannot exceed 200 characters'),
  body('qty').optional().isNumeric().withMessage('Quantity must be a number')
    .custom(val => val >= 0).withMessage('Quantity cannot be negative'),
  body('price').optional().isNumeric().withMessage('Price must be a number')
    .custom(val => val >= 0).withMessage('Price cannot be negative'),
  body('billing').optional().isNumeric().withMessage('Billing must be a number')
    .custom(val => val >= 0).withMessage('Billing cannot be negative')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const product = await Product.findById(req.params.id);

    if (!product) {
      return res.status(404).json({ message: 'Product not found' });
    }

    const { name, qty, price, billing, image, sampleLocation, ghodaLocation } = req.body;

    const updateData = {};
    if (name !== undefined) updateData.name = name;
    if (qty !== undefined) updateData.qty = Number(qty);
    if (price !== undefined) updateData.price = Number(price);
    if (billing !== undefined) updateData.billing = Number(billing);
    if (image !== undefined) updateData.image = image;
    if (sampleLocation !== undefined) updateData.sampleLocation = sampleLocation;
    if (ghodaLocation !== undefined) updateData.ghodaLocation = ghodaLocation;

    const updatedProduct = await Product.findByIdAndUpdate(
      req.params.id,
      updateData,
      { new: true, runValidators: true }
    ).populate({
      path: 'subCategoryId',
      select: 'name categoryId',
      populate: {
        path: 'categoryId',
        select: 'name'
      }
    });

    res.json(updatedProduct);
  } catch (error) {
    console.error('Update product error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   DELETE /api/products/:id
// @desc    Delete product
// @access  Private
router.delete('/:id', protect, async (req, res) => {
  try {
    const product = await Product.findById(req.params.id);

    if (!product) {
      return res.status(404).json({ message: 'Product not found' });
    }

    await Product.findByIdAndDelete(req.params.id);

    res.json({ message: 'Product deleted' });
  } catch (error) {
    console.error('Delete product error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router;
