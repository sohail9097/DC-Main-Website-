import { DEFAULT_CLIENTS_LIST } from '../App';
import { DEFAULT_BRAND_ITEMS, BrandItem } from '../pages/BrandPage';

export interface ClientItem {
  id: string;
  name: string;
  color: string;
  size: 'small' | 'medium' | 'large' | 'xlarge' | string;
  logoUrl: string;
  layer?: 1 | 2 | 3 | string;
  description?: string;
  renderLogo?: () => any;
}

export const getCanonicalInfo = (name: string) => {
  const norm = name.toLowerCase().trim().replace(/[^a-z]/g, '');
  if (
    norm === 'swachhbharat' || 
    norm === 'swatchbharat' || 
    norm === 'swachbharat' || 
    norm === 'swacthbharat' || 
    norm === 'swachhbharat' ||
    name.includes('स्वच्छ') ||
    name.includes('स्वच्छ भारत')
  ) {
    return { name: 'Swachh Bharat', layer: 2, category: 'govt' as const, id: 'swachhbharat' };
  }
  if (
    norm === 'indianairforce' || 
    norm === 'airforce' || 
    norm === 'iaf' || 
    norm === 'airforceofindia'
  ) {
    return { name: 'Indian Air Force', layer: 2, category: 'govt' as const, id: 'indianairforce' };
  }
  if (
    norm === 'indianarmy' || 
    norm === 'army' || 
    norm === 'indianarmyforce'
  ) {
    return { name: 'Indian Army', layer: 2, category: 'govt' as const, id: 'indianarmy' };
  }
  if (norm === 'gujarattourism') {
    return { name: 'Gujarat Tourism', layer: 2, category: 'govt' as const, id: 'gujarattourism' };
  }
  if (
    norm === 'landportsauthority' || 
    norm === 'landportsauthorityofindia' || 
    norm === 'lpai'
  ) {
    return { name: 'Land Ports Authority of India', layer: 2, category: 'govt' as const, id: 'landports' };
  }
  return null;
};

export const isSimilarName = (n1: string, n2: string): boolean => {
  const s1 = n1.toLowerCase().trim();
  const s2 = n2.toLowerCase().trim();
  
  if (s1 === s2) return true;
  
  // Normalize by removing spaces and special characters
  const k1 = s1.replace(/[^a-z0-9]/g, '');
  const k2 = s2.replace(/[^a-z0-9]/g, '');
  if (k1 && k2 && k1 === k2) return true;
  
  // Handlers for National Geographic variations
  if (
    (s1.includes('nat') && s1.includes('geo')) &&
    (s2.includes('nat') && s2.includes('geo'))
  ) return true;

  if (
    (s1.includes('geographic') || s1.includes('natgeo') || s1.includes('national')) &&
    (s2.includes('geographic') || s2.includes('natgeo') || s2.includes('national') || s2.includes('nation'))
  ) return true;

  // Handlers for Zee TV / Zee variations
  if (s1.includes('zee') && s2.includes('zee')) return true;

  // Check if one contains the other entirely as a word
  if (s1.includes(s2) || s2.includes(s1)) return true;

  return false;
};

export const normalizeAndSyncData = () => {
  // 1. Fetch current localStorage data
  let clients: ClientItem[] = [];
  const storedClients = localStorage.getItem('dc_clients');
  if (storedClients) {
    try {
      clients = JSON.parse(storedClients);
    } catch (e) {
      console.error('Error parsing dc_clients in syncHelper:', e);
    }
  }
  if (!clients || clients.length === 0) {
    clients = [...DEFAULT_CLIENTS_LIST] as any[];
  }

  let brands: BrandItem[] = [];
  const storedBrands = localStorage.getItem('dc_brand_partners');
  if (storedBrands) {
    try {
      brands = JSON.parse(storedBrands);
    } catch (e) {
      console.error('Error parsing dc_brand_partners in syncHelper:', e);
    }
  }
  if (!brands || brands.length === 0) {
    brands = [...DEFAULT_BRAND_ITEMS];
  }

  let hasChanges = false;

  // --- Normalizing Clients ---
  const cleanedClientsMap = new Map<string, ClientItem>();
  
  // Identify user client IDs and normalized names that exist currently
  const userClientIds = new Set(clients.map(c => c.id).filter(Boolean));
  const userClientNames = new Set(clients.map(c => c.name.toLowerCase().trim().replace(/\s+/g, '')).filter(Boolean));

  // Seed with DEFAULT_CLIENTS_LIST to ensure they exist (only if they don't clash with user's saved list)
  for (const item of DEFAULT_CLIENTS_LIST) {
    const key = item.name.toLowerCase().trim().replace(/\s+/g, '');
    if (!userClientIds.has(item.id) && !userClientNames.has(key)) {
      cleanedClientsMap.set(key, { ...item } as any);
    }
  }

  // Standardize and merge actual clients list
  for (const client of clients) {
    if (!client || !client.name) continue;
    
    let currentName = client.name;
    let currentId = client.id;
    let currentLayer: any = client.layer;

    const canonical = getCanonicalInfo(currentName);
    if (canonical) {
      currentName = canonical.name;
      currentId = canonical.id;
      currentLayer = canonical.layer;
    }

    if (!currentLayer) {
      const defaultClient = DEFAULT_CLIENTS_LIST.find(
        (c) => c.name.toLowerCase().trim() === currentName.toLowerCase().trim()
      );
      currentLayer = defaultClient?.layer || 1;
    }

    const key = currentName.toLowerCase().trim().replace(/\s+/g, '');
    const existing = cleanedClientsMap.get(key);

    if (existing) {
      // Merge properties, prioritizing non-empty logoUrl, and user edits
      const merged: ClientItem = {
        ...existing,
        logoUrl: client.logoUrl || existing.logoUrl,
        size: client.size || existing.size,
        color: client.color || existing.color,
        layer: currentLayer || existing.layer || 1
      };
      if (
        existing.logoUrl !== merged.logoUrl || 
        existing.layer !== merged.layer ||
        existing.name !== currentName
      ) {
        hasChanges = true;
      }
      cleanedClientsMap.set(key, merged);
    } else {
      cleanedClientsMap.set(key, {
        ...client,
        id: currentId,
        name: currentName,
        layer: currentLayer || 1
      });
      hasChanges = true;
    }
  }

  // --- Normalizing Brands ---
  const cleanedBrandsMap = new Map<string, BrandItem>();

  const userBrandIds = new Set(brands.map(b => b.id).filter(Boolean));
  const userBrandNames = new Set(brands.map(b => b.name.toLowerCase().trim().replace(/\s+/g, '')).filter(Boolean));

  // First seed with DEFAULT_BRAND_ITEMS (only if they don't clash with user's saved modifications)
  for (const item of DEFAULT_BRAND_ITEMS) {
    const key = item.name.toLowerCase().trim().replace(/\s+/g, '');
    if (!userBrandIds.has(item.id) && !userBrandNames.has(key)) {
      cleanedBrandsMap.set(key, { ...item });
    }
  }

  // Standardize and merge actual brands list
  for (const brand of brands) {
    if (!brand || !brand.name) continue;

    let currentName = brand.name;
    let currentId = brand.id;
    let currentCategory = brand.category;

    const canonical = getCanonicalInfo(currentName);
    if (canonical) {
      currentName = canonical.name;
      currentId = canonical.id;
      currentCategory = canonical.category;
    }

    if (!currentCategory) {
      const defaultBrand = DEFAULT_BRAND_ITEMS.find(
        (b) => b.name.toLowerCase().trim() === currentName.toLowerCase().trim()
      );
      currentCategory = defaultBrand?.category || 'brands';
    }

    const key = currentName.toLowerCase().trim().replace(/\s+/g, '');
    const existing = cleanedBrandsMap.get(key);

    if (existing) {
      const merged: BrandItem = {
        ...existing,
        logoUrl: brand.logoUrl || existing.logoUrl,
        logoSize: brand.logoSize || existing.logoSize,
        category: currentCategory || existing.category,
        description: brand.description || existing.description
      };
      if (
        existing.logoUrl !== merged.logoUrl || 
        existing.category !== merged.category ||
        existing.name !== currentName
      ) {
        hasChanges = true;
      }
      cleanedBrandsMap.set(key, merged);
    } else {
      cleanedBrandsMap.set(key, {
        ...brand,
        id: currentId,
        name: currentName,
        category: currentCategory || 'brands'
      });
      hasChanges = true;
    }
  }

  // --- Bidirectional Sync Cross-Validation ---
  // Ensure every Brand Partner exists as a Client on the appropriate layer
  let crossSyncNeeded = false;
  for (const brand of cleanedBrandsMap.values()) {
    const key = brand.name.toLowerCase().trim().replace(/\s+/g, '');
    if (!cleanedClientsMap.has(key)) {
      let assignedLayer: 1 | 2 | 3 = 1;
      if (brand.category === 'govt') assignedLayer = 2;
      else if (brand.category === 'corporates' || brand.category === 'platforms') assignedLayer = 3;

      cleanedClientsMap.set(key, {
        id: brand.id || `brand-sync-${Date.now()}-${Math.random()}`,
        name: brand.name,
        color: '#FFFFFF',
        size: brand.logoSize || 'medium',
        logoUrl: brand.logoUrl || '',
        layer: assignedLayer,
        description: brand.description || ''
      });
      crossSyncNeeded = true;
    }
  }

  // Ensure every Client exists as a Brand Partner on the appropriate category
  for (const client of cleanedClientsMap.values()) {
    const key = client.name.toLowerCase().trim().replace(/\s+/g, '');
    if (!cleanedBrandsMap.has(key)) {
      let assignedCategory: 'brands' | 'govt' | 'corporates' | 'platforms' = 'brands';
      if (client.layer === 2) assignedCategory = 'govt';
      else if (client.layer === 3) assignedCategory = 'corporates';

      cleanedBrandsMap.set(key, {
        id: client.id || `client-sync-${Date.now()}-${Math.random()}`,
        name: client.name,
        category: assignedCategory,
        logoUrl: client.logoUrl || '',
        logoSize: (client.size === 'extralarge' ? 'xlarge' : (client.size || 'medium')) as any,
        description: client.description || ''
      });
      crossSyncNeeded = true;
    }
  }

  // --- Strict Unique ID Enforcement Step ---
  const finalClientsList = Array.from(cleanedClientsMap.values());
  const finalBrandsList = Array.from(cleanedBrandsMap.values());

  const seenBrandIds = new Set<string>();
  const finalBrandsListSynced = finalBrandsList.map(brand => {
    if (!brand.id || seenBrandIds.has(brand.id)) {
      const cleanId = (brand.id || 'brand').replace(/-dup-.*$/, '');
      const uniqueId = `${cleanId}-dup-${Math.random().toString(36).substr(2, 5)}`;
      hasChanges = true;
      seenBrandIds.add(uniqueId);
      return { ...brand, id: uniqueId };
    }
    seenBrandIds.add(brand.id);
    return brand;
  });

  const seenClientIds = new Set<string>();
  const finalClientsListSynced = finalClientsList.map(client => {
    if (!client.id || seenClientIds.has(client.id)) {
      const cleanId = (client.id || 'client').replace(/-dup-.*$/, '');
      const uniqueId = `${cleanId}-dup-${Math.random().toString(36).substr(2, 5)}`;
      hasChanges = true;
      seenClientIds.add(uniqueId);
      return { ...client, id: uniqueId };
    }
    seenClientIds.add(client.id);
    return client;
  });

  if (hasChanges || crossSyncNeeded) {
    localStorage.setItem('dc_clients', JSON.stringify(finalClientsListSynced));
    localStorage.setItem('dc_brand_partners', JSON.stringify(finalBrandsListSynced));
    
    // Dispatch synchronization events
    window.dispatchEvent(new Event('storage_updated_clients'));
    window.dispatchEvent(new Event('storage_updated_brand_partners'));
  }

  return {
    clients: finalClientsListSynced,
    brands: finalBrandsListSynced
  };
};
