// npmPackages/order-catalog/client/catalogRegistry.js
// Extension point: other workflow packages register additional order-type
// catalogs (beyond the built-in laboratory/medication/radiology ancillaries)
// without editing this package. First consumer: @orbital/dental.
//
// A registered catalog's orders are created server-side by the generic
// ServiceRequest branch of orderCatalog.submitOrders — catalog items may carry
// `system` (coding system URI, default SNOMED), `categoryCoding` (a Coding for
// ServiceRequest.category), and `profileUrls` (meta.profile stamps).

const registeredCatalogs = new Map();

export function registerOrderCatalog(entry) {
  if (!entry || !entry.key || !entry.label || !Array.isArray(entry.catalog)) {
    console.warn('[order-catalog] registerOrderCatalog: invalid entry', entry);
    return;
  }
  if (registeredCatalogs.has(entry.key)) {
    console.warn('[order-catalog] registerOrderCatalog: replacing existing catalog for key', entry.key);
  }
  registeredCatalogs.set(entry.key, {
    key: entry.key,
    label: entry.label,
    catalog: entry.catalog,
    categories: Array.isArray(entry.categories) ? entry.categories : [],
    serviceCategoryCoding: entry.serviceCategoryCoding || null,
    profileUrls: Array.isArray(entry.profileUrls) ? entry.profileUrls : []
  });
  console.log('[order-catalog] Registered order catalog:', entry.key, '(' + entry.catalog.length + ' items)');
}

export function getRegisteredCatalogs() {
  return Array.from(registeredCatalogs.values());
}

export function getRegisteredCatalog(key) {
  return registeredCatalogs.get(key) || null;
}
