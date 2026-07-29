import { doc, setDoc, onSnapshot, getDoc } from 'firebase/firestore';
import { db, handleFirestoreError, OperationType } from './firebase';

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
  'social_instagram', 'social_facebook', 'social_youtube', 'social_twitter',
  'nav_logo_type', 'nav_logo_text_short', 'nav_logo_text_full', 'nav_logo_image_url',
  'cinematic_slides_list',
  'dc_locations',
  'dc_inquiries'
];

const ALL_UPDATE_EVENTS = [
  'storage',
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

let isWritingToFirestore = false;
let pushDebounceTimer: ReturnType<typeof setTimeout> | null = null;

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

    if (Object.keys(settings).length === 0) {
      isWritingToFirestore = false;
      return;
    }

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
    try {
      handleFirestoreError(error, OperationType.WRITE, 'configs/site');
    } catch (_) {}
  } finally {
    isWritingToFirestore = false;
  }
}

export function debouncedPushToFirestore() {
  if (pushDebounceTimer) clearTimeout(pushDebounceTimer);
  pushDebounceTimer = setTimeout(() => {
    pushLocalConfigsToFirestore();
  }, 300);
}

// Global initialization function to listen to Firebase configuration updates
export function initSiteSync() {
  if (typeof window === 'undefined') return () => {};

  console.log("[SiteSync] Initializing site sync with Firestore...");

  // Override localStorage.setItem to auto-push changes on setItem
  const originalSetItem = localStorage.setItem.bind(localStorage);
  localStorage.setItem = function(key: string, value: string) {
    originalSetItem(key, value);
    if (CONFIG_KEYS.includes(key)) {
      debouncedPushToFirestore();
    }
  };

  const siteRef = doc(db, 'configs', 'site');

  // Immediately check document presence; if not found or empty, seed Firestore
  getDoc(siteRef).then(snap => {
    if (!snap.exists() || !snap.data()?.settings || Object.keys(snap.data()?.settings || {}).length === 0) {
      console.log("[SiteSync] Firestore configs/site document empty or missing. Seeding Firestore with local configurations...");
      pushLocalConfigsToFirestore();
    }
  }).catch(err => {
    console.warn("[SiteSync] Initial fetch error:", err);
  });

  // Listen to Firestore real-time changes
  const unsubscribe = onSnapshot(siteRef, (snap) => {
    if (isWritingToFirestore) return; // Prevent overwriting while actively pushing
    
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
            originalSetItem(key, value);
            changedCount++;
          }
        }
      });
      
      if (changedCount > 0) {
        console.log(`[SiteSync] Synced ${changedCount} settings from Firestore database. Refreshing page components...`);
        // Broadcast all update events so every component in React re-renders with fresh Firestore data
        ALL_UPDATE_EVENTS.forEach(evt => {
          window.dispatchEvent(new Event(evt));
        });
      }
    } else {
      console.log("[SiteSync] Firestore configs document not found on snapshot. Seeding initial configs...");
      pushLocalConfigsToFirestore();
    }
  }, (err) => {
    const msg = err?.message || String(err);
    if (msg.includes('offline') || msg.includes('backend') || msg.includes('Could not reach')) {
      console.warn("[SiteSync] Firestore is currently operating in offline mode.");
    } else {
      console.error("[SiteSync] Error listening to Firestore configurations:", err);
      try {
        handleFirestoreError(err, OperationType.GET, 'configs/site');
      } catch (_) {}
    }
  });

  // Listen to custom storage events
  const handleLocalChange = () => {
    debouncedPushToFirestore();
  };

  ALL_UPDATE_EVENTS.forEach(evt => {
    if (evt !== 'storage') {
      window.addEventListener(evt, handleLocalChange);
    }
  });

  return () => {
    unsubscribe();
    ALL_UPDATE_EVENTS.forEach(evt => {
      if (evt !== 'storage') {
        window.removeEventListener(evt, handleLocalChange);
      }
    });
    localStorage.setItem = originalSetItem;
  };
}

