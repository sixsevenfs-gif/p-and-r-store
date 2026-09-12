// Run with node --env-file=.env.local scripts/test-commerce.mjs.
// All fixtures and writes are rolled back in one database transaction.
import { registerHooks } from 'node:module';
import { readFileSync, existsSync } from 'node:fs';
import { pathToFileURL, fileURLToPath } from 'node:url';
import { resolve, dirname } from 'node:path';
import assert from 'node:assert/strict';
import ts from 'typescript';

let cookie = '';
globalThis.__prTestCookies = () => ({ get: name => {
  const value = cookie.split('; ').find(part => part.startsWith(name + '='));
  return value ? { value: value.slice(name.length + 1) } : undefined;
} });
registerHooks({
  resolve(specifier, context, next) {
    if (specifier === 'next/headers') return { url: 'pr-test:headers', shortCircuit: true };
    if (specifier.startsWith('@/') || (specifier.startsWith('.') && context.parentURL?.endsWith('.ts'))) {
      const path = specifier.startsWith('@/') ? resolve(specifier.slice(2)) : resolve(dirname(fileURLToPath(context.parentURL)), specifier);
      for (const candidate of [path, path + '.ts', path + '/index.ts']) {
        if (existsSync(candidate) && candidate.endsWith('.ts')) return { url: pathToFileURL(candidate).href, shortCircuit: true };
      }
    }
    return next(specifier, context);
  },
  load(url, context, next) {
    if (url === 'pr-test:headers') return { format: 'module', source: 'export async function cookies(){return globalThis.__prTestCookies();}', shortCircuit: true };
    if (url.startsWith('file:') && url.endsWith('.ts') && !url.includes('/node_modules/')) {
      return { format: 'module', source: ts.transpileModule(readFileSync(new URL(url), 'utf8'), { compilerOptions: { module: ts.ModuleKind.ESNext, target: ts.ScriptTarget.ES2022 } }).outputText, shortCircuit: true };
    }
    return next(url, context);
  },
});
const { env } = await import('../db/runtime.ts');
const { phoneLogin } = await import('../app/api/_lib/phone-login.ts');
const { signInNameAndPhone } = await import('../app/api/_lib/account.ts');
const { verifySession } = await import('../app/session-token.ts');
const rollback = new Error('ROLLBACK_TEST_FIXTURES');
let passed = 0;
async function call(route, method = 'GET', body, expected = 200) {
  const [path] = route.split('?');
  const routeModule = await import('../app/api/' + path + '/route.ts');
  const response = await routeModule[method](new Request('http://localhost/api/' + route, {
    method, headers: { 'content-type': 'application/json', cookie }, ...(body === undefined ? {} : { body: JSON.stringify(body) }),
  }));
  const data = await response.json();
  assert.equal(response.status, expected, `${method} ${path}: ${JSON.stringify(data).slice(0,250)}`);
  passed++; console.log('PASS', method, path);
  return data;
}
try {
  await env.DB.transaction(async () => {
    await env.DB.prepare("SET LOCAL statement_timeout = '15s'").run();
    await call('health');
    await call('account', 'GET', undefined, 401);
    await call('admin/dashboard', 'GET', undefined, 403);
    const phone = '+919990' + String(Math.floor(Math.random() * 1000000)).padStart(6, '0');
    assert.equal(await env.DB.prepare('SELECT id FROM customers WHERE phone=?').bind(phone).first(), null);
    await signInNameAndPhone('QA Rollback', phone, crypto.randomUUID());
    const login = await phoneLogin(new Request('http://localhost/api/auth/member', { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({name:'QA Rollback',phone}) }), 'member');
    assert.equal(login.status, 200, await login.clone().text());
    cookie = login.headers.get('set-cookie').split(';')[0];
    const identity = verifySession(cookie.split('=')[1], 'member');
    assert.ok(identity?.customerId); passed++; console.log('PASS member login');
    await call('account'); await call('wallet'); await call('cart');
    const product = await env.DB.prepare("INSERT INTO products(slug,name,price,category,color,status,sku) VALUES (?,'QA rollback fixture',100000,'Men','White','published',?)").bind('qa-'+crypto.randomUUID(), 'QA-'+crypto.randomUUID()).run();
    const productId = product.meta.last_row_id;
    const variant = await env.DB.prepare("INSERT INTO product_variants(product_id,size,color,sku,stock,active) VALUES (?,'M','White',?,5,1)").bind(productId,'QA-'+crypto.randomUUID()).run();
    const variantId = variant.meta.last_row_id;
    await call('account/wishlist', 'POST', {productSlug:(await env.DB.prepare('SELECT slug FROM products WHERE id=?').bind(productId).first()).slug}, 201);
    await call('account/wishlist?productSlug=' + encodeURIComponent((await env.DB.prepare('SELECT slug FROM products WHERE id=?').bind(productId).first()).slug), 'DELETE');
    await call('account', 'PATCH', {firstName:'QA Updated',lastName:'Rollback'});
    await call('cart', 'POST', {variantId,quantity:2}, 201);
    await call('cart', 'PATCH', {variantId,quantity:1});
    const bag = await call('cart'); assert.equal(bag.items[0].quantity, 1);
    await call('account/addresses','POST',{label:'QA',firstName:'QA',lastName:'Rollback',phone,line1:'Test only',city:'Test',state:'Test',pinCode:'110001',isDefault:true},201);
    const uniqueProduct = await env.DB.prepare("INSERT INTO products(slug,name,price,category,color,status,sku,is_unique_find,lifetime_production_cap,total_units_created,unique_find_status) VALUES (?,'QA unique fixture',100000,'Men','White','published',?,1,1,1,'available')").bind('qa-unique-'+crypto.randomUUID(), 'QAU-'+crypto.randomUUID()).run();
    const uniqueVariant = await env.DB.prepare("INSERT INTO product_variants(product_id,size,color,sku,stock,active) VALUES (?,'M','White',?,1,1)").bind(uniqueProduct.meta.last_row_id,'QAU-'+crypto.randomUUID()).run();
    const reservationKey = crypto.randomUUID();
    await call('unique-finds/reserve','POST',{variantId:uniqueVariant.meta.last_row_id,idempotencyKey:reservationKey},201);
    const sameReservation = await call('unique-finds/reserve','POST',{variantId:uniqueVariant.meta.last_row_id,idempotencyKey:reservationKey}); assert.equal(sameReservation.idempotent,true);
    await call('cart','PATCH',{variantId:uniqueVariant.meta.last_row_id,quantity:0});
    assert.equal((await env.DB.prepare('SELECT reserved_stock FROM product_variants WHERE id=?').bind(uniqueVariant.meta.last_row_id).first()).reserved_stock,0);
    const payload = { phone,email:'qa@example.invalid',firstName:'QA',lastName:'Rollback',address:'Test only',city:'Test',pinCode:'110001',checkoutKey:crypto.randomUUID(),paymentMethod:'cod',items:[{variantId,quantity:1}] };
    const order = await call('orders','POST',payload,201);
    const duplicate = await call('orders','POST',payload); assert.equal(duplicate.orderId,order.orderId);
    await call('orders','POST',{...payload,city:'Changed'},409);
    assert.equal((await env.DB.prepare('SELECT stock FROM product_variants WHERE id=?').bind(variantId).first()).stock,4);
    await call('orders');
    process.env.ADMIN_PHONE_NUMBERS = phone;
    const adminLogin = await phoneLogin(new Request('http://localhost/api/auth/admin',{method:'POST',headers:{'content-type':'application/json'},body:JSON.stringify({name:'QA',phone})}),'admin');
    assert.equal(adminLogin.status,200); cookie=adminLogin.headers.get('set-cookie').split(';')[0];
    for (const route of ['admin/dashboard','admin/customers','admin/orders','admin/inventory','admin/emails','admin/search?q=QA','admin/commerce?resource=products','admin/products?id='+productId]) await call(route);
    await call('admin/orders','PATCH',{id:order.orderId,action:'status',status:'cancelled',reason:'QA rollback'});
    assert.equal((await env.DB.prepare('SELECT stock FROM product_variants WHERE id=?').bind(variantId).first()).stock,5);
    await call('admin/inventory','PATCH',{id:variantId,mode:'increase',quantity:1,reason:'QA rollback adjustment'});
    assert.equal((await env.DB.prepare('SELECT stock FROM product_variants WHERE id=?').bind(variantId).first()).stock,6);
    await call('admin/orders','PATCH',{id:order.orderId,action:'status',status:'cancelled',reason:'QA rollback'});
    assert.equal((await env.DB.prepare('SELECT stock FROM product_variants WHERE id=?').bind(variantId).first()).stock,6);
    throw rollback;
  });
} catch (error) {
  if (error !== rollback) { console.error(error); process.exitCode = 1; }
}
console.log(`${passed} checks passed; transaction rolled back.`);
process.exit(process.exitCode || 0);
