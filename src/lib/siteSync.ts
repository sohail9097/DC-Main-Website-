import { doc, setDoc, onSnapshot, getDoc } from 'firebase/firestore';
import { db } from './firebase';
import { SITE_DEFAULTS } from './siteDefaults';

export const SITE_CONFIG_VERSION = 'dc_canonical_v2026_08_21_prod_v2';

const CONFIG_KEYS = [
  'dream_team',
  'orbit_images',
  'home_hero_bg_type',
  'home_hero_bg_url',
  'home_hero_bg_image_url',
  'home_hero_mobile_bg_url',
  'home_showreel_url',
  'home_title1_l1', 'home_title1_l2',
  'home_title2_l1', 'home_title2_l2',
  'home_title3_l1', 'home_title3_l2',
  'home_films_visible',
  'home_films_title',
  'home_films_show_cats',
  'home_films_limit',
  'dc_films',
  'dc_clients',
  'dc_brand_partners',
  'paragraph_frames',
  'verticals_list',
  'about_bgt_word1', 'about_bgt_word2', 'about_bgt_tagline', 'about_hero_bg', 'about_genesis_sub', 'about_genesis_title', 'about_genesis_p1', 'about_genesis_p2', 'about_genesis_sub3', 'about_genesis_title3', 'about_genesis_p3', 'about_promo_video_url',
  'about_stat1_val', 'about_stat1_lbl', 'about_stat2_val', 'about_stat2_lbl', 'about_stat3_val', 'about_stat3_lbl', 'about_stat4_val', 'about_stat4_lbl',
  'about_team', 'about_join_us_img',
  'contact_title_first', 'contact_title_orange', 'contact_subtitle', 'contact_email', 'contact_phone', 'contact_address', 'contact_image',
  'contact_box1_bg', 'contact_box1_label', 'contact_box1_title',
  'contact_box2_bg', 'contact_box2_label', 'contact_box2_title',
  'social_instagram', 'social_facebook', 'social_youtube', 'social_twitter', 'social_linkedin',
  'nav_logo_type', 'nav_logo_text_short', 'nav_logo_text_full', 'nav_logo_image_url',
  'cinematic_slides_list',
  'dc_locations',
  'dc_inquiries'
];

let isWritingToFirestore = false;

export const dispatchAllUpdateEvents = () => {
  if (typeof window === 'undefined') return;
  window.dispatchEvent(new Event('storage'));
  const events = [
    'storage_updated_clients',
    'storage_updated_team',
    'storage_updated_orbit',
    'storage_updated_home_hero',
    'storage_updated_home_films',
    'storage_updated_about',
    'storage_updated_contact',
    'storage_updated_films',
    'storage_updated_socials',
    'storage_updated_brand_partners',
    'storage_updated_cinematic_slides',
    'storage_updated_paragraph_frames',
    'storage_updated_verticals',
    'storage_updated_locations',
    'storage_updated_inquiries'
  ];
  events.forEach(evt => window.dispatchEvent(new Event(evt)));
};

// Function to seed default configs into LocalStorage and enforce canonical site data
export function seedDefaultsIfMissing() {
  if (typeof window === 'undefined') return;
  try {
    const defaults = SITE_DEFAULTS as Record<string, string>;
    const currentVersion = localStorage.getItem('dc_site_config_version');
    const isNewVersion = currentVersion !== SITE_CONFIG_VERSION;

    let seeded = false;
    Object.entries(defaults).forEach(([key, val]) => {
      const existing = localStorage.getItem(key);
      
      // If version updated OR key is missing OR contains old placeholder unsplash images that were superseded
      const isOutdatedUnsplash = existing && (
        existing.includes('images.unsplash.com/photo-1533488765986') ||
        existing.includes('images.unsplash.com/photo-1478760329108') ||
        existing.includes('images.unsplash.com/photo-1550684848')
      );

      if (isNewVersion || existing === null || isOutdatedUnsplash) {
        if (val !== undefined) {
          localStorage.setItem(key, typeof val === 'string' ? val : JSON.stringify(val));
          seeded = true;
        }
      }
    });

    if (isNewVersion) {
      localStorage.setItem('dc_site_config_version', SITE_CONFIG_VERSION);
      seeded = true;
    }

    if (seeded) {
      dispatchAllUpdateEvents();
    }
  } catch (e) {
    console.error('[SiteSync] Error seeding initial defaults:', e);
  }
}

// Function to push settings from LocalStorage directly into Firestore configs
export async function pushLocalConfigsToFirestore() {
  if (typeof window === 'undefined') return;
  if (isWritingToFirestore) return;
  
  isWritingToFirestore = true;
  try {
    const settings: Record<string, string> = {};
    CONFIG_KEYS.forEach(key => {
      let value = localStorage.getItem(key);
      if (value !== null) {
        // Sanitize any instances of dreamcatchers.com to dreamcatchers.tv
        if (typeof value === 'string' && value.toLowerCase().includes('@dreamcatchers.com')) {
          value = value.replace(/@dreamcatchers\.com/gi, '@dreamcatchers.tv');
          localStorage.setItem(key, value);
        }
        settings[key] = value;
      }
    });

    console.log("[SiteSync] Pushing settings to Firestore...", Object.keys(settings).length, "keys found in localStorage");
    
    const siteRef = doc(db, 'configs', 'site');
    await setDoc(siteRef, {
      id: 'site',
      settings,
      updatedAt: new Date().toISOString()
    }, { merge: true });
    
    console.log("[SiteSync] Successfully pushed configurations to Firestore.");
  } catch (error) {
    console.error("[SiteSync] Error pushing configurations to Firestore:", error);
  } finally {
    isWritingToFirestore = false;
  }
}

// Global initialization function to listen to Firebase configuration updates
export function initSiteSync() {
  if (typeof window === 'undefined') return () => {};

  // First seed canonical defaults to ensure zero flash of outdated content
  seedDefaultsIfMissing();

  console.log("[SiteSync] Initializing site sync with Firestore...");
  const siteRef = doc(db, 'configs', 'site');

  // Listen to Firestore real-time changes
  const unsubscribe = onSnapshot(siteRef, (snap) => {
    if (isWritingToFirestore) return; // Prevent overwriting while an admin writes
    
    if (snap.exists()) {
      const data = snap.data();
      const settings = data.settings || {};
      
      let changedCount = 0;
      CONFIG_KEYS.forEach(key => {
        if (settings[key] !== undefined && settings[key] !== null) {
          let value = settings[key];
          if (typeof value === 'string' && value.toLowerCase().includes('@dreamcatchers.com')) {
            value = value.replace(/@dreamcatchers\.com/gi, '@dreamcatchers.tv');
          }
          const currentLocal = localStorage.getItem(key);
          if (currentLocal !== value) {
            localStorage.setItem(key, value);
            changedCount++;
          }
        }
      });
      
      if (changedCount > 0) {
        console.log(`[SiteSync] Synced ${changedCount} settings from Firestore database. Refreshing page components...`);
        dispatchAllUpdateEvents();
      }
    } else {
      console.log("[SiteSync] Firestore configs document not found yet. Seeding Firestore with canonical defaults...");
      // Auto-populate Firestore if configs document is empty
      pushLocalConfigsToFirestore();
    }
  }, (err) => {
    console.error("[SiteSync] Error listening Firestore configurations:", err);
  });

  // Listen to the custom storage events emitted whenever AdminPanel saves settings
  const handleLocalChange = () => {
    pushLocalConfigsToFirestore();
  };

  const adminUpdateEvents = [
    'storage_updated_clients',
    'storage_updated_team',
    'storage_updated_orbit',
    'storage_updated_home_hero',
    'storage_updated_home_films',
    'storage_updated_about',
    'storage_updated_contact',
    'storage_updated_films',
    'storage_updated_socials',
    'storage_updated_brand_partners',
    'storage_updated_cinematic_slides',
    'storage_updated_paragraph_frames',
    'storage_updated_verticals',
    'storage_updated_locations',
    'storage_updated_inquiries'
  ];

  adminUpdateEvents.forEach(evt => {
    window.addEventListener(evt, handleLocalChange);
  });

  return () => {
    unsubscribe();
    adminUpdateEvents.forEach(evt => {
      window.removeEventListener(evt, handleLocalChange);
    });
  };
}
