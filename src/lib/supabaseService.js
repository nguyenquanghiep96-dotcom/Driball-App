import { supabase } from './supabaseClient';

// =============================================
// PRODUCTS
// =============================================

export async function fetchProducts() {
  const { data: products, error } = await supabase
    .from('products')
    .select('*')
    .order('created_at', { ascending: true });
  if (error) throw error;

  // Fetch colors for all products
  const { data: colors, error: colorsError } = await supabase
    .from('product_colors')
    .select('*')
    .order('sort_order', { ascending: true });
  if (colorsError) throw colorsError;

  // Merge colors into products
  return products.map(p => ({
    ...camelCaseProduct(p),
    colors: (colors || [])
      .filter(c => c.product_id === p.id)
      .map(c => ({ id: c.id, name: c.name, thumbnail: c.thumbnail_url || '' })),
  }));
}

export async function upsertProduct(product) {
  const { colors, ...rest } = product;
  const row = snakeCaseProduct(rest);

  const { error } = await supabase.from('products').upsert(row);
  if (error) throw error;

  // Sync colors: delete old, insert new
  await supabase.from('product_colors').delete().eq('product_id', product.id);
  if (colors && colors.length > 0) {
    const colorRows = colors.map((c, i) => ({
      id: c.id,
      product_id: product.id,
      name: c.name,
      thumbnail_url: c.thumbnail || '',
      sort_order: i,
    }));
    const { error: colorsError } = await supabase.from('product_colors').insert(colorRows);
    if (colorsError) throw colorsError;
  }
}

export async function deleteProduct(productId) {
  // Delete images from storage first
  const { data: colors } = await supabase
    .from('product_colors')
    .select('thumbnail_url')
    .eq('product_id', productId);

  if (colors) {
    for (const c of colors) {
      if (c.thumbnail_url && c.thumbnail_url.includes('product-images')) {
        const path = c.thumbnail_url.split('/product-images/')[1];
        if (path) await supabase.storage.from('product-images').remove([path]);
      }
    }
  }

  const { error } = await supabase.from('products').delete().eq('id', productId);
  if (error) throw error;
}

// =============================================
// ORDERS
// =============================================

export async function fetchOrders() {
  const { data, error } = await supabase
    .from('orders')
    .select('*')
    .order('created_at', { ascending: false });
  if (error) throw error;
  return (data || []).map(camelCaseOrder);
}

export async function upsertOrder(order) {
  const row = snakeCaseOrder(order);
  const { error } = await supabase.from('orders').upsert(row);
  if (error) throw error;
}

export async function deleteOrder(orderId) {
  const { error } = await supabase.from('orders').delete().eq('id', orderId);
  if (error) throw error;
}

// =============================================
// BRAND COSTS
// =============================================

export async function fetchBrandCosts() {
  const { data, error } = await supabase.from('brand_costs').select('*');
  if (error) throw error;
  return (data || []).map(row => ({
    id: row.id,
    name: row.name,
    unit: row.unit,
    quantity: row.quantity,
    unitPrice: row.unit_price,
    supplier: row.supplier,
    notes: row.notes,
  }));
}

export async function upsertBrandCost(item) {
  const { error } = await supabase.from('brand_costs').upsert({
    id: item.id,
    name: item.name,
    unit: item.unit,
    quantity: item.quantity,
    unit_price: item.unitPrice,
    supplier: item.supplier,
    notes: item.notes,
  });
  if (error) throw error;
}

export async function deleteBrandCost(id) {
  const { error } = await supabase.from('brand_costs').delete().eq('id', id);
  if (error) throw error;
}

// =============================================
// OPERATING COSTS
// =============================================

export async function fetchOperatingCosts() {
  const { data, error } = await supabase.from('operating_costs').select('*');
  if (error) throw error;
  const result = {};
  (data || []).forEach(row => { result[row.month] = row.costs; });
  return result;
}

export async function upsertOperatingCosts(month, costs) {
  const { error } = await supabase.from('operating_costs').upsert({ month, costs });
  if (error) throw error;
}

// =============================================
// IMAGE UPLOAD
// =============================================

export async function uploadProductImage(file, productId, colorId) {
  const ext = file.name?.split('.').pop() || 'jpg';
  const path = `${productId}/${colorId}-${Date.now()}.${ext}`;

  const { error } = await supabase.storage
    .from('product-images')
    .upload(path, file, { upsert: true });
  if (error) throw error;

  const { data } = supabase.storage.from('product-images').getPublicUrl(path);
  return data.publicUrl;
}

export async function uploadProductImageFromBase64(base64Data, productId, colorId) {
  // Convert base64 to blob
  const res = await fetch(base64Data);
  const blob = await res.blob();
  const ext = blob.type.split('/')[1] || 'jpeg';
  const path = `${productId}/${colorId}-${Date.now()}.${ext}`;

  const { error } = await supabase.storage
    .from('product-images')
    .upload(path, blob, { contentType: blob.type, upsert: true });
  if (error) throw error;

  const { data } = supabase.storage.from('product-images').getPublicUrl(path);
  return data.publicUrl;
}

export async function deleteProductImage(url) {
  if (!url || !url.includes('product-images')) return;
  const path = url.split('/product-images/')[1];
  if (path) {
    await supabase.storage.from('product-images').remove([path]);
  }
}

// =============================================
// MIGRATION: localStorage -> Supabase
// =============================================

export async function migrateFromLocalStorage() {
  const STORAGE_KEY = 'driball_data';
  const saved = localStorage.getItem(STORAGE_KEY);
  if (!saved) return null;

  const localData = JSON.parse(saved);

  // Check if Supabase already has data
  const { data: existingProducts } = await supabase.from('products').select('id').limit(1);
  if (existingProducts && existingProducts.length > 0) {
    console.log('Supabase already has data, skipping migration');
    return null;
  }

  console.log('Migrating localStorage data to Supabase...');

  // Migrate products
  if (localData.products && localData.products.length > 0) {
    for (const p of localData.products) {
      // Migrate old thumbnail format
      let colors = p.colors || [];
      if (!colors.length && p.thumbnail !== undefined) {
        colors = [{ id: 'c-default', name: '', thumbnail: p.thumbnail || '' }];
      }

      // Upload base64 images to storage
      const migratedColors = [];
      for (const c of colors) {
        let thumbUrl = '';
        if (c.thumbnail && c.thumbnail.startsWith('data:')) {
          try {
            thumbUrl = await uploadProductImageFromBase64(c.thumbnail, p.id, c.id);
          } catch (e) {
            console.warn('Failed to upload image for', c.id, e);
          }
        } else {
          thumbUrl = c.thumbnail || '';
        }
        migratedColors.push({ ...c, thumbnail: thumbUrl });
      }

      await upsertProduct({ ...p, colors: migratedColors });
    }
  }

  // Migrate orders
  if (localData.orders && localData.orders.length > 0) {
    for (const o of localData.orders) {
      await upsertOrder(o);
    }
  }

  // Migrate brand costs
  if (localData.brandCosts && localData.brandCosts.length > 0) {
    for (const bc of localData.brandCosts) {
      await upsertBrandCost(bc);
    }
  }

  // Migrate operating costs
  if (localData.operatingCosts) {
    for (const [month, costs] of Object.entries(localData.operatingCosts)) {
      await upsertOperatingCosts(month, costs);
    }
  }

  console.log('Migration complete!');
  // Mark as migrated
  localStorage.setItem('driball_migrated', 'true');

  return localData;
}

// =============================================
// LOAD ALL DATA
// =============================================

export async function loadAllData() {
  const [products, orders, brandCosts, operatingCosts] = await Promise.all([
    fetchProducts(),
    fetchOrders(),
    fetchBrandCosts(),
    fetchOperatingCosts(),
  ]);
  return { products, orders, brandCosts, operatingCosts };
}

// =============================================
// HELPERS: camelCase <-> snake_case
// =============================================

function camelCaseProduct(row) {
  return {
    id: row.id,
    name: row.name,
    tag: row.tag,
    fabricType: row.fabric_type,
    production: row.production || {},
    prices: row.prices || {},
    notes: row.notes || '',
  };
}

function snakeCaseProduct(p) {
  return {
    id: p.id,
    name: p.name,
    tag: p.tag,
    fabric_type: p.fabricType || '',
    production: p.production || {},
    prices: p.prices || {},
    notes: p.notes || '',
  };
}

function camelCaseOrder(row) {
  return {
    id: row.id,
    customerName: row.customer_name,
    shippingAddress: row.shipping_address || '',
    productId: row.product_id,
    colorId: row.color_id || '',
    quantity: row.quantity || 1,
    printCost: row.print_cost || 0,
    logo3dCost: row.logo3d_cost || 0,
    outsourceCost: row.outsource_cost || 0,
    overrideUnitPrice: row.override_unit_price,
    overrideProdCost: row.override_prod_cost,
    deposit: row.deposit || 0,
    depositDate: row.deposit_date || '',
    status: row.status || 'demo',
    source: row.source || '',
    notes: row.notes || '',
    createdAt: row.created_at,
  };
}

function snakeCaseOrder(o) {
  return {
    id: o.id,
    customer_name: o.customerName || '',
    shipping_address: o.shippingAddress || '',
    product_id: o.productId || null,
    color_id: o.colorId || '',
    quantity: Number(o.quantity) || 1,
    print_cost: Number(o.printCost) || 0,
    logo3d_cost: Number(o.logo3dCost) || 0,
    outsource_cost: Number(o.outsourceCost) || 0,
    override_unit_price: o.overrideUnitPrice ?? null,
    override_prod_cost: o.overrideProdCost ?? null,
    deposit: Number(o.deposit) || 0,
    deposit_date: o.depositDate || null,
    status: o.status || 'demo',
    source: o.source || '',
    notes: o.notes || '',
    created_at: o.createdAt || new Date().toISOString(),
  };
}
