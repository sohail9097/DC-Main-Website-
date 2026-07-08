import { BrandItem, ClientItem } from './brandData';

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

export const isGoogleDriveLink = (url?: string): boolean => {
  if (!url) return false;
  const trimmed = url.trim();
  if (trimmed.startsWith('data:image/')) return true;
  // Match standard google drive share urls, embed urls, and direct image API endpoints
  return trimmed.includes('drive.google.com') || 
         trimmed.includes('docs.google.com') || 
         trimmed.includes('googleusercontent.com') || 
         /(?:\/file\/d\/|id=)([^/?#]+)/.test(trimmed);
};

export const hasLogoContent = (name: string, logoUrl?: string, defaultBrands: BrandItem[] = []): boolean => {
  if (logoUrl && logoUrl.trim().length > 0) return true;
  // Check if it is a built-in logo
  const normName = name.toLowerCase().trim().replace(/\s+/g, '');
  const isBuiltIn = defaultBrands.some((d: any) => 
    (d.name.toLowerCase().trim().replace(/\s+/g, '') === normName || isSimilarName(d.name, name))
  );
  return isBuiltIn;
};

export const normalizeAndSyncData = (defaultClients: ClientItem[] = [], defaultBrands: BrandItem[] = []) => {
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

  let brands: BrandItem[] = [];
  const storedBrands = localStorage.getItem('dc_brand_partners');
  if (storedBrands) {
    try {
      brands = JSON.parse(storedBrands);
    } catch (e) {
      console.error('Error parsing dc_brand_partners in syncHelper:', e);
    }
  }

  let hasChanges = false;

  // 2. Determine if we are dealing with old defaults that need updating
  const hasPureOldDefaults = clients.some(c => 
    (c.name === 'NETFLIX' || c.name === "D'DECOR" || c.name === 'IndiGo') && 
    (!c.logoUrl || !isGoogleDriveLink(c.logoUrl))
  );

  if (hasPureOldDefaults || !storedClients || clients.length === 0) {
    // Collect any user custom additions/logos first to keep them safe
    const customClients = clients.filter(c => {
      const def = defaultClients.find((d: any) => isSimilarName(d.name, c.name));
      return (c.logoUrl && c.logoUrl.trim().length > 0) || !def;
    });

    const customBrands = brands.filter(b => {
      const def = defaultBrands.find((d: any) => isSimilarName(d.name, b.name));
      return (b.logoUrl && b.logoUrl.trim().length > 0) || !def;
    });

    // Load fresh defaults
    clients = [...defaultClients];
    brands = [...defaultBrands];

    // Restore user custom uploaded logos over defaults or append if new
    customClients.forEach(custom => {
      const idx = clients.findIndex(c => isSimilarName(c.name, custom.name));
      if (idx >= 0) {
        clients[idx] = { ...clients[idx], ...custom };
      } else {
        clients.push(custom);
      }
    });

    customBrands.forEach(custom => {
      const idx = brands.findIndex(b => isSimilarName(b.name, custom.name));
      if (idx >= 0) {
        brands[idx] = { ...brands[idx], ...custom };
      } else {
        brands.push(custom);
      }
    });

    localStorage.setItem('dc_clients', JSON.stringify(clients));
    localStorage.setItem('dc_brand_partners', JSON.stringify(brands));
    hasChanges = true;
  }

  // Strictly filter out empty or invalid custom items
  const originalClientsLen = clients.length;
  const originalBrandsLen = brands.length;

  clients = clients.filter(c => hasLogoContent(c.name, c.logoUrl, defaultBrands));
  brands = brands.filter(b => hasLogoContent(b.name, b.logoUrl, defaultBrands));

  if (clients.length !== originalClientsLen || brands.length !== originalBrandsLen) {
    hasChanges = true;
  }

  // --- Normalizing Clients with similarity-aware agrupation ---
  const cleanedClients: ClientItem[] = [];

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
      currentLayer = 1;
    }

    const existingIndex = cleanedClients.findIndex(c => isSimilarName(c.name, currentName));

    if (existingIndex >= 0) {
      const existing = cleanedClients[existingIndex];
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
      cleanedClients[existingIndex] = merged;
    } else {
      cleanedClients.push({
        ...client,
        id: currentId,
        name: currentName,
        layer: currentLayer || 1
      });
    }
  }

  // --- Normalizing Brands with similarity-aware agrupation ---
  const cleanedBrands: BrandItem[] = [];

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
      currentCategory = 'platforms';
    }

    const existingIndex = cleanedBrands.findIndex(b => isSimilarName(b.name, currentName));

    if (existingIndex >= 0) {
      const existing = cleanedBrands[existingIndex];
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
      cleanedBrands[existingIndex] = merged;
    } else {
      cleanedBrands.push({
        ...brand,
        id: currentId,
        name: currentName,
        category: currentCategory || 'platforms'
      });
    }
  }

  // --- Bidirectional Sync Cross-Validation ---
  // Ensure every Brand Partner exists as a Client on the appropriate layer
  let crossSyncNeeded = false;
  for (const brand of cleanedBrands) {
    const existsAsClient = cleanedClients.some(c => isSimilarName(c.name, brand.name));
    if (!existsAsClient) {
      let assignedLayer: 1 | 2 | 3 | 4 = 1;
      if (brand.category === 'govt') assignedLayer = 2;
      else if (brand.category === 'corporates') assignedLayer = 3;
      else if (brand.category === 'platforms') assignedLayer = 4;

      cleanedClients.push({
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
  for (const client of cleanedClients) {
    const existsAsBrand = cleanedBrands.some(b => isSimilarName(b.name, client.name));
    if (!existsAsBrand) {
      let assignedCategory: 'brands' | 'platforms' | 'govt' | 'corporates' = 'brands';
      if (client.layer === 2) assignedCategory = 'govt';
      else if (client.layer === 3) assignedCategory = 'corporates';
      else if (client.layer === 4) assignedCategory = 'platforms';

      cleanedBrands.push({
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

  const seenBrandIds = new Set<string>();
  const finalBrandsListSynced = cleanedBrands.map(brand => {
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
  const finalClientsListSynced = cleanedClients.map(client => {
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
