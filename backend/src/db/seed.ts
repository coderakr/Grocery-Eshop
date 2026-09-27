import { eq, sql } from 'drizzle-orm';
import { hash } from 'bcryptjs';
import { db } from './index.js';
import { categories, products, users } from './schema.js';
import { env } from '../config/env.js';
import { slugify } from '../utils/slug.js';

interface SeedProduct {
  name: string;
  price: number;
  compareAtPrice?: number;
  unit: string;
  stock: number;
  isFeatured?: boolean;
  category: string;
  description: string;
}

const seedCategories = [
  { name: 'Fruits', emoji: '🍎' },
  { name: 'Vegetables', emoji: '🥦' },
  { name: 'Dairy & Eggs', emoji: '🥛' },
  { name: 'Bakery', emoji: '🍞' },
  { name: 'Beverages', emoji: '🧃' },
  { name: 'Snacks', emoji: '🍿' },
  { name: 'Meat & Seafood', emoji: '🍗' },
  { name: 'Pantry', emoji: '🫙' },
];

const seedProducts: SeedProduct[] = [
  { name: 'Organic Red Apples', price: 4.99, compareAtPrice: 6.49, unit: '1 kg', stock: 45, isFeatured: true, category: 'Fruits', description: 'Crisp, sweet organic apples picked from local orchards.' },
  { name: 'Sun-Ripened Bananas', price: 2.49, unit: '1 dozen', stock: 80, isFeatured: true, category: 'Fruits', description: 'Naturally ripened bananas, perfect for smoothies and snacking.' },
  { name: 'Fresh Strawberries', price: 5.99, compareAtPrice: 7.99, unit: '500 g', stock: 30, category: 'Fruits', description: 'Juicy hand-picked strawberries packed with vitamin C.' },
  { name: 'Sweet Seedless Grapes', price: 6.25, unit: '1 kg', stock: 25, category: 'Fruits', description: 'Plump seedless grapes with a refreshing crunch.' },
  { name: 'Broccoli Crowns', price: 3.19, unit: 'each', stock: 40, isFeatured: true, category: 'Vegetables', description: 'Farm-fresh broccoli crowns, great for steaming and stir-fries.' },
  { name: 'Vine Tomatoes', price: 3.99, unit: '500 g', stock: 55, category: 'Vegetables', description: 'Deep-red vine tomatoes with rich, sweet flavour.' },
  { name: 'Baby Spinach', price: 4.49, unit: '250 g', stock: 20, category: 'Vegetables', description: 'Tender baby spinach leaves, triple-washed and ready to eat.' },
  { name: 'Organic Carrots', price: 2.29, unit: '1 kg', stock: 60, isFeatured: true, category: 'Vegetables', description: 'Sweet organic carrots, ideal for roasting and soups.' },
  { name: 'Whole Milk', price: 3.49, unit: '2 L', stock: 70, isFeatured: true, category: 'Dairy & Eggs', description: 'Creamy full-fat milk from grass-fed herds.' },
  { name: 'Free-Range Eggs', price: 5.49, compareAtPrice: 6.29, unit: '12 eggs', stock: 48, isFeatured: true, category: 'Dairy & Eggs', description: 'Large free-range eggs with golden yolks.' },
  { name: 'Sharp Cheddar Block', price: 7.99, unit: '400 g', stock: 35, category: 'Dairy & Eggs', description: 'Aged cheddar with a bold, tangy finish.' },
  { name: 'Greek Yogurt', price: 4.79, unit: '500 g', stock: 42, category: 'Dairy & Eggs', description: 'Thick, high-protein Greek yogurt with no added sugar.' },
  { name: 'Sourdough Loaf', price: 6.49, unit: 'each', stock: 22, isFeatured: true, category: 'Bakery', description: 'Slow-fermented sourdough with a crackling crust.' },
  { name: 'Whole Wheat Bagels', price: 4.29, unit: '6 pack', stock: 28, category: 'Bakery', description: 'Chewy whole wheat bagels, perfect toasted.' },
  { name: 'Butter Croissants', price: 5.99, unit: '4 pack', stock: 18, category: 'Bakery', description: 'Flaky all-butter croissants baked fresh daily.' },
  { name: 'Cold-Pressed Orange Juice', price: 6.99, compareAtPrice: 8.49, unit: '1 L', stock: 33, isFeatured: true, category: 'Beverages', description: '100% cold-pressed juice with no added sugar.' },
  { name: 'Sparkling Mineral Water', price: 4.49, unit: '6 x 500 ml', stock: 90, category: 'Beverages', description: 'Naturally carbonated mineral water in glass bottles.' },
  { name: 'Fair-Trade Coffee Beans', price: 12.99, unit: '500 g', stock: 26, isFeatured: true, category: 'Beverages', description: 'Medium-roast arabica beans with chocolate notes.' },
  { name: 'Sea Salt Kettle Chips', price: 3.79, unit: '150 g', stock: 64, category: 'Snacks', description: 'Hand-cooked kettle chips with flaky sea salt.' },
  { name: 'Dark Chocolate 70%', price: 4.99, unit: '100 g', stock: 50, category: 'Snacks', description: 'Rich single-origin dark chocolate, 70% cocoa.' },
  { name: 'Roasted Mixed Nuts', price: 8.49, unit: '300 g', stock: 38, category: 'Snacks', description: 'Dry-roasted almonds, cashews and walnuts.' },
  { name: 'Chicken Breast Fillets', price: 11.49, compareAtPrice: 13.99, unit: '1 kg', stock: 24, isFeatured: true, category: 'Meat & Seafood', description: 'Antibiotic-free chicken breast, skinless and boneless.' },
  { name: 'Atlantic Salmon Fillets', price: 15.99, unit: '500 g', stock: 15, category: 'Meat & Seafood', description: 'Fresh Atlantic salmon, rich in omega-3.' },
  { name: 'Lean Beef Mince', price: 9.99, unit: '500 g', stock: 20, category: 'Meat & Seafood', description: '90% lean grass-fed beef mince.' },
  { name: 'Extra Virgin Olive Oil', price: 13.99, compareAtPrice: 16.49, unit: '750 ml', stock: 32, isFeatured: true, category: 'Pantry', description: 'Cold-extracted extra virgin olive oil.' },
  { name: 'Jasmine Rice', price: 7.49, unit: '2 kg', stock: 47, category: 'Pantry', description: 'Fragrant long-grain jasmine rice.' },
  { name: 'Raw Wildflower Honey', price: 9.49, unit: '500 g', stock: 29, category: 'Pantry', description: 'Unfiltered raw honey from wildflower meadows.' },
  { name: 'Whole Wheat Pasta', price: 3.29, unit: '500 g', stock: 58, category: 'Pantry', description: 'Bronze-cut whole wheat penne with a firm bite.' },
];

async function seed() {
  console.log('🌱 Seeding database...');

  const passwordHash = await hash(env.ADMIN_PASSWORD, 10);
  const [existingAdmin] = await db
    .select({ id: users.id })
    .from(users)
    .where(eq(users.email, env.ADMIN_EMAIL.toLowerCase()))
    .limit(1);

  if (existingAdmin) {
    await db
      .update(users)
      .set({ name: env.ADMIN_NAME, passwordHash, role: 'admin' })
      .where(eq(users.id, existingAdmin.id));
    console.log(`👤 Admin updated: ${env.ADMIN_EMAIL}`);
  } else {
    await db.insert(users).values({
      name: env.ADMIN_NAME,
      email: env.ADMIN_EMAIL.toLowerCase(),
      passwordHash,
      role: 'admin',
    });
    console.log(`👤 Admin created: ${env.ADMIN_EMAIL}`);
  }

  const [categoryCount] = await db
    .select({ count: sql<number>`count(*)::int` })
    .from(categories);

  if ((categoryCount?.count ?? 0) === 0) {
    await db.insert(categories).values(
      seedCategories.map((category) => ({
        name: category.name,
        slug: slugify(category.name),
        description: `Fresh ${category.name.toLowerCase()} delivered to your door.`,
        imageUrl: `https://placehold.co/600x400/16a34a/ffffff?text=${encodeURIComponent(category.emoji)}`,
      })),
    );
    console.log(`📦 Inserted ${seedCategories.length} categories`);
  } else {
    console.log('📦 Categories already present, skipping');
  }

  const allCategories = await db
    .select({ id: categories.id, name: categories.name })
    .from(categories);
  const categoryByName = new Map(allCategories.map((c) => [c.name, c.id]));

  const [productCount] = await db
    .select({ count: sql<number>`count(*)::int` })
    .from(products);

  if ((productCount?.count ?? 0) === 0) {
    await db.insert(products).values(
      seedProducts.map((product) => ({
        name: product.name,
        slug: slugify(product.name),
        description: product.description,
        price: product.price.toFixed(2),
        compareAtPrice: product.compareAtPrice?.toFixed(2) ?? null,
        unit: product.unit,
        stock: product.stock,
        isFeatured: product.isFeatured ?? false,
        imageUrl: `https://placehold.co/600x400/f59e0b/ffffff?text=${encodeURIComponent(
          product.name.split(' ').slice(0, 2).join(' '),
        )}`,
        categoryId: categoryByName.get(product.category) ?? null,
      })),
    );
    console.log(`🥕 Inserted ${seedProducts.length} products`);
  } else {
    console.log('🥕 Products already present, skipping');
  }

  console.log('✅ Seeding complete');
  process.exit(0);
}

seed().catch((error) => {
  console.error('❌ Seed failed:', error);
  process.exit(1);
});
