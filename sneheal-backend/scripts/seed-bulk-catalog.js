/**
 * Bulk-seeds ~5000 catalog products for load testing.
 * Keeps categories; replaces products; marks only a small featured set.
 *
 * Usage: node scripts/seed-bulk-catalog.js [count]
 * Example: node scripts/seed-bulk-catalog.js 5000
 */
require('dotenv').config();

const mysql = require('mysql2/promise');

const TARGET = Math.max(100, Number(process.argv[2]) || 5000);
const BATCH_SIZE = 200;
const FEATURED_COUNT = 16;

const HIGHLIGHTS = JSON.stringify([
  { icon: 'shield-checkmark-outline', label: '100% Genuine' },
  { icon: 'flash-outline', label: 'Fast Delivery' },
  { icon: 'sync-outline', label: 'Easy Returns' },
]);

const FORMS = [
  { form: 'tablet', unit: (n) => `${n} tablets` },
  { form: 'capsule', unit: (n) => `${n} capsules` },
  { form: 'syrup', unit: () => '100 ml' },
  { form: 'syrup', unit: () => '60 ml' },
  { form: 'injection', unit: () => '1 vial' },
  { form: 'cream', unit: () => '20 g' },
  { form: 'ointment', unit: () => '15 g' },
  { form: 'drops', unit: () => '10 ml' },
  { form: 'powder', unit: () => '200 g' },
  { form: 'sachet', unit: (n) => `${n} sachets` },
];

const STRENGTHS = [
  '250 mg',
  '500 mg',
  '650 mg',
  '10 mg',
  '20 mg',
  '40 mg',
  '5 mg',
  '100 mg',
  '200 mg',
  '1 g',
  '125 mg/5 ml',
  '250 mg/5 ml',
  null,
];

const MANUFACTURERS = [
  'Sun Pharma',
  'Cipla',
  'Dr Reddy\'s',
  'Lupin',
  'Aurobindo Pharma',
  'Torrent Pharma',
  'Alkem Labs',
  'Zydus Cadila',
  'Glenmark',
  'Mankind Pharma',
  'Intas Pharmaceuticals',
  'Abbott India',
  'Pfizer India',
  'Sanofi India',
  'GSK India',
  'MediCure Pharma',
  'Sneheal Medtech Pvt. Ltd.',
  'NutriCare Labs',
  'Vedic Roots Ayurveda',
  'FitLife Nutrition',
];

const GENERICS = [
  'Paracetamol',
  'Ibuprofen',
  'Amoxicillin',
  'Azithromycin',
  'Cetirizine',
  'Loratadine',
  'Omeprazole',
  'Pantoprazole',
  'Metformin',
  'Amlodipine',
  'Atorvastatin',
  'Losartan',
  'Telmisartan',
  'Diclofenac',
  'Aceclofenac',
  'Domperidone',
  'Ondansetron',
  'Montelukast',
  'Levocetirizine',
  'Vitamin D3',
  'Vitamin B12',
  'Calcium Carbonate',
  'Iron Folic Acid',
  'ORS',
  'Ranitidine',
  'Ciprofloxacin',
  'Ofloxacin',
  'Metronidazole',
  'Doxycycline',
  'Prednisolone',
  'Salbutamol',
  'Budesonide',
  'Insulin Glargine',
  'Glimepiride',
  'Sitagliptin',
  'Clopidogrel',
  'Aspirin',
  'Tramadol',
  'Gabapentin',
  'Pregabalin',
  'Sertraline',
  'Escitalopram',
  'Multivitamin',
  'Biotin',
  'Ashwagandha',
  'Giloy',
  'Curcumin',
  'Protein Supplement',
  'Probiotic',
  'Antacid',
];

const BRAND_PREFIXES = [
  'Crocin',
  'Dolo',
  'Calpol',
  'Augmentin',
  'Azithral',
  'Allegra',
  'Pan',
  'Omez',
  'Glycomet',
  'Amlong',
  'Atorva',
  'Telma',
  'Voveran',
  'Zerodol',
  'Domstal',
  'Emeset',
  'Montair',
  'Xyzal',
  'Uprise',
  'Neurobion',
  'Shelcal',
  'Autrin',
  'Electral',
  'Zinetac',
  'Cifran',
  'Oflox',
  'Flagyl',
  'Doxy',
  'Wysolone',
  'Asthalin',
  'Budecort',
  'Lantus',
  'Amaryl',
  'Januvia',
  'Clopitab',
  'Ecosprin',
  'Ultracet',
  'Gabapin',
  'Pregaba',
  'Serlift',
  'Nexito',
  'Becosules',
  'Himalaya',
  'Dabur',
  'Revital',
  'Protinex',
  'Enterogermina',
  'Digene',
  'MediCure',
  'Sneheal',
];

const USES_POOL = [
  'Relieves pain and fever',
  'Reduces inflammation',
  'Treats bacterial infections',
  'Relieves allergy symptoms',
  'Controls acid reflux',
  'Helps manage blood sugar',
  'Supports heart health',
  'Relieves cold and congestion',
  'Boosts immunity',
  'Supports bone health',
  'Improves energy levels',
  'Aids digestion',
  'Supports respiratory health',
  'Promotes healthy skin and hair',
  'Helps muscle recovery',
];

const CATEGORY_SEED = [
  ['Skin Care', 'skin-care', 1],
  ['Sexual Wellness', 'sexual-wellness', 2],
  ['Oral Care', 'oral-care', 3],
  ['Hair Care', 'hair-care', 4],
  ['Feminine Hygiene', 'feminine-hygiene', 5],
  ['Diaper & Wipes', 'diaper-wipes', 6],
  ['Feeding Essentials', 'feeding-essentials', 7],
  ['Baby Skin & Bath', 'baby-skin-bath', 8],
  ['Fitness Essentials', 'fitness-essentials', 9],
  ['Vitamins & Minerals', 'vitamins-minerals', 10],
  ['Nutritional Drinks', 'nutritional-drinks', 11],
  ['Ayurveda Essentials', 'ayurveda-essentials', 12],
  ['Health Devices', 'health-devices', 13],
  ['Home Essentials', 'home-essentials', 14],
  ['Pain Relief', 'pain-relief', 15],
  ['Fever & Cold', 'fever-cold', 16],
];

const pick = (arr, i) => arr[i % arr.length];

const round2 = (n) => Math.round(n * 100) / 100;

async function ensureCategories(connection) {
  const [rows] = await connection.query('SELECT COUNT(*) AS c FROM categories');
  if (Number(rows[0].c) > 0) {
    const [existing] = await connection.query('SELECT id FROM categories ORDER BY id');
    return existing.map((r) => r.id);
  }

  for (const [name, slug, sortOrder] of CATEGORY_SEED) {
    await connection.execute(
      `INSERT INTO categories (name, slug, image_url, offer_label, sort_order, is_active)
       VALUES (?, ?, NULL, NULL, ?, 1)`,
      [name, slug, sortOrder],
    );
  }

  const [created] = await connection.query('SELECT id FROM categories ORDER BY id');
  return created.map((r) => r.id);
}

function buildProduct(i, categoryIds) {
  const formInfo = pick(FORMS, i);
  const packQty = [10, 15, 20, 30, 60, 90][i % 6];
  const generic = pick(GENERICS, i);
  const brand = `${pick(BRAND_PREFIXES, i)} ${pick(['Plus', 'DS', 'Forte', 'XR', 'OD', ''], i + 3)}`.trim();
  const manufacturer = pick(MANUFACTURERS, i + 1);
  const strength = pick(STRENGTHS, i);
  const name = `${brand} ${generic}${strength ? ` ${strength}` : ''}`.replace(/\s+/g, ' ').trim();
  const price = round2(29 + ((i * 17) % 970) + (i % 7) * 0.25);
  const hasMrp = i % 3 !== 0;
  const originalPrice = hasMrp ? round2(price * (1.1 + (i % 5) * 0.05)) : null;
  const rating = round2(3.5 + (i % 15) * 0.1);
  const reviews = 20 + ((i * 13) % 5000);
  const uses = [
    pick(USES_POOL, i),
    pick(USES_POOL, i + 4),
    pick(USES_POOL, i + 8),
  ];
  const description = `${name} from ${manufacturer}. Used for ${uses[0].toLowerCase()} and related conditions. Pack size: ${formInfo.unit(packQty)}.`;

  return [
    name.slice(0, 250),
    manufacturer,
    brand.slice(0, 240),
    generic,
    strength,
    formInfo.form,
    null, // image_url
    price,
    originalPrice,
    formInfo.unit(packQty),
    Math.min(rating, 5),
    reviews,
    JSON.stringify(uses),
    description,
    HIGHLIGHTS,
    categoryIds[i % categoryIds.length],
    i % 17 === 0 ? 1 : 0, // prescription_required
    0, // is_featured (set later)
    1,
  ];
}

async function insertBatch(connection, rows) {
  const placeholders = rows
    .map(() => '(?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)')
    .join(',');

  const sql = `
    INSERT INTO products (
      name, manufacturer, brand_name, generic_name, strength, form,
      image_url, price, original_price, unit, rating, reviews,
      uses, description, highlights, category_id,
      prescription_required, is_featured, is_active
    ) VALUES ${placeholders}
  `;

  await connection.query(sql, rows.flat());
}

async function seed() {
  const connection = await mysql.createConnection({
    host: process.env.DB_HOST || 'localhost',
    port: Number(process.env.DB_PORT) || 3306,
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || '',
    database: process.env.DB_NAME || 'sneheal',
    multipleStatements: true,
  });

  const started = Date.now();

  try {
    console.log(`Seeding ${TARGET} products into ${process.env.DB_NAME || 'sneheal'}...`);

    const categoryIds = await ensureCategories(connection);
    console.log(`Categories ready: ${categoryIds.length}`);

    await connection.query('SET FOREIGN_KEY_CHECKS = 0');
    await connection.query('TRUNCATE TABLE products');
    await connection.query('SET FOREIGN_KEY_CHECKS = 1');

    for (let offset = 0; offset < TARGET; offset += BATCH_SIZE) {
      const count = Math.min(BATCH_SIZE, TARGET - offset);
      const batch = [];
      for (let i = 0; i < count; i += 1) {
        batch.push(buildProduct(offset + i, categoryIds));
      }
      await insertBatch(connection, batch);
      process.stdout.write(`\rInserted ${Math.min(offset + count, TARGET)} / ${TARGET}`);
    }
    process.stdout.write('\n');

    // Keep Home light: only FEATURED_COUNT products featured.
    await connection.query('UPDATE products SET is_featured = 0');
    await connection.query(
      `UPDATE products SET is_featured = 1
       WHERE id IN (
         SELECT id FROM (
           SELECT id FROM products ORDER BY rating DESC, id ASC LIMIT ?
         ) t
       )`,
      [FEATURED_COUNT],
    );

    const [[products]] = await connection.query('SELECT COUNT(*) AS c FROM products');
    const [[featured]] = await connection.query(
      'SELECT COUNT(*) AS c FROM products WHERE is_featured = 1',
    );

    console.log(
      `Done in ${((Date.now() - started) / 1000).toFixed(1)}s — products=${products.c}, featured=${featured.c}`,
    );
  } finally {
    await connection.end();
  }
}

seed().catch((err) => {
  console.error('Bulk seed failed:', err.message);
  process.exit(1);
});
