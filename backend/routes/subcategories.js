const express = require('express');
const { body, validationResult } = require('express-validator');
const SubCategory = require('../models/SubCategory');
const Product = require('../models/Product');
const { protect } = require('../middleware/auth');

const router = express.Router();

// @route   GET /api/subcategories
// @desc    Get subcategories (optionally by category)
// @access  Private
router.get('/', protect, async (req, res) => {
  try {
    const { categoryId, search } = req.query;
    let query = {};

    if (categoryId) {
      query.categoryId = categoryId;
    }

    if (search) {
      query.name = { $regex: search, $options: 'i' };
    }

    const subCategories = await SubCategory.find(query)
      .populate('categoryId', 'name')
      .populate('productsCount')
      .sort({ name: 1 });

    res.json(subCategories);
  } catch (error) {
    console.error('Get subcategories error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   GET /api/subcategories/:id
// @desc    Get single subcategory
// @access  Private
router.get('/:id', protect, async (req, res) => {
  try {
    const subCategory = await SubCategory.findById(req.params.id)
      .populate('categoryId', 'name')
      .populate('productsCount');

    if (!subCategory) {
      return res.status(404).json({ message: 'SubCategory not found' });
    }

    res.json(subCategory);
  } catch (error) {
    console.error('Get subcategory error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   POST /api/subcategories
// @desc    Create subcategory
// @access  Private
router.post('/', protect, [
  body('name').trim().notEmpty().withMessage('SubCategory name is required')
    .isLength({ max: 100 }).withMessage('SubCategory name cannot exceed 100 characters'),
  body('categoryId').notEmpty().withMessage('Category ID is required')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { name, categoryId } = req.body;

    // Check if subcategory exists in this category
    const existingSubCategory = await SubCategory.findOne({ 
      name: { $regex: new RegExp(`^${name}$`, 'i') },
      categoryId
    });

    if (existingSubCategory) {
      return res.status(400).json({ message: 'SubCategory already exists in this category' });
    }

    const subCategory = await SubCategory.create({ name, categoryId });
    
    // Populate and return
    const populatedSubCategory = await SubCategory.findById(subCategory._id)
      .populate('categoryId', 'name');

    res.status(201).json(populatedSubCategory);
  } catch (error) {
    console.error('Create subcategory error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   PUT /api/subcategories/:id
// @desc    Update subcategory
// @access  Private
router.put('/:id', protect, [
  body('name').trim().notEmpty().withMessage('SubCategory name is required')
    .isLength({ max: 100 }).withMessage('SubCategory name cannot exceed 100 characters')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { name } = req.body;
    
    const subCategory = await SubCategory.findById(req.params.id);
    
    if (!subCategory) {
      return res.status(404).json({ message: 'SubCategory not found' });
    }

    // Check if another subcategory has this name in the same category
    const existingSubCategory = await SubCategory.findOne({ 
      name: { $regex: new RegExp(`^${name}$`, 'i') },
      categoryId: subCategory.categoryId,
      _id: { $ne: req.params.id }
    });

    if (existingSubCategory) {
      return res.status(400).json({ message: 'SubCategory name already exists in this category' });
    }

    const updatedSubCategory = await SubCategory.findByIdAndUpdate(
      req.params.id,
      { name },
      { new: true, runValidators: true }
    ).populate('categoryId', 'name');

    res.json(updatedSubCategory);
  } catch (error) {
    console.error('Update subcategory error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   DELETE /api/subcategories/:id
// @desc    Delete subcategory and all related products
// @access  Private
router.delete('/:id', protect, async (req, res) => {
  try {
    const subCategory = await SubCategory.findById(req.params.id);

    if (!subCategory) {
      return res.status(404).json({ message: 'SubCategory not found' });
    }

    // Delete all products in this subcategory
    await Product.deleteMany({ subCategoryId: req.params.id });

    // Delete subcategory
    await SubCategory.findByIdAndDelete(req.params.id);

    res.json({ message: 'SubCategory and all related products deleted' });
  } catch (error) {
    console.error('Delete subcategory error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router;
