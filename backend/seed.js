require('dotenv').config();
const mongoose = require('mongoose');
const User = require('./models/User');
const Category = require('./models/Category');
const SubCategory = require('./models/SubCategory');
const Product = require('./models/Product');

const connectDB = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });
    console.log('MongoDB Connected');
  } catch (error) {
    console.error('MongoDB Connection Error:', error);
    process.exit(1);
  }
};

const seedData = async () => {
  try {
    await connectDB();

    // Clear existing data
    await User.deleteMany({});
    await Category.deleteMany({});
    await SubCategory.deleteMany({});
    await Product.deleteMany({});

    console.log('Cleared existing data');

    // Create admin user
    const adminUser = await User.create({
      username: 'admin',
      password: 'admin123'
    });
    console.log('Created admin user: admin / admin123');

    // Create sample categories
    const categories = await Category.insertMany([
      { name: 'Teak' },
      { name: 'Rosewood' },
      { name: 'Oak' },
      { name: 'Walnut' },
      { name: 'Maple' }
    ]);
    console.log(`Created ${categories.length} categories`);

    // Create sample subcategories
    const subCategories = await SubCategory.insertMany([
      // Teak subcategories
      { name: 'Teak Quarter', categoryId: categories[0]._id },
      { name: 'Teak Crown', categoryId: categories[0]._id },
      { name: 'Teak Burr', categoryId: categories[0]._id },
      // Rosewood subcategories
      { name: 'Rosewood Quarter', categoryId: categories[1]._id },
      { name: 'Rosewood Crown', categoryId: categories[1]._id },
      // Oak subcategories
      { name: 'Oak Quarter', categoryId: categories[2]._id },
      { name: 'Oak Crown', categoryId: categories[2]._id },
      { name: 'Oak Figured', categoryId: categories[2]._id },
      // Walnut subcategories
      { name: 'Walnut Quarter', categoryId: categories[3]._id },
      { name: 'Walnut Crown', categoryId: categories[3]._id },
      // Maple subcategories
      { name: 'Maple Quarter', categoryId: categories[4]._id },
      { name: 'Maple Birdseye', categoryId: categories[4]._id }
    ]);
    console.log(`Created ${subCategories.length} subcategories`);

    // Create sample products
    const sampleProducts = [
      // Teak Quarter products
      { name: 'TQ-001 Premium', subCategoryId: subCategories[0]._id, qty: 50, price: 150, billing: 100, sampleLocation: 'A1', ghodaLocation: 'G1' },
      { name: 'TQ-002 Standard', subCategoryId: subCategories[0]._id, qty: 25, price: 120, billing: 80, sampleLocation: 'A2', ghodaLocation: 'G1' },
      { name: 'TQ-003 Economy', subCategoryId: subCategories[0]._id, qty: 75, price: 90, billing: 60, sampleLocation: 'A3', ghodaLocation: 'G2' },
      // Teak Crown products
      { name: 'TC-001 Premium', subCategoryId: subCategories[1]._id, qty: 30, price: 180, billing: 120, sampleLocation: 'B1', ghodaLocation: 'G2' },
      { name: 'TC-002 Standard', subCategoryId: subCategories[1]._id, qty: 15, price: 140, billing: 90, sampleLocation: 'B2', ghodaLocation: 'G3' },
      // Teak Burr products
      { name: 'TB-001 Exotic', subCategoryId: subCategories[2]._id, qty: 8, price: 350, billing: 200, sampleLocation: 'C1', ghodaLocation: 'G3' },
      // Rosewood Quarter products
      { name: 'RQ-001 Premium', subCategoryId: subCategories[3]._id, qty: 20, price: 250, billing: 150, sampleLocation: 'D1', ghodaLocation: 'G4' },
      { name: 'RQ-002 Standard', subCategoryId: subCategories[3]._id, qty: 45, price: 200, billing: 120, sampleLocation: 'D2', ghodaLocation: 'G4' },
      // Rosewood Crown products
      { name: 'RC-001 Premium', subCategoryId: subCategories[4]._id, qty: 12, price: 280, billing: 180, sampleLocation: 'E1', ghodaLocation: 'G5' },
      // Oak Quarter products
      { name: 'OQ-001 Select', subCategoryId: subCategories[5]._id, qty: 60, price: 100, billing: 70, sampleLocation: 'F1', ghodaLocation: 'G5' },
      { name: 'OQ-002 Standard', subCategoryId: subCategories[5]._id, qty: 100, price: 80, billing: 55, sampleLocation: 'F2', ghodaLocation: 'G6' },
      // Oak Crown products
      { name: 'OC-001 Premium', subCategoryId: subCategories[6]._id, qty: 35, price: 120, billing: 85, sampleLocation: 'G1', ghodaLocation: 'G6' },
      // Oak Figured products
      { name: 'OF-001 Exotic', subCategoryId: subCategories[7]._id, qty: 5, price: 300, billing: 180, sampleLocation: 'H1', ghodaLocation: 'G7' },
      // Walnut Quarter products
      { name: 'WQ-001 Premium', subCategoryId: subCategories[8]._id, qty: 40, price: 160, billing: 100, sampleLocation: 'I1', ghodaLocation: 'G7' },
      { name: 'WQ-002 Standard', subCategoryId: subCategories[8]._id, qty: 55, price: 130, billing: 85, sampleLocation: 'I2', ghodaLocation: 'G8' },
      // Walnut Crown products
      { name: 'WC-001 Select', subCategoryId: subCategories[9]._id, qty: 22, price: 190, billing: 120, sampleLocation: 'J1', ghodaLocation: 'G8' },
      // Maple Quarter products
      { name: 'MQ-001 Premium', subCategoryId: subCategories[10]._id, qty: 70, price: 110, billing: 75, sampleLocation: 'K1', ghodaLocation: 'G9' },
      // Maple Birdseye products
      { name: 'MB-001 Exotic', subCategoryId: subCategories[11]._id, qty: 3, price: 400, billing: 250, sampleLocation: 'L1', ghodaLocation: 'G9' },
      { name: 'MB-002 Select', subCategoryId: subCategories[11]._id, qty: 10, price: 320, billing: 200, sampleLocation: 'L2', ghodaLocation: 'G10' }
    ];

    const products = await Product.insertMany(sampleProducts);
    console.log(`Created ${products.length} products`);

    console.log('\n=== Seed completed successfully! ===');
    console.log('Login credentials: admin / admin123');
    
    process.exit(0);
  } catch (error) {
    console.error('Seed error:', error);
    process.exit(1);
  }
};

seedData();
