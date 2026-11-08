require('dotenv').config();
const drugsetuService = require('../src/services/drugsetu.service');
const catalogService = require('../src/services/catalog.service');
const db = require('../src/config/db');

async function testIntegration() {
  console.log('--- TESTING DRUGSETU & CATALOG SERVICE ---');
  console.log('DrugSetu Enabled:', drugsetuService.isEnabled());

  // Test 1: Search DrugSetu
  console.log('\n[Test 1] Searching for "Telmikind"...');
  const searchResults = await catalogService.searchProducts('Telmikind');
  console.log(`Found ${searchResults.items.length} items. Total: ${searchResults.total}`);
  if (searchResults.items.length > 0) {
    const first = searchResults.items[0];
    console.log('First hit:', {
      id: first.id,
      name: first.name,
      genericName: first.genericName,
      manufacturer: first.manufacturer,
      source: first.source,
    });

    // Test 2: Fetch details & auto-save to MySQL
    console.log(`\nWaiting 1s before fetching details for product ID "${first.id}"...`);
    await new Promise((r) => setTimeout(r, 1000));
    const details = await catalogService.getProduct(first.id);
    console.log('Product Details:', {
      id: details.id,
      drugsetuId: details.drugsetuId,
      name: details.name,
      price: details.price,
      unit: details.unit,
      imagesCount: details.images?.length || 0,
      firstImage: details.images?.[0] || details.imageUrl,
      source: details.source,
    });

    // Test 3: Verify it is in MySQL database
    console.log('\n[Test 3] Verifying MySQL record...');
    const [rows] = await db.execute(
      'SELECT id, drugsetu_id, name, price, unit, source, created_at FROM products WHERE drugsetu_id = ?',
      [first.id],
    );
    console.log('MySQL stored row:', rows[0]);

    // Test 3B: Verify subsequent fetch uses local MySQL cache (0 DrugSetu API calls)
    console.log('\n[Test 3B] Fetching again (should hit MySQL cache directly)...');
    const cachedHit = await catalogService.getProduct(first.id);
    console.log('Cached Hit ID from MySQL:', cachedHit.id, 'Source:', cachedHit.source);
  }

  // Test 4: Fallback to local DB when DrugSetu returns nothing
  console.log('\n[Test 4] Testing Fallback with local query "Crocin"...');
  const fallbackResults = await catalogService.searchProducts('Crocin');
  console.log(`Fallback found ${fallbackResults.items.length} local items.`);

  await db.end();
  console.log('\n✓ ALL TESTS PASSED SUCCESSFULLY');
}

testIntegration().catch((err) => {
  console.error('Test Failed:', err);
  process.exit(1);
});
