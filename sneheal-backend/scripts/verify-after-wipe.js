/**
 * Post-wipe smoke test: catalog + a throwaway customer checkout path.
 * Cleans the throwaway user data afterwards so the DB stays empty.
 */
require('dotenv').config();
const db = require('../src/config/db');
const userRepo = require('../src/repositories/user.repository');
const registrationService = require('../src/services/registration.service');
const addressService = require('../src/services/address.service');
const catalogService = require('../src/services/catalog.service');
const orderService = require('../src/services/order.service');
const orderRepo = require('../src/repositories/order.repository');
const paymentRepo = require('../src/repositories/payment.repository');
const prescriptionRepo = require('../src/repositories/prescription.repository');

const USER_TABLES = [
  'payments',
  'payment_webhook_events',
  'order_items',
  'orders',
  'prescriptions',
  'user_addresses',
  'doctor_profiles',
  'delivery_agent_profiles',
  'refresh_tokens',
  'otp_verifications',
  'users',
];

const assert = (ok, message) => {
  if (!ok) throw new Error(message);
};

(async () => {
  const categories = await catalogService.listCategories();
  assert(categories.length === 16, `expected 16 categories, got ${categories.length}`);

  const products = await catalogService.listProducts({ limit: 5 });
  assert(products.total === 5000, `expected 5000 products, got ${products.total}`);
  assert(products.items.length > 0, 'product list empty');

  const featured = await catalogService.listProducts({ featured: true, limit: 5 });
  assert(featured.items.length > 0, 'featured products empty');

  const search = await catalogService.searchProducts('paracetamol', { limit: 5 });
  assert(search.total > 0, 'search returned no matches');

  const detail = await catalogService.getProduct(products.items[0].id);
  assert(detail && detail.name, 'product detail missing');

  const similar = await catalogService.getSimilarProducts(detail.id, { limit: 6 });
  assert(Array.isArray(similar.items) || Array.isArray(similar), 'similar products failed');

  const emptyOrders = await orderService.listOrders(1);
  assert(Array.isArray(emptyOrders) && emptyOrders.length === 0, 'stale orders remain');

  const emptyAddresses = await addressService.listAddresses(1);
  assert(Array.isArray(emptyAddresses) && emptyAddresses.length === 0, 'stale addresses remain');

  const emptyRx = await prescriptionRepo.findByUserId(1);
  assert(Array.isArray(emptyRx) && emptyRx.length === 0, 'stale prescriptions remain');

  const queue = await orderService.listDeliveryQueue();
  assert(Array.isArray(queue.active) && queue.active.length === 0, 'delivery queue not empty');
  assert(Array.isArray(queue.completed) && queue.completed.length === 0, 'completed queue not empty');

  console.log('catalog + empty lists: OK');

  const user = await userRepo.createByPhone('9000000001');
  const registered = await registrationService.completeRegistration(user.id, {
    username: 'Smoke Test',
    language: 'ENGLISH',
    role: 'customer',
  });
  assert(registered.user.profileCompleted, 'registration did not complete');
  assert(registered.accessToken && registered.refreshToken, 'tokens missing after registration');

  const address = await addressService.createAddress(user.id, {
    addressLine: '12 Test Street, Pune',
    flatNumber: 'A-1',
    landmark: 'Near park',
    receiverName: 'Smoke Test',
    mobile: '9000000001',
    type: 'home',
    latitude: 18.5204,
    longitude: 73.8567,
    isDefault: true,
  });
  assert(address.id, 'address not created');

  const listed = await addressService.listAddresses(user.id);
  assert(listed.length === 1, 'address list mismatch');

  const order = await orderRepo.create({
    publicId: `SNH-SMOKE${Date.now()}`.slice(0, 24),
    userId: user.id,
    addressId: address.id,
    receiverName: address.receiverName,
    mobile: address.mobile,
    addressLine: address.addressLine,
    flatNumber: address.flatNumber,
    landmark: address.landmark ?? '',
    latitude: address.coords.latitude,
    longitude: address.coords.longitude,
    itemMrpPaise: 10000,
    itemSellingPaise: 9000,
    discountPaise: 1000,
    promoPaise: 0,
    handlingPaise: 0,
    deliveryPaise: 0,
    deliveryOriginalPaise: 0,
    gstPaise: 0,
    grandTotalPaise: 9000,
  });
  await orderRepo.insertItems(order.id, [
    {
      productId: detail.id,
      name: detail.name,
      unit: detail.unit,
      imageUrl: detail.imageUrl,
      unitPricePaise: 9000,
      mrpPaise: 10000,
      quantity: 1,
      lineTotalPaise: 9000,
      prescriptionRequired: false,
    },
  ]);
  const payment = await paymentRepo.create({
    orderId: order.id,
    amountPaise: 9000,
  });
  assert(order.id && order.status, 'order not created');
  assert(payment && payment.method === 'cod', 'COD payment missing');

  const orders = await orderService.listOrders(user.id);
  assert(orders.length === 1, 'order list mismatch');

  console.log('new-user checkout path: OK');
  console.log(`  userId=${user.id} addressId=${address.id} orderId=${order.id} status=${order.status}`);

  await db.query('SET FOREIGN_KEY_CHECKS = 0');
  for (const table of USER_TABLES) {
    await db.query('TRUNCATE TABLE ??', [table]);
  }
  await db.query('SET FOREIGN_KEY_CHECKS = 1');

  const [[users]] = await db.query('SELECT COUNT(*) AS c FROM users');
  const [[productCount]] = await db.query('SELECT COUNT(*) AS c FROM products');
  assert(Number(users.c) === 0, 'users not emptied after smoke cleanup');
  assert(Number(productCount.c) === 5000, 'catalog changed during smoke test');

  console.log('smoke data cleaned. catalog still 5000 products. DB ready for a fresh login.');
  await db.end();
})().catch(async (err) => {
  console.error('VERIFY FAILED:', err.message);
  process.exit(1);
});
