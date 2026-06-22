import React, { FC, useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { useAuth } from '../context/AuthContext';
import { Navigate, Link } from 'react-router-dom';
import { pushLocalConfigsToFirestore } from '../lib/siteSync';
import { Users, Layout, Settings, LogOut, Home, Plus, Trash2, Edit2, ArrowUp, ArrowDown, RefreshCw, FileVideo, Image as ImageIcon, ImageOff, Film, Play, ChevronRight, ChevronLeft, MapPin, BookOpen, Share2, Sparkles, Upload, Check, Save } from 'lucide-react';
import { DEFAULT_TEAM_MEMBERS, TeamMember, DEFAULT_ORBIT_IMAGES, DEFAULT_FILMS_LIST, DEFAULT_CLIENTS_LIST, ClientItem, ParagraphFrameItem, DEFAULT_PARAGRAPH_FRAMES, DEFAULT_VERTICALS, VerticalItem, DEFAULT_LOCATIONS, OperationalLocation } from '../App';
import { DEFAULT_BRAND_ITEMS, BrandItem } from './BrandPage';
import { DEFAULT_SLIDES, CinematicSlide } from '../components/CinematicSlideshow';
import { normalizeAndSyncData, isSimilarName } from '../utils/syncHelper';

export function transformGoogleDriveUrl(url: string, type: 'image' | 'video' = 'image'): string {
  if (!url) return '';
  const trimmed = url.trim();
  // Extract file ID from google drive share link
  const fileIdRegex = /(?:\/file\/d\/|id=)([^/?#]+)/;
  const match = trimmed.match(fileIdRegex);
  if (match && match[1]) {
    const fileId = match[1];
    if (type === 'video') {
      return `https://drive.google.com/uc?export=download&id=${fileId}`;
    }
    return `https://lh3.googleusercontent.com/d/${fileId}`;
  }
  return trimmed;
}

export function isYouTubeUrl(url: string | undefined): boolean {
  if (!url) return false;
  const lowercase = url.toLowerCase();
  return lowercase.includes('youtube.com') || lowercase.includes('youtu.be');
}

export function getYouTubeWatchUrl(url: string | undefined): string {
  if (!url) return '';
  try {
    let videoId = '';
    if (url.includes('youtube.com/watch')) {
      const urlObj = new URL(url);
      videoId = urlObj.searchParams.get('v') || '';
    } else if (url.includes('youtu.be/')) {
      videoId = url.split('youtu.be/')[1]?.split('?')[0]?.split('&')[0];
    } else if (url.includes('youtube.com/embed/')) {
      videoId = url.split('youtube.com/embed/')[1]?.split('?')[0]?.split('&')[0];
    } else if (url.includes('youtube.com/shorts/')) {
      videoId = url.split('youtube.com/shorts/')[1]?.split('?')[0]?.split('&')[0];
    }
    
    if (videoId) {
      return `https://www.youtube.com/watch?v=${videoId}`;
    }
  } catch (e) {
    console.error('Error parsing YouTube URL:', e);
  }
  return url;
}

const AdminPanel: FC = () => {
  const { user, isAdmin, loading, logout } = useAuth();
  const [activeTab, setActiveTab] = useState<'categories' | 'home_manage' | 'film_manage' | 'team' | 'orbit' | 'about_manage' | 'contact_manage' | 'brand_manage'>('categories');
  const [homeSubTab, setHomeSubTab] = useState<'hero' | 'team' | 'orbit' | 'films' | 'clients' | 'logo' | 'paragraph_frames' | 'verticals' | 'slides'>('hero');
  const [slidesList, setSlidesList] = useState<CinematicSlide[]>([]);

  // Navigation Logo states
  const [navLogoType, setNavLogoType] = useState<'text' | 'image'>('text');
  const [navLogoTextShort, setNavLogoTextShort] = useState('DC');
  const [navLogoTextFull, setNavLogoTextFull] = useState('DREAMCATCHERS');
  const [navLogoImageUrl, setNavLogoImageUrl] = useState('');
  
  // Brand Page partner state variables
  const [brandPartners, setBrandPartners] = useState<BrandItem[]>([]);
  const [showAddBrandForm, setShowAddBrandForm] = useState(false);
  const [editingBrandIndex, setEditingBrandIndex] = useState<number | null>(null);

  // Brand Page form fields
  const [brandName, setBrandName] = useState('');
  const [brandCategory, setBrandCategory] = useState<'platforms' | 'govt' | 'corporates'>('platforms');
  const [brandLogoUrl, setBrandLogoUrl] = useState('');
  const [brandDescription, setBrandDescription] = useState('');
  const [logoInputType, setLogoInputType] = useState<'upload' | 'url'>('upload');
  const [isDraggingLogo, setIsDraggingLogo] = useState(false);
  const [brandLogoSize, setBrandLogoSize] = useState<'small' | 'medium' | 'large' | 'xlarge'>('medium');
  
  // Home Page Film Section states
  const [homeFilmsVisible, setHomeFilmsVisible] = useState(true);
  const [homeFilmsTitle, setHomeFilmsTitle] = useState('Films');
  const [homeFilmsShowCategories, setHomeFilmsShowCategories] = useState(true);
  const [homeFilmsLimit, setHomeFilmsLimit] = useState<'3' | '6' | '9' | '12' | 'All'>('6');
  
  // Home Banner and Video states
  const [homeHeroBgType, setHomeHeroBgType] = useState<'image' | 'video'>('video');
  const [homeHeroBgUrl, setHomeHeroBgUrl] = useState('');
  const [homeHeroBgImageUrl, setHomeHeroBgImageUrl] = useState('');
  const [homeShowreelUrl, setHomeShowreelUrl] = useState('');
  
  // Hero sliding texts
  const [homeTitle1Line1, setHomeTitle1Line1] = useState('VISUAL');
  const [homeTitle1Line2, setHomeTitle1Line2] = useState('POETRY');
  const [homeTitle2Line1, setHomeTitle2Line1] = useState('CINEMATIC');
  const [homeTitle2Line2, setHomeTitle2Line2] = useState('WIZARDRY');
  const [homeTitle3Line1, setHomeTitle3Line1] = useState('DIGITAL');
  const [homeTitle3Line2, setHomeTitle3Line2] = useState('RENAISSANCE');

  // Film catalogue states
  const [films, setFilms] = useState<any[]>([]);
  const [showAddFilmForm, setShowAddFilmForm] = useState(false);
  const [editingFilmIndex, setEditingFilmIndex] = useState<number | null>(null);
  
  // Film form hooks
  const [filmTitle, setFilmTitle] = useState('');
  const [filmCategory, setFilmCategory] = useState('Branded Content');
  const [filmImg, setFilmImg] = useState('');
  const [filmVideo, setFilmVideo] = useState('');
  const [filmFrameType, setFilmFrameType] = useState<string>('auto');

  // Carousel management states
  const [teamMembers, setTeamMembers] = useState<TeamMember[]>([]);
  const [isEditing, setIsEditing] = useState<number | null>(null); // Member ID being edited
  const [showAddForm, setShowAddForm] = useState(false);
  
  // Form fields
  const [name, setName] = useState('');
  const [role, setRole] = useState('');
  const [mediaUrl, setMediaUrl] = useState('');
  const [mediaType, setMediaType] = useState<'image' | 'video'>('image');

  // Orbiting Frame management states
  const [orbitImages, setOrbitImages] = useState<any[]>([]);
  const [showAddOrbitForm, setShowAddOrbitForm] = useState(false);
  const [orbitInputUrl, setOrbitInputUrl] = useState('');
  const [orbitInputType, setOrbitInputType] = useState<'image' | 'video'>('image');
  const [editingOrbitIndex, setEditingOrbitIndex] = useState<number | null>(null);
  const [orbitEditUrl, setOrbitEditUrl] = useState('');
  const [orbitEditType, setOrbitEditType] = useState<'image' | 'video'>('image');

  // Paragraph Frame management states
  const [paragraphFrames, setParagraphFrames] = useState<ParagraphFrameItem[]>([]);

  // Verticals management states
  const [verticalsList, setVerticalsList] = useState<VerticalItem[]>([]);

  // Client/Brand management states
  const [clients, setClients] = useState<ClientItem[]>([]);
  const [showAddClientForm, setShowAddClientForm] = useState(false);
  const [editingClientIndex, setEditingClientIndex] = useState<number | null>(null);

  // Client form fields
  const [clientName, setClientName] = useState('');
  const [clientColor, setClientColor] = useState('#FFFFFF');
  const [clientSize, setClientSize] = useState<'small' | 'medium' | 'large' | 'xlarge' | 'extralarge'>('medium');
  const [clientLogoUrl, setClientLogoUrl] = useState('');
  const [clientLayer, setClientLayer] = useState<1 | 2 | 3>(1);

  const saveClientsToStorage = (updatedClients: ClientItem[]) => {
    localStorage.setItem('dc_clients', JSON.stringify(updatedClients));
    const { clients: syncedClients, brands: syncedBrands } = normalizeAndSyncData();
    setClients(syncedClients);
    setBrandPartners(syncedBrands);
  };

  const handleAddFieldClient = (e: React.FormEvent) => {
    e.preventDefault();
    if (!clientName.trim()) return;

    const newClient: ClientItem = {
      id: Date.now().toString(),
      name: clientName.trim(),
      color: clientColor.trim() || '#FFFFFF',
      size: clientSize,
      logoUrl: clientLogoUrl.trim(),
      layer: clientLayer
    };

    const updated = [newClient, ...clients];
    saveClientsToStorage(updated);

    // reset form
    setClientName('');
    setClientColor('#FFFFFF');
    setClientSize('medium');
    setClientLogoUrl('');
    setClientLayer(1);
    setShowAddClientForm(false);
  };

  const handleUpdateFieldClient = (e: React.FormEvent) => {
    e.preventDefault();
    if (editingClientIndex === null || !clientName.trim()) return;

    const updated = [...clients];
    updated[editingClientIndex] = {
      ...updated[editingClientIndex],
      name: clientName.trim(),
      color: clientColor.trim() || '#FFFFFF',
      size: clientSize,
      logoUrl: clientLogoUrl.trim(),
      layer: clientLayer
    };

    saveClientsToStorage(updated);

    // reset Form
    setClientName('');
    setClientColor('#FFFFFF');
    setClientSize('medium');
    setClientLogoUrl('');
    setClientLayer(1);
    setEditingClientIndex(null);
  };

  const handleEditClientClick = (index: number) => {
    const client = clients[index];
    setClientName(client.name);
    setClientColor(client.color || '#FFFFFF');
    setClientSize((client.size as any) || 'medium');
    setClientLogoUrl(client.logoUrl || '');
    setClientLayer(client.layer ? (Number(client.layer) as 1 | 2 | 3) : 1);
    setEditingClientIndex(index);
    setShowAddClientForm(false);
  };

  const handleDeleteClient = (index: number) => {
    const targetName = clients[index]?.name;
    if (targetName && window.confirm(`Are you sure you want to remove ${targetName}?`)) {
      const updatedClients = clients.filter((_, i) => i !== index);
      const updatedBrands = brandPartners.filter(b => !isSimilarName(b.name, targetName));

      localStorage.setItem('dc_clients', JSON.stringify(updatedClients));
      localStorage.setItem('dc_brand_partners', JSON.stringify(updatedBrands));

      const { clients: syncedClients, brands: syncedBrands } = normalizeAndSyncData();
      setClients(syncedClients);
      setBrandPartners(syncedBrands);
    }
  };

  const handleMoveClient = (index: number, direction: 'up' | 'down') => {
    const updated = [...clients];
    const targetIndex = direction === 'up' ? index - 1 : index + 1;
    if (targetIndex < 0 || targetIndex >= updated.length) return;

    const temp = updated[index];
    updated[index] = updated[targetIndex];
    updated[targetIndex] = temp;

    saveClientsToStorage(updated);
  };

  const handleResetClients = () => {
    if (window.confirm("Are you sure you want to reset all clients to default values? This will erase custom brands.")) {
      saveClientsToStorage(DEFAULT_CLIENTS_LIST);
    }
  };

  const handleSyncBrandPartners = () => {
    const merged = [...clients];
    let addedCount = 0;

    for (const brand of brandPartners) {
      const normalizedBrandName = brand.name.toLowerCase().trim().replace(/\s+/g, '');
      const exists = clients.some(client => {
        const normalizedClientName = client.name.toLowerCase().trim().replace(/\s+/g, '');
        return normalizedClientName === normalizedBrandName || 
               (client.logoUrl && brand.logoUrl && client.logoUrl.trim() === brand.logoUrl.trim());
      });

      if (!exists) {
        let assignedLayer: 1 | 2 | 3 = 1;
        if (brand.category === 'platforms') {
          assignedLayer = 1;
        } else if (brand.category === 'govt') {
          assignedLayer = 2;
        } else if (brand.category === 'corporates') {
          assignedLayer = 3;
        }

        merged.push({
          id: brand.id || `brand-sync-${Date.now()}-${Math.random()}`,
          name: brand.name,
          color: '#FFFFFF',
          size: brand.logoSize || 'medium',
          logoUrl: brand.logoUrl || '',
          layer: assignedLayer
        });
        addedCount++;
      }
    }

    if (addedCount > 0) {
      saveClientsToStorage(merged);
      alert(`Synchronized successfully! Added ${addedCount} new brands from Brand Partners to Collaborators while retaining existing ones.`);
    } else {
      alert("All Brand Partners are already present in the Collaborators list!");
    }
  };

  // Brand Page partner state mutators
  const saveBrandPartners = (updated: BrandItem[]) => {
    localStorage.setItem('dc_brand_partners', JSON.stringify(updated));
    const { clients: syncedClients, brands: syncedBrands } = normalizeAndSyncData();
    setClients(syncedClients);
    setBrandPartners(syncedBrands);
  };

  const handleBrandLogoFileChange = (file: File) => {
    if (!file) return;
    if (!file.type.startsWith('image/')) {
      alert('Please upload an image file (PNG, JPG, SVG, WebP, etc.).');
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      alert('Image is too large. Please select an image under 5MB.');
      return;
    }

    const reader = new FileReader();
    reader.onload = (event) => {
      if (event.target && typeof event.target.result === 'string') {
        setBrandLogoUrl(event.target.result);
      }
    };
    reader.readAsDataURL(file);
  };

  const handleAddBrandPartner = (e: React.FormEvent) => {
    e.preventDefault();
    if (!brandName.trim()) return;

    const newBrand: BrandItem = {
      id: 'custom-' + Date.now().toString(),
      name: brandName.trim(),
      category: brandCategory,
      logoUrl: brandLogoUrl.trim(),
      description: brandDescription.trim(),
      logoSize: brandLogoSize
    };

    const updated = [newBrand, ...brandPartners];
    saveBrandPartners(updated);

    // Reset Form
    setBrandName('');
    setBrandCategory('platforms');
    setBrandLogoUrl('');
    setBrandDescription('');
    setBrandLogoSize('medium');
    setShowAddBrandForm(false);
  };

  const handleUpdateBrandPartner = (e: React.FormEvent) => {
    e.preventDefault();
    if (editingBrandIndex === null || !brandName.trim()) return;

    const updated = [...brandPartners];
    updated[editingBrandIndex] = {
      ...updated[editingBrandIndex],
      name: brandName.trim(),
      category: brandCategory,
      logoUrl: brandLogoUrl.trim(),
      description: brandDescription.trim(),
      logoSize: brandLogoSize
    };

    saveBrandPartners(updated);

    // Reset Form
    setBrandName('');
    setBrandCategory('platforms');
    setBrandLogoUrl('');
    setBrandDescription('');
    setBrandLogoSize('medium');
    setEditingBrandIndex(null);
  };

  const handleEditBrandClick = (index: number) => {
    const b = brandPartners[index];
    setBrandName(b.name);
    setBrandCategory(b.category);
    const logo = b.logoUrl || '';
    setBrandLogoUrl(logo);
    setBrandDescription(b.description || '');
    setBrandLogoSize(b.logoSize || 'medium');
    if (logo.startsWith('data:image/')) {
      setLogoInputType('upload');
    } else {
      setLogoInputType('url');
    }
    setEditingBrandIndex(index);
    setShowAddBrandForm(false);
  };

  const handleDeleteBrandPartner = (index: number) => {
    const targetName = brandPartners[index]?.name;
    if (targetName && window.confirm(`Are you sure you want to remove ${targetName} from the Brand Page?`)) {
      const updatedBrands = brandPartners.filter((_, i) => i !== index);
      const updatedClients = clients.filter(c => !isSimilarName(c.name, targetName));

      localStorage.setItem('dc_brand_partners', JSON.stringify(updatedBrands));
      localStorage.setItem('dc_clients', JSON.stringify(updatedClients));

      const { clients: syncedClients, brands: syncedBrands } = normalizeAndSyncData();
      setClients(syncedClients);
      setBrandPartners(syncedBrands);
    }
  };

  const handleMoveBrandPartner = (index: number, direction: 'up' | 'down') => {
    const updated = [...brandPartners];
    const targetIndex = direction === 'up' ? index - 1 : index + 1;
    if (targetIndex < 0 || targetIndex >= updated.length) return;

    const temp = updated[index];
    updated[index] = updated[targetIndex];
    updated[targetIndex] = temp;

    saveBrandPartners(updated);
  };

  const handleResetBrandPartners = () => {
    if (window.confirm("Are you sure you want to restore the default 50+ elite brand partners? This will clear custom brand additions.")) {
      saveBrandPartners(DEFAULT_BRAND_ITEMS);
    }
  };

  // About Page state variables
  const [aboutWord1, setAboutWord1] = useState('Dream');
  const [aboutWord2, setAboutWord2] = useState('Catchers');
  const [aboutTagline, setAboutTagline] = useState('Engineers of visual euphoria. Architects of cinematic truth.');
  const [aboutHeroBg, setAboutHeroBg] = useState('https://images.unsplash.com/photo-1533488765986-dfa2a9939acd?auto=format&fit=crop&q=80&w=2072');
  const [aboutGenesisSub, setAboutGenesisSub] = useState('The Genesis');
  const [aboutGenesisTitle, setAboutGenesisTitle] = useState('Where Magic Finds Its Form.');
  const [aboutGenesisP1, setAboutGenesisP1] = useState('Dreamcatchers started with a simple belief: that every story, no matter how small, deserves to be told with the weight of an epic.');
  const [aboutGenesisP2, setAboutGenesisP2] = useState("From our humble beginnings producing daily chat shows, we've evolved into a powerhouse creative studio that brands trust to bring their most ambitious visions to life.");
  const [aboutGenesisSub3, setAboutGenesisSub3] = useState('Our Evolution');
  const [aboutGenesisTitle3, setAboutGenesisTitle3] = useState('From Curiosity to Creation');
  const [aboutGenesisP3, setAboutGenesisP3] = useState("Having cut their teeth at some of India's leading television networks, they set out to create the kind of content they wanted to watch—fresh, engaging, and driven by curiosity. What started as a small passion project soon turned into a creative studio. Today, DC creates campaigns, films, series, branded content, for brands across the world.");

  const [aboutStat1Val, setAboutStat1Val] = useState('20+');
  const [aboutStat1Lbl, setAboutStat1Lbl] = useState('YEARS ON SET');
  const [aboutStat2Val, setAboutStat2Val] = useState('500+');
  const [aboutStat2Lbl, setAboutStat2Lbl] = useState('FILMS BORN');
  const [aboutStat3Val, setAboutStat3Val] = useState('30+');
  const [aboutStat3Lbl, setAboutStat3Lbl] = useState('CREATIVE MINDS');
  const [aboutStat4Val, setAboutStat4Val] = useState('100+');
  const [aboutStat4Lbl, setAboutStat4Lbl] = useState('GLOBAL BRANDS');

  const [aboutTeam, setAboutTeam] = useState<{name: string, role: string, img: string}[]>([]);
  const [showAddAboutTeamForm, setShowAddAboutTeamForm] = useState(false);
  const [editingAboutTeamIndex, setEditingAboutTeamIndex] = useState<number | null>(null);
  const [aboutTeamName, setAboutTeamName] = useState('');
  const [aboutTeamRole, setAboutTeamRole] = useState('');
  const [aboutTeamImg, setAboutTeamImg] = useState('');

  // Contact Page state variables
  const [contactTitleFirst, setContactTitleFirst] = useState("Let's");
  const [contactTitleOrange, setContactTitleOrange] = useState("Connect.");
  const [contactSubtitle, setContactSubtitle] = useState("Start your cinematic journey today.");
  const [contactEmail, setContactEmail] = useState(() => {
    const email = localStorage.getItem('contact_email') || "hello@dreamcatchers.tv";
    return email.toLowerCase().includes('@dreamcatchers.com') 
      ? email.replace(/@dreamcatchers\.com/gi, '@dreamcatchers.tv') 
      : email;
  });
  const [contactPhone, setContactPhone] = useState("+91 98765 43210");
  const [contactAddress, setContactAddress] = useState("820, Sector 21A, Pocket E, Sector 21E, Sector 21, Gurugram, Delhi, Haryana 122016");

  // Social media links state variables
  const [socialInstagram, setSocialInstagram] = useState('#');
  const [socialFacebook, setSocialFacebook] = useState('#');
  const [socialYoutube, setSocialYoutube] = useState('#');
  const [socialTwitter, setSocialTwitter] = useState('#');

  // Operational locations state variables
  const [locations, setLocations] = useState<OperationalLocation[]>([]);
  const [mapSavedStatus, setMapSavedStatus] = useState<string>('');

  // Load from localStorage
  useEffect(() => {
    const stored = localStorage.getItem('dream_team');
    if (stored) {
      try {
        setTeamMembers(JSON.parse(stored));
      } catch (e) {
        console.error('Error loading dream_team from LocalStorage:', e);
        setTeamMembers(DEFAULT_TEAM_MEMBERS);
      }
    } else {
      setTeamMembers(DEFAULT_TEAM_MEMBERS);
    }

    const storedOrbit = localStorage.getItem('orbit_images');
    if (storedOrbit) {
      try {
        setOrbitImages(JSON.parse(storedOrbit));
      } catch (e) {
        console.error('Error loading orbit_images from LocalStorage:', e);
        setOrbitImages(DEFAULT_ORBIT_IMAGES);
      }
    } else {
      setOrbitImages(DEFAULT_ORBIT_IMAGES);
    }

    const storedParagraphFrames = localStorage.getItem('paragraph_frames');
    if (storedParagraphFrames) {
      try {
        setParagraphFrames(JSON.parse(storedParagraphFrames));
      } catch (e) {
        console.error('Error loading paragraph_frames from LocalStorage:', e);
        setParagraphFrames(DEFAULT_PARAGRAPH_FRAMES);
      }
    } else {
      setParagraphFrames(DEFAULT_PARAGRAPH_FRAMES);
    }

    const storedVerticals = localStorage.getItem('verticals_list');
    if (storedVerticals) {
      try {
        setVerticalsList(JSON.parse(storedVerticals));
      } catch (e) {
        console.error('Error loading verticals_list from LocalStorage:', e);
        setVerticalsList(DEFAULT_VERTICALS);
      }
    } else {
      setVerticalsList(DEFAULT_VERTICALS);
    }

    const storedSlides = localStorage.getItem('cinematic_slides_list');
    if (storedSlides) {
      try {
        setSlidesList(JSON.parse(storedSlides));
      } catch (e) {
        console.error('Error loading cinematic_slides_list from LocalStorage:', e);
        setSlidesList(DEFAULT_SLIDES);
      }
    } else {
      setSlidesList(DEFAULT_SLIDES);
    }

    // Load home configs
    const savedHeroBgType = localStorage.getItem('home_hero_bg_type') || 'video';
    setHomeHeroBgType(savedHeroBgType as 'image' | 'video');

    // Load nav logo configs
    setNavLogoType((localStorage.getItem('nav_logo_type') as 'text' | 'image') || 'text');
    setNavLogoTextShort(localStorage.getItem('nav_logo_text_short') || 'DC');
    setNavLogoTextFull(localStorage.getItem('nav_logo_text_full') || 'DREAMCATCHERS');
    setNavLogoImageUrl(localStorage.getItem('nav_logo_image_url') || '');

    const savedHeroBgUrl = localStorage.getItem('home_hero_bg_url') || 'https://images.unsplash.com/photo-1492691527719-9d1e07e534b4?auto=format&fit=crop&q=80&w=2071';
    setHomeHeroBgUrl(savedHeroBgUrl);

    const savedHeroBgImageUrl = localStorage.getItem('home_hero_bg_image_url') || 'https://images.unsplash.com/photo-1492691527719-9d1e07e534b4?auto=format&fit=crop&q=80&w=2071';
    setHomeHeroBgImageUrl(savedHeroBgImageUrl);

    const savedShowreel = localStorage.getItem('home_showreel_url') || 'https://player.vimeo.com/external/371433846.sd.mp4?s=236da2f3c05414d9b9c9dc7671cd24b33b00686c&profile_id=139&oauth2_token_id=57447761';
    setHomeShowreelUrl(savedShowreel);

    setHomeTitle1Line1(localStorage.getItem('home_title1_l1') || 'VISUAL');
    setHomeTitle1Line2(localStorage.getItem('home_title1_l2') || 'POETRY');
    setHomeTitle2Line1(localStorage.getItem('home_title2_l1') || 'CINEMATIC');
    setHomeTitle2Line2(localStorage.getItem('home_title2_l2') || 'WIZARDRY');
    setHomeTitle3Line1(localStorage.getItem('home_title3_l1') || 'DIGITAL');
    setHomeTitle3Line2(localStorage.getItem('home_title3_l2') || 'RENAISSANCE');

    // Load home films configuration
    setHomeFilmsVisible(localStorage.getItem('home_films_visible') !== 'false');
    setHomeFilmsTitle(localStorage.getItem('home_films_title') || 'Films');
    setHomeFilmsShowCategories(localStorage.getItem('home_films_show_cats') !== 'false');
    setHomeFilmsLimit((localStorage.getItem('home_films_limit') as any) || '6');

    // Load films catalogue
    const storedFilms = localStorage.getItem('dc_films');
    if (storedFilms) {
      try {
        setFilms(JSON.parse(storedFilms));
      } catch (e) {
        console.error('Error loading films:', e);
        setFilms(DEFAULT_FILMS_LIST);
      }
    } else {
      setFilms(DEFAULT_FILMS_LIST);
    }

    // Load and sync clients and brand partners with deduplication and standardization
    const { clients: syncedClients, brands: syncedBrands } = normalizeAndSyncData();
    setClients(syncedClients);
    setBrandPartners(syncedBrands);

    // Load About configs
    setAboutWord1(localStorage.getItem('about_bgt_word1') || 'Dream');
    setAboutWord2(localStorage.getItem('about_bgt_word2') || 'Catchers');
    setAboutTagline(localStorage.getItem('about_bgt_tagline') || 'Engineers of visual euphoria. Architects of cinematic truth.');
    setAboutHeroBg(localStorage.getItem('about_hero_bg') || 'https://images.unsplash.com/photo-1533488765986-dfa2a9939acd?auto=format&fit=crop&q=80&w=2072');
    setAboutGenesisSub(localStorage.getItem('about_genesis_sub') || 'The Genesis');
    setAboutGenesisTitle(localStorage.getItem('about_genesis_title') || 'Where Magic Finds Its Form.');
    setAboutGenesisP1(localStorage.getItem('about_genesis_p1') || 'Dreamcatchers started with a simple belief: that every story, no matter how small, deserves to be told with the weight of an epic.');
    setAboutGenesisP2(localStorage.getItem('about_genesis_p2') || "From our humble beginnings producing daily chat shows, we've evolved into a powerhouse creative studio that brands trust to bring their most ambitious visions to life.");
    setAboutGenesisSub3(localStorage.getItem('about_genesis_sub3') || 'Our Evolution');
    setAboutGenesisTitle3(localStorage.getItem('about_genesis_title3') || 'From Curiosity to Creation');
    setAboutGenesisP3(localStorage.getItem('about_genesis_p3') || "Having cut their teeth at some of India's leading television networks, they set out to create the kind of content they wanted to watch—fresh, engaging, and driven by curiosity. What started as a small passion project soon turned into a creative studio. Today, DC creates campaigns, films, series, branded content, for brands across the world.");

    setAboutStat1Val(localStorage.getItem('about_stat1_val') || '20+');
    setAboutStat1Lbl(localStorage.getItem('about_stat1_lbl') || 'YEARS ON SET');
    setAboutStat2Val(localStorage.getItem('about_stat2_val') || '500+');
    setAboutStat2Lbl(localStorage.getItem('about_stat2_lbl') || 'FILMS BORN');
    setAboutStat3Val(localStorage.getItem('about_stat3_val') || '30+');
    setAboutStat3Lbl(localStorage.getItem('about_stat3_lbl') || 'CREATIVE MINDS');
    setAboutStat4Val(localStorage.getItem('about_stat4_val') || '100+');
    setAboutStat4Lbl(localStorage.getItem('about_stat4_lbl') || 'GLOBAL BRANDS');

    const storedAboutTeam = localStorage.getItem('about_team');
    if (storedAboutTeam) {
      try {
        setAboutTeam(JSON.parse(storedAboutTeam));
      } catch (e) {
        console.error('Error loading about team:', e);
      }
    } else {
      setAboutTeam([
        { name: 'FARZEEN KHAN', role: 'EXECUTIVE PRODUCER', img: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&q=80&w=400' },
        { name: 'AASHOOTOSH PANDEY', role: 'EXECUTIVE PRODUCER (DELHI)', img: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&q=80&w=400' },
        { name: 'RAHUL DEROZE', role: 'CREATIVE PRODUCER', img: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&q=80&w=400' },
        { name: 'PRITI RAI', role: 'POST PRODUCTION SUPERVISOR', img: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&q=80&w=400' },
        { name: 'YATENDRA NEGI', role: 'ACCOUNTS HEAD', img: 'https://images.unsplash.com/photo-1519085360753-af0119f7cbe7?auto=format&fit=crop&q=80&w=400' },
        { name: 'DIVYA AGRAWAL', role: 'HUMAN RESOURCE MANAGER', img: 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?auto=format&fit=crop&q=80&w=400' },
        { name: 'KARPU SWAMI', role: 'FINANCE CONTROLLER', img: 'https://images.unsplash.com/photo-1560250097-0b93528c311a?auto=format&fit=crop&q=80&w=400' },
        { name: 'NAMAN KOHLI', role: 'SENIOR ASSOCIATE PRODUCER', img: 'https://images.unsplash.com/photo-1519345182560-3f2917c472ef?auto=format&fit=crop&q=80&w=400' },
        { name: 'RAMIN YAZESHANI', role: 'ASSOCIATE PRODUCER', img: 'https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?auto=format&fit=crop&q=80&w=400' },
      ]);
    }

    // Load Contact configs
    setContactTitleFirst(localStorage.getItem('contact_title_first') || "Let's");
    setContactTitleOrange(localStorage.getItem('contact_title_orange') || "Connect.");
    setContactSubtitle(localStorage.getItem('contact_subtitle') || "Start your cinematic journey today.");
    let email = localStorage.getItem('contact_email') || "hello@dreamcatchers.tv";
    if (email.toLowerCase().includes('@dreamcatchers.com')) {
      email = email.replace(/@dreamcatchers\.com/gi, '@dreamcatchers.tv');
      localStorage.setItem('contact_email', email);
    }
    setContactEmail(email);
    setContactPhone(localStorage.getItem('contact_phone') || "+91 98765 43210");
    setContactAddress(localStorage.getItem('contact_address') || "820, Sector 21A, Pocket E, Sector 21E, Sector 21, Gurugram, Delhi, Haryana 122016");

    // Load Social configs
    setSocialInstagram(localStorage.getItem('social_instagram') || '#');
    setSocialFacebook(localStorage.getItem('social_facebook') || '#');
    setSocialYoutube(localStorage.getItem('social_youtube') || '#');
    setSocialTwitter(localStorage.getItem('social_twitter') || '#');

    // Load Operational Locations
    const storedLocs = localStorage.getItem('dc_locations');
    if (storedLocs) {
      try {
        const parsed = JSON.parse(storedLocs) as OperationalLocation[];
        const merged = parsed.map(loc => {
          const def = DEFAULT_LOCATIONS.find(d => d.id === loc.id);
          if (def) {
            return {
              ...def,
              ...loc,
              path: loc.path || def.path,
              textY: typeof loc.textY !== 'undefined' ? loc.textY : def.textY,
              fontSize: typeof loc.fontSize !== 'undefined' ? loc.fontSize : def.fontSize,
              city: loc.city || def.city,
              localText: loc.localText || def.localText
            };
          }
          return loc;
        });
        setLocations(merged);
      } catch (e) {
        console.error('Error loading dc_locations in Admin:', e);
        setLocations(DEFAULT_LOCATIONS);
      }
    } else {
      setLocations(DEFAULT_LOCATIONS);
    }
  }, []);

  // Save to localStorage
  const saveTeam = (updated: TeamMember[]) => {
    setTeamMembers(updated);
    localStorage.setItem('dream_team', JSON.stringify(updated));
    // Trigger custom state sync event
    window.dispatchEvent(new Event('storage_updated_team'));
  };

  const saveOrbitImages = (updated: string[]) => {
    setOrbitImages(updated);
    localStorage.setItem('orbit_images', JSON.stringify(updated));
    // Trigger custom state sync event for orbit frame
    window.dispatchEvent(new Event('storage_updated_orbit'));
  };

  const saveLocations = (updated: OperationalLocation[]) => {
    setLocations(updated);
    localStorage.setItem('dc_locations', JSON.stringify(updated));
    window.dispatchEvent(new Event('storage_updated_locations'));
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-black">
        <div className="w-12 h-12 border-4 border-orange-500 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (!user || !isAdmin) {
    return <Navigate to="/" replace />;
  }

  // Action: Add new member
  const handleAddNew = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name || !mediaUrl) return;
    
    const newId = teamMembers.length > 0 ? Math.max(...teamMembers.map(m => m.id)) + 1 : 1;
    const newMember: TeamMember = {
      id: newId,
      name,
      role: role || 'Team Associate',
      image: mediaUrl,
      mediaType
    };

    const updated = [...teamMembers, newMember];
    saveTeam(updated);
    
    // Reset form
    setName('');
    setRole('');
    setMediaUrl('');
    setMediaType('image');
    setShowAddForm(false);
  };

  // Action: Edit existing member
  const handleStartEdit = (m: TeamMember) => {
    setIsEditing(m.id);
    setName(m.name);
    setRole(m.role);
    setMediaUrl(m.image);
    setMediaType(m.mediaType || 'image');
    setShowAddForm(false); // Close add form if open
  };

  // Action: Save edits
  const handleSaveEdit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name || !mediaUrl || isEditing === null) return;

    const updated = teamMembers.map(m => m.id === isEditing ? {
      ...m,
      name,
      role,
      image: mediaUrl,
      mediaType
    } : m);

    saveTeam(updated);
    
    // Reset editing
    setIsEditing(null);
    setName('');
    setRole('');
    setMediaUrl('');
    setMediaType('image');
  };

  // Cancel form / edit for both Carousel and Orbit
  const handleCancel = () => {
    setIsEditing(null);
    setShowAddForm(false);
    setName('');
    setRole('');
    setMediaUrl('');
    setMediaType('image');

    // Orbit cancels
    setEditingOrbitIndex(null);
    setShowAddOrbitForm(false);
    setOrbitInputUrl('');
    setOrbitEditUrl('');
    setOrbitInputType('image');
    setOrbitEditType('image');
  };

  // --- Orbit Frame Action Methods ---
  const handleAddOrbitImage = (e: React.FormEvent) => {
    e.preventDefault();
    if (!orbitInputUrl.trim()) return;
    const newItem = {
      url: orbitInputUrl.trim(),
      type: orbitInputType
    };
    const updated = [...orbitImages, newItem];
    saveOrbitImages(updated);
    setOrbitInputUrl('');
    setOrbitInputType('image');
    setShowAddOrbitForm(false);
  };

  const handleStartEditOrbit = (index: number) => {
    setEditingOrbitIndex(index);
    const item = orbitImages[index];
    if (typeof item === 'string') {
      setOrbitEditUrl(item);
      const lower = item.toLowerCase();
      const isVideo = lower.endsWith('.mp4') || lower.endsWith('.mov') || lower.endsWith('.webm') || (lower.includes('drive.google.com/file/d/') && (lower.includes('video') || lower.includes('playback') || lower.includes('mp4')));
      setOrbitEditType(isVideo ? 'video' : 'image');
    } else if (item && typeof item === 'object') {
      setOrbitEditUrl(item.url || '');
      setOrbitEditType(item.type === 'video' ? 'video' : 'image');
    } else {
      setOrbitEditUrl('');
      setOrbitEditType('image');
    }
    setShowAddOrbitForm(false); // Close add form if open
  };

  const handleSaveEditOrbit = (e: React.FormEvent) => {
    e.preventDefault();
    if (editingOrbitIndex === null || !orbitEditUrl.trim()) return;
    const updated = [...orbitImages];
    updated[editingOrbitIndex] = {
      url: orbitEditUrl.trim(),
      type: orbitEditType
    };
    saveOrbitImages(updated);
    setEditingOrbitIndex(null);
    setOrbitEditUrl('');
    setOrbitEditType('image');
  };

  const handleDeleteOrbit = (index: number) => {
    if (confirm('Are you sure you want to delete this orbiting circle frame image?')) {
      const updated = orbitImages.filter((_, i) => i !== index);
      saveOrbitImages(updated);
    }
  };

  const handleMoveOrbitUp = (index: number) => {
    if (index === 0) return;
    const updated = [...orbitImages];
    const prev = updated[index - 1];
    updated[index - 1] = updated[index];
    updated[index] = prev;
    saveOrbitImages(updated);
  };

  const handleMoveOrbitDown = (index: number) => {
    if (index === orbitImages.length - 1) return;
    const updated = [...orbitImages];
    const next = updated[index + 1];
    updated[index + 1] = updated[index];
    updated[index] = next;
    saveOrbitImages(updated);
  };

  const handleResetOrbitDefaults = () => {
    if (confirm('Confirm reset to original 4 default rotating circle frame images? All additions will be cleared.')) {
      saveOrbitImages(DEFAULT_ORBIT_IMAGES);
    }
  };

  // Action: Delete member
  const handleDelete = (id: number) => {
    if (confirm('Are you sure you want to delete this frame item?')) {
      const updated = teamMembers.filter(m => m.id !== id);
      saveTeam(updated);
    }
  };

  // Action: Move Up
  const handleMoveUp = (index: number) => {
    if (index === 0) return;
    const updated = [...teamMembers];
    const prev = updated[index - 1];
    updated[index - 1] = updated[index];
    updated[index] = prev;
    saveTeam(updated);
  };

  // Action: Move Down
  const handleMoveDown = (index: number) => {
    if (index === teamMembers.length - 1) return;
    const updated = [...teamMembers];
    const next = updated[index + 1];
    updated[index + 1] = updated[index];
    updated[index] = next;
    saveTeam(updated);
  };

  // Action: Reset defaults
  const handleResetDefaults = () => {
    if (confirm('Confirm reset to original 4 default frames (Dream Team)? All additions will be cleared.')) {
      saveTeam(DEFAULT_TEAM_MEMBERS);
    }
  };

  // --- Navigation Logo handlers ---
  const handleSaveNavLogo = (e: React.FormEvent) => {
    e.preventDefault();
    const finalUrl = transformGoogleDriveUrl(navLogoImageUrl);
    localStorage.setItem('nav_logo_type', navLogoType);
    localStorage.setItem('nav_logo_text_short', navLogoTextShort);
    localStorage.setItem('nav_logo_text_full', navLogoTextFull);
    localStorage.setItem('nav_logo_image_url', finalUrl);
    setNavLogoImageUrl(finalUrl);

    // Dispatch update notification
    window.dispatchEvent(new Event('storage_updated_home_hero')); // Trigger SiteSync to push to Firestore
    alert('Navigation logo settings saved & synced successfully!');
  };

  const handleResetNavLogo = () => {
    if (confirm('Are you sure you want to restore the default logo settings?')) {
      setNavLogoType('text');
      setNavLogoTextShort('DC');
      setNavLogoTextFull('DREAMCATCHERS');
      setNavLogoImageUrl('');

      localStorage.removeItem('nav_logo_type');
      localStorage.removeItem('nav_logo_text_short');
      localStorage.removeItem('nav_logo_text_full');
      localStorage.removeItem('nav_logo_image_url');

      // Dispatch update notification
      window.dispatchEvent(new Event('storage_updated_home_hero')); // Trigger SiteSync to push to Firestore
      alert('Navigation logo settings reset successfully!');
    }
  };

  // --- Paragraph Frame handlers ---
  const handleSaveParagraphFrames = (e: React.FormEvent) => {
    e.preventDefault();
    // Pre-transform google drive urls inside before saving
    const transformedList = paragraphFrames.map(f => ({
      ...f,
      url: transformGoogleDriveUrl(f.url, f.type)
    }));
    
    setParagraphFrames(transformedList);
    localStorage.setItem('paragraph_frames', JSON.stringify(transformedList));
    
    // Dispatch events to notify main App component immediately
    window.dispatchEvent(new Event('storage_updated_paragraph_frames'));
    window.dispatchEvent(new Event('storage'));
    
    alert('Word-Level Frames saved & synced successfully!');
  };

  const handleResetParagraphFrames = () => {
    if (confirm('Are you sure you want to restore the default word-level frames?')) {
      setParagraphFrames(DEFAULT_PARAGRAPH_FRAMES);
      localStorage.setItem('paragraph_frames', JSON.stringify(DEFAULT_PARAGRAPH_FRAMES));
      
      window.dispatchEvent(new Event('storage_updated_paragraph_frames'));
      window.dispatchEvent(new Event('storage'));
      
      alert('Word-Level Frames restored to defaults successfully!');
    }
  };

  const handleUpdateFrameField = (id: string, field: 'type' | 'url', value: string) => {
    setParagraphFrames(prev => prev.map(f => {
      if (f.id === id) {
        return { ...f, [field]: value };
      }
      return f;
    }));
  };

  // --- Verticals handlers ---
  const handleSaveVerticals = (e: React.FormEvent) => {
    e.preventDefault();
    const transformedList = verticalsList.map(v => ({
      ...v,
      url: transformGoogleDriveUrl(v.url, v.type)
    }));
    
    setVerticalsList(transformedList);
    localStorage.setItem('verticals_list', JSON.stringify(transformedList));
    
    window.dispatchEvent(new Event('storage_updated_verticals'));
    window.dispatchEvent(new Event('storage'));
    
    alert('Enterprise Verticals config saved & synced successfully!');
  };

  const handleResetVerticals = () => {
    if (confirm('Are you sure you want to restore the default Verticals configuration?')) {
      setVerticalsList(DEFAULT_VERTICALS);
      localStorage.setItem('verticals_list', JSON.stringify(DEFAULT_VERTICALS));
      
      window.dispatchEvent(new Event('storage_updated_verticals'));
      window.dispatchEvent(new Event('storage'));
      
      alert('Enterprise Verticals restored to defaults successfully!');
    }
  };

  const handleUpdateVerticalField = (id: string, field: 'type' | 'url' | 'title' | 'subtitle' | 'description', value: string) => {
    setVerticalsList(prev => prev.map(v => {
      if (v.id === id) {
        return { ...v, [field]: value };
      }
      return v;
    }));
  };

  // --- Slideshow handlers ---
  const handleSaveSlideshow = (e: React.FormEvent) => {
    e.preventDefault();
    const transformedList = slidesList.map(s => ({
      ...s,
      imageUrl: transformGoogleDriveUrl(s.imageUrl, 'image')
    }));
    
    setSlidesList(transformedList);
    localStorage.setItem('cinematic_slides_list', JSON.stringify(transformedList));
    
    window.dispatchEvent(new Event('storage_updated_cinematic_slides'));
    window.dispatchEvent(new Event('storage'));
    
    alert('Cinematic Slideshow config saved & synced successfully!');
  };

  const handleResetSlideshow = () => {
    if (confirm('Are you sure you want to restore the default 9 Cinematic Slides?')) {
      setSlidesList(DEFAULT_SLIDES);
      localStorage.setItem('cinematic_slides_list', JSON.stringify(DEFAULT_SLIDES));
      
      window.dispatchEvent(new Event('storage_updated_cinematic_slides'));
      window.dispatchEvent(new Event('storage'));
      
      alert('Cinematic Slides restored to defaults successfully!');
    }
  };

  const handleUpdateSlideField = (id: string, field: 'title' | 'description' | 'imageUrl', value: string) => {
    setSlidesList(prev => prev.map(s => {
      if (s.id === id) {
        return { ...s, [field]: value };
      }
      return s;
    }));
  };

  // --- Home Hero persistence handlers ---
  const handleSaveHomeHero = (e: React.FormEvent) => {
    e.preventDefault();
    localStorage.setItem('home_hero_bg_type', homeHeroBgType);
    localStorage.setItem('home_hero_bg_url', homeHeroBgUrl);
    localStorage.setItem('home_hero_bg_image_url', homeHeroBgImageUrl);
    localStorage.setItem('home_showreel_url', homeShowreelUrl);

    localStorage.setItem('home_title1_l1', homeTitle1Line1);
    localStorage.setItem('home_title1_l2', homeTitle1Line2);
    localStorage.setItem('home_title2_l1', homeTitle2Line1);
    localStorage.setItem('home_title2_l2', homeTitle2Line2);
    localStorage.setItem('home_title3_l1', homeTitle3Line1);
    localStorage.setItem('home_title3_l2', homeTitle3Line2);

    // Dispatch update notification
    window.dispatchEvent(new Event('storage_updated_home_hero'));
    alert('Home hero configuration committed successfully!');
  };

  const handleResetHomeHero = () => {
    if (confirm('Are you sure you want to restore default video and titles?')) {
      setHomeHeroBgType('video');
      setHomeHeroBgUrl('https://images.unsplash.com/photo-1492691527719-9d1e07e534b4?auto=format&fit=crop&q=80&w=2071');
      setHomeHeroBgImageUrl('https://images.unsplash.com/photo-1492691527719-9d1e07e534b4?auto=format&fit=crop&q=80&w=2071');
      setHomeShowreelUrl('https://player.vimeo.com/external/371433846.sd.mp4?s=236da2f3c05414d9b9c9dc7671cd24b33b00686c&profile_id=139&oauth2_token_id=57447761');
      setHomeTitle1Line1('VISUAL');
      setHomeTitle1Line2('POETRY');
      setHomeTitle2Line1('CINEMATIC');
      setHomeTitle2Line2('WIZARDRY');
      setHomeTitle3Line1('DIGITAL');
      setHomeTitle3Line2('RENAISSANCE');

      localStorage.removeItem('home_hero_bg_type');
      localStorage.removeItem('home_hero_bg_url');
      localStorage.removeItem('home_hero_bg_image_url');
      localStorage.removeItem('home_showreel_url');
      localStorage.removeItem('home_title1_l1');
      localStorage.removeItem('home_title1_l2');
      localStorage.removeItem('home_title2_l1');
      localStorage.removeItem('home_title2_l2');
      localStorage.removeItem('home_title3_l1');
      localStorage.removeItem('home_title3_l2');

      window.dispatchEvent(new Event('storage_updated_home_hero'));
    }
  };

  // --- Home Films persistence handlers ---
  const handleSaveHomeFilms = (e: React.FormEvent) => {
    e.preventDefault();
    localStorage.setItem('home_films_visible', String(homeFilmsVisible));
    localStorage.setItem('home_films_title', homeFilmsTitle);
    localStorage.setItem('home_films_show_cats', String(homeFilmsShowCategories));
    localStorage.setItem('home_films_limit', homeFilmsLimit);

    window.dispatchEvent(new Event('storage_updated_home_films'));
    alert('Home page films section configuration updated successfully!');
  };

  const handleResetHomeFilms = () => {
    if (confirm('Are you sure you want to restore default films section layout settings?')) {
      setHomeFilmsVisible(true);
      setHomeFilmsTitle('Films');
      setHomeFilmsShowCategories(true);
      setHomeFilmsLimit('6');

      localStorage.removeItem('home_films_visible');
      localStorage.removeItem('home_films_title');
      localStorage.removeItem('home_films_show_cats');
      localStorage.removeItem('home_films_limit');

      window.dispatchEvent(new Event('storage_updated_home_films'));
    }
  };

  // --- About Us persistence handlers ---
  const handleSaveAboutDetails = (e: React.FormEvent) => {
    e.preventDefault();
    localStorage.setItem('about_bgt_word1', aboutWord1);
    localStorage.setItem('about_bgt_word2', aboutWord2);
    localStorage.setItem('about_bgt_tagline', aboutTagline);
    localStorage.setItem('about_hero_bg', aboutHeroBg);
    localStorage.setItem('about_genesis_sub', aboutGenesisSub);
    localStorage.setItem('about_genesis_title', aboutGenesisTitle);
    localStorage.setItem('about_genesis_p1', aboutGenesisP1);
    localStorage.setItem('about_genesis_p2', aboutGenesisP2);
    localStorage.setItem('about_genesis_sub3', aboutGenesisSub3);
    localStorage.setItem('about_genesis_title3', aboutGenesisTitle3);
    localStorage.setItem('about_genesis_p3', aboutGenesisP3);

    localStorage.setItem('about_stat1_val', aboutStat1Val);
    localStorage.setItem('about_stat1_lbl', aboutStat1Lbl);
    localStorage.setItem('about_stat2_val', aboutStat2Val);
    localStorage.setItem('about_stat2_lbl', aboutStat2Lbl);
    localStorage.setItem('about_stat3_val', aboutStat3Val);
    localStorage.setItem('about_stat3_lbl', aboutStat3Lbl);
    localStorage.setItem('about_stat4_val', aboutStat4Val);
    localStorage.setItem('about_stat4_lbl', aboutStat4Lbl);

    window.dispatchEvent(new Event('storage_updated_about'));
    alert('About Us page content successfully committed!');
  };

  const saveAboutTeam = (updated: any[]) => {
    setAboutTeam(updated);
    localStorage.setItem('about_team', JSON.stringify(updated));
    window.dispatchEvent(new Event('storage_updated_about'));
  };

  const handleAddAboutTeamMember = (e: React.FormEvent) => {
    e.preventDefault();
    if (!aboutTeamName.trim() || !aboutTeamImg.trim()) return;
    const newMember = {
      name: aboutTeamName.trim(),
      role: '',
      img: aboutTeamImg.trim()
    };
    saveAboutTeam([...aboutTeam, newMember]);
    setAboutTeamName('');
    setAboutTeamRole('');
    setAboutTeamImg('');
    setShowAddAboutTeamForm(false);
  };

  const handleStartEditAboutTeam = (index: number) => {
    setEditingAboutTeamIndex(index);
    const member = aboutTeam[index];
    setAboutTeamName(member.name);
    setAboutTeamRole('');
    setAboutTeamImg(member.img);
    setShowAddAboutTeamForm(false);
  };

  const handleSaveEditAboutTeam = (e: React.FormEvent) => {
    e.preventDefault();
    if (editingAboutTeamIndex === null || !aboutTeamName.trim() || !aboutTeamImg.trim()) return;
    const updated = [...aboutTeam];
    updated[editingAboutTeamIndex] = {
      name: aboutTeamName.trim(),
      role: '',
      img: aboutTeamImg.trim()
    };
    saveAboutTeam(updated);
    setEditingAboutTeamIndex(null);
    setAboutTeamName('');
    setAboutTeamRole('');
    setAboutTeamImg('');
  };

  const handleDeleteAboutTeam = (index: number) => {
    if (confirm('Are you sure you want to delete this team member?')) {
      const updated = aboutTeam.filter((_, i) => i !== index);
      saveAboutTeam(updated);
    }
  };

  const handleMoveAboutTeamUp = (index: number) => {
    if (index === 0) return;
    const updated = [...aboutTeam];
    const prev = updated[index - 1];
    updated[index - 1] = updated[index];
    updated[index] = prev;
    saveAboutTeam(updated);
  };

  const handleMoveAboutTeamDown = (index: number) => {
    if (index === aboutTeam.length - 1) return;
    const updated = [...aboutTeam];
    const next = updated[index + 1];
    updated[index + 1] = updated[index];
    updated[index] = next;
    saveAboutTeam(updated);
  };

  const handleResetAboutDetails = () => {
    if (confirm('Reset About Page configurations to default values? Data will be overwritten.')) {
      setAboutWord1('Dream');
      setAboutWord2('Catchers');
      setAboutTagline('Engineers of visual euphoria. Architects of cinematic truth.');
      setAboutHeroBg('https://images.unsplash.com/photo-1533488765986-dfa2a9939acd?auto=format&fit=crop&q=80&w=2072');
      setAboutGenesisSub('The Genesis');
      setAboutGenesisTitle('Where Magic Finds Its Form.');
      setAboutGenesisP1('Dreamcatchers started with a simple belief: that every story, no matter how small, deserves to be told with the weight of an epic.');
      setAboutGenesisP2("From our humble beginnings producing daily chat shows, we've evolved into a powerhouse creative studio that brands trust to bring their most ambitious visions to life.");
      setAboutGenesisSub3('Our Evolution');
      setAboutGenesisTitle3('From Curiosity to Creation');
      setAboutGenesisP3("Having cut their teeth at some of India's leading television networks, they set out to create the kind of content they wanted to watch—fresh, engaging, and driven by curiosity. What started as a small passion project soon turned into a creative studio. Today, DC creates campaigns, films, series, branded content, for brands across the world.");

      setAboutStat1Val('20+');
      setAboutStat1Lbl('YEARS ON SET');
      setAboutStat2Val('500+');
      setAboutStat2Lbl('FILMS BORN');
      setAboutStat3Val('30+');
      setAboutStat3Lbl('CREATIVE MINDS');
      setAboutStat4Val('100+');
      setAboutStat4Lbl('GLOBAL BRANDS');

      localStorage.removeItem('about_bgt_word1');
      localStorage.removeItem('about_bgt_word2');
      localStorage.removeItem('about_bgt_tagline');
      localStorage.removeItem('about_hero_bg');
      localStorage.removeItem('about_genesis_sub');
      localStorage.removeItem('about_genesis_title');
      localStorage.removeItem('about_genesis_p1');
      localStorage.removeItem('about_genesis_p2');
      localStorage.removeItem('about_genesis_sub3');
      localStorage.removeItem('about_genesis_title3');
      localStorage.removeItem('about_genesis_p3');
      localStorage.removeItem('about_stat1_val');
      localStorage.removeItem('about_stat1_lbl');
      localStorage.removeItem('about_stat2_val');
      localStorage.removeItem('about_stat2_lbl');
      localStorage.removeItem('about_stat3_val');
      localStorage.removeItem('about_stat3_lbl');
      localStorage.removeItem('about_stat4_val');
      localStorage.removeItem('about_stat4_lbl');

      const defaultTeam = [
        { name: 'FARZEEN KHAN', role: 'EXECUTIVE PRODUCER', img: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&q=80&w=400' },
        { name: 'AASHOOTOSH PANDEY', role: 'EXECUTIVE PRODUCER (DELHI)', img: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&q=80&w=400' },
        { name: 'RAHUL DEROZE', role: 'CREATIVE PRODUCER', img: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&q=80&w=400' },
        { name: 'PRITI RAI', role: 'POST PRODUCTION SUPERVISOR', img: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&q=80&w=400' },
        { name: 'YATENDRA NEGI', role: 'ACCOUNTS HEAD', img: 'https://images.unsplash.com/photo-1519085360753-af0119f7cbe7?auto=format&fit=crop&q=80&w=400' },
        { name: 'DIVYA AGRAWAL', role: 'HUMAN RESOURCE MANAGER', img: 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?auto=format&fit=crop&q=80&w=400' },
        { name: 'KARPU SWAMI', role: 'FINANCE CONTROLLER', img: 'https://images.unsplash.com/photo-1560250097-0b93528c311a?auto=format&fit=crop&q=80&w=400' },
        { name: 'NAMAN KOHLI', role: 'SENIOR ASSOCIATE PRODUCER', img: 'https://images.unsplash.com/photo-1519345182560-3f2917c472ef?auto=format&fit=crop&q=80&w=400' },
        { name: 'RAMIN YAZESHANI', role: 'ASSOCIATE PRODUCER', img: 'https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?auto=format&fit=crop&q=80&w=400' },
      ];
      saveAboutTeam(defaultTeam);
      window.dispatchEvent(new Event('storage_updated_about'));
    }
  };

  // --- Contact Us persistence handlers ---
  const handleSaveContactDetails = (e: React.FormEvent) => {
    e.preventDefault();
    localStorage.setItem('contact_title_first', contactTitleFirst);
    localStorage.setItem('contact_title_orange', contactTitleOrange);
    localStorage.setItem('contact_subtitle', contactSubtitle);
    localStorage.setItem('contact_email', contactEmail);
    localStorage.setItem('contact_phone', contactPhone);
    localStorage.setItem('contact_address', contactAddress);

    // Save socials
    localStorage.setItem('social_instagram', socialInstagram);
    localStorage.setItem('social_facebook', socialFacebook);
    localStorage.setItem('social_youtube', socialYoutube);
    localStorage.setItem('social_twitter', socialTwitter);

    window.dispatchEvent(new Event('storage_updated_contact'));
    window.dispatchEvent(new Event('storage_updated_socials'));
    alert('Contact & Social Media info successfully saved!');
  };

  const handleResetContactDetails = () => {
    if (confirm('Reset contact cards and social media links to default info values?')) {
      setContactTitleFirst("Let's");
      setContactTitleOrange("Connect.");
      setContactSubtitle("Start your cinematic journey today.");
      setContactEmail("hello@dreamcatchers.tv");
      setContactPhone("+91 98765 43210");
      setContactAddress("820, Sector 21A, Pocket E, Sector 21E, Sector 21, Gurugram, Delhi, Haryana 122016");

      setSocialInstagram('#');
      setSocialFacebook('#');
      setSocialYoutube('#');
      setSocialTwitter('#');

      localStorage.removeItem('contact_title_first');
      localStorage.removeItem('contact_title_orange');
      localStorage.removeItem('contact_subtitle');
      localStorage.removeItem('contact_email');
      localStorage.removeItem('contact_phone');
      localStorage.removeItem('contact_address');

      localStorage.removeItem('social_instagram');
      localStorage.removeItem('social_facebook');
      localStorage.removeItem('social_youtube');
      localStorage.removeItem('social_twitter');

      window.dispatchEvent(new Event('storage_updated_contact'));
      window.dispatchEvent(new Event('storage_updated_socials'));
    }
  };

  // --- Film Catalogue handlers ---
  const saveFilms = (updated: any[]) => {
    setFilms(updated);
    localStorage.setItem('dc_films', JSON.stringify(updated));
    window.dispatchEvent(new Event('storage_updated_films'));
  };

  const handleAddFilm = (e: React.FormEvent) => {
    e.preventDefault();
    if (!filmTitle || !filmImg) return;
    const newFilm = {
      id: String(films.length > 0 ? Math.max(...films.map(f => parseInt(f.id, 10) || 0)) + 1 : 1),
      title: filmTitle,
      category: filmCategory,
      img: filmImg,
      video: filmVideo || 'https://player.vimeo.com/external/371433846.sd.mp4?s=236da2f3c05414d9b9c9dc7671cd24b33b00686c&profile_id=139&oauth2_token_id=57447761',
      frameType: filmFrameType || 'auto'
    };
    saveFilms([...films, newFilm]);
    setFilmTitle('');
    setFilmImg('');
    setFilmVideo('');
    setFilmFrameType('auto');
    setShowAddFilmForm(false);
  };

  const handleStartEditFilm = (index: number) => {
    setEditingFilmIndex(index);
    const film = films[index];
    setFilmTitle(film.title);
    setFilmCategory(film.category || 'OTT');
    setFilmImg(film.img);
    setFilmVideo(film.video || '');
    setFilmFrameType(film.frameType || 'auto');
    setShowAddFilmForm(false);
  };

  const handleSaveEditFilm = (e: React.FormEvent) => {
    e.preventDefault();
    if (editingFilmIndex === null || !filmTitle || !filmImg) return;
    const updated = [...films];
    updated[editingFilmIndex] = {
      ...updated[editingFilmIndex],
      title: filmTitle,
      category: filmCategory,
      img: filmImg,
      video: filmVideo || 'https://player.vimeo.com/external/371433846.sd.mp4?s=236da2f3c05414d9b9c9dc7671cd24b33b00686c&profile_id=139&oauth2_token_id=57447761',
      frameType: filmFrameType || 'auto'
    };
    saveFilms(updated);
    setEditingFilmIndex(null);
    setFilmTitle('');
    setFilmImg('');
    setFilmVideo('');
    setFilmFrameType('auto');
  };

  const handleDeleteFilm = (index: number) => {
    if (confirm('Are you sure you want to delete this film listing?')) {
      const updated = films.filter((_, i) => i !== index);
      saveFilms(updated);
    }
  };

  const handleMoveFilmUp = (index: number) => {
    if (index === 0) return;
    const updated = [...films];
    const prev = updated[index - 1];
    updated[index - 1] = updated[index];
    updated[index] = prev;
    saveFilms(updated);
  };

  const handleMoveFilmDown = (index: number) => {
    if (index === films.length - 1) return;
    const updated = [...films];
    const next = updated[index + 1];
    updated[index + 1] = updated[index];
    updated[index] = next;
    saveFilms(updated);
  };

  const handleResetFilmsDefaults = () => {
    if (confirm('Are you sure you want to reset the film library to the original default listings? All custom items will be cleared.')) {
      saveFilms(DEFAULT_FILMS_LIST);
    }
  };

  return (
    <div className="min-h-screen bg-black text-white font-sans flex transition-all">
      {/* Sidebar */}
      <aside className="fixed left-0 top-0 bottom-0 w-64 bg-zinc-900 border-r border-white/5 hidden md:flex flex-col p-6 z-30">
        <div className="flex items-center gap-3 mb-10">
          <span className="text-3xl font-black italic tracking-tighter text-orange-500 cursor-default select-none">DC</span>
          <span className="text-xl font-bold tracking-widest cursor-default select-none">ADMIN</span>
        </div>

        <nav className="flex-1 space-y-2">
          <Link to="/" className="flex items-center gap-3 p-3 rounded-xl hover:bg-white/5 transition-colors text-white/60 hover:text-white font-sans">
            <Home size={20} />
            <span>View Site</span>
          </Link>
          <button 
            type="button"
            onClick={() => { setActiveTab('categories'); handleCancel(); }}
            className={`w-full flex items-center gap-3 p-3 rounded-xl transition-all font-bold font-sans ${activeTab === 'categories' ? 'bg-orange-500/10 text-orange-500' : 'text-white/60 hover:text-white hover:bg-white/5'}`}
          >
            <Layout size={20} />
            <span>Control Panel</span>
          </button>
          <button 
            type="button"
            onClick={() => { setActiveTab('home_manage'); handleCancel(); }}
            className={`w-full flex items-center gap-3 p-3 rounded-xl transition-all font-bold font-sans ${activeTab === 'home_manage' || activeTab === 'team' || activeTab === 'orbit' ? 'bg-orange-500/10 text-orange-500' : 'text-white/60 hover:text-white hover:bg-white/5'}`}
          >
            <Home size={20} className="text-orange-500" />
            <span>Home Page Content</span>
          </button>
          <button 
            type="button"
            onClick={() => { setActiveTab('film_manage'); handleCancel(); }}
            className={`w-full flex items-center gap-3 p-3 rounded-xl transition-all font-bold font-sans ${activeTab === 'film_manage' ? 'bg-orange-500/10 text-orange-500' : 'text-white/60 hover:text-white hover:bg-white/5'}`}
          >
            <FileVideo size={20} className="text-orange-500" />
            <span>Film Page Content</span>
          </button>
          <button 
            type="button"
            onClick={() => { setActiveTab('about_manage'); handleCancel(); }}
            className={`w-full flex items-center gap-3 p-3 rounded-xl transition-all font-bold font-sans ${activeTab === 'about_manage' ? 'bg-orange-500/10 text-orange-500' : 'text-white/60 hover:text-white hover:bg-white/5'}`}
          >
            <BookOpen size={20} className="text-orange-500" />
            <span>About Us Content</span>
          </button>
          <button 
            type="button"
            onClick={() => { setActiveTab('contact_manage'); handleCancel(); }}
            className={`w-full flex items-center gap-3 p-3 rounded-xl transition-all font-bold font-sans ${activeTab === 'contact_manage' ? 'bg-orange-500/10 text-orange-500' : 'text-white/60 hover:text-white hover:bg-white/5'}`}
          >
            <Share2 size={20} className="text-orange-500" />
            <span>Contact & Socials</span>
          </button>
          <button 
            type="button"
            onClick={() => { setActiveTab('brand_manage'); handleCancel(); }}
            className={`w-full flex items-center gap-3 p-3 rounded-xl transition-all font-bold font-sans ${activeTab === 'brand_manage' ? 'bg-orange-500/10 text-orange-500' : 'text-white/60 hover:text-white hover:bg-white/5'}`}
          >
            <Sparkles size={20} className="text-orange-500" />
            <span>Brand Page Partners</span>
          </button>
        </nav>

        <button 
          onClick={logout}
          className="flex items-center gap-3 p-3 rounded-xl text-red-400 hover:bg-red-400/10 transition-colors mt-auto"
        >
          <LogOut size={20} />
          <span>Logout</span>
        </button>
      </aside>

      {/* Main Content Container */}
      <div className="flex-1 min-h-screen md:ml-64 p-4 md:p-8 bg-[#0a0a0a]">
        <header className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-8 md:mb-12">
          <div>
            <h1 className="text-3xl md:text-4xl font-black italic uppercase tracking-tighter flex items-center gap-3 text-white">
              {activeTab === 'categories' ? (
                <span>🎛️ CONTROL CENTER</span>
              ) : activeTab === 'home_manage' ? (
                <span>🏠 HOME PAGE SECTIONS</span>
              ) : activeTab === 'film_manage' ? (
                <span>🎬 FILM CATALOGUE</span>
              ) : activeTab === 'team' ? (
                <span>👥 DREAM TEAM CAROUSEL</span>
              ) : activeTab === 'orbit' ? (
                <span>🌀 ROTATING ORBIT STARS</span>
              ) : activeTab === 'about_manage' ? (
                <span>📖 ABOUT US CONTENT</span>
              ) : activeTab === 'contact_manage' ? (
                <span>📬 CONTACT & SOCIAL MEDIA</span>
              ) : (
                <span>✨ BRAND PAGE PARTNER LOGOS</span>
              )}
            </h1>
            <p className="text-white/40 mt-1 text-sm font-medium tracking-tight">
              {activeTab === 'categories' 
                ? `Welcome to the studio control deck, ${user.displayName || 'Admin'}.` 
                : activeTab === 'home_manage' 
                  ? 'Manage home video loops, background covers, scrolling text headers, team sliders, and backgrounds.' 
                  : activeTab === 'film_manage'
                    ? 'Manage cinematic film posts, posters, categories and playable background trailers.'
                    : activeTab === 'team'
                      ? 'Manage the Dream Team carousel frames.'
                      : activeTab === 'orbit'
                        ? 'Manage the rotating 3D orbit stars.'
                        : activeTab === 'about_manage'
                          ? 'Manage about details: hero text, background, genesis paragraphs, counters, and team profiles.'
                          : activeTab === 'contact_manage'
                            ? 'Manage contact details (address, email, phone) and your social media profile URLs.'
                            : 'Manage the Brand Page partners list: add, order, edit descriptions and live vector/image logos.'}
            </p>
          </div>
          
          <div className="flex items-center gap-4">
            <button
              type="button"
              onClick={async () => {
                try {
                  await pushLocalConfigsToFirestore();
                  alert("Live Database Synced! Your custom changes are now live for all visitors worldwide on the live site! 🌎✨");
                } catch (err: any) {
                  alert("Failed to sync: " + err.message);
                }
              }}
              className="flex items-center gap-2 px-4 py-2 border border-orange-500/20 hover:border-orange-500 rounded-full bg-orange-500/10 text-orange-500 hover:bg-orange-500 hover:text-black transition-all cursor-pointer font-bold select-none text-xs"
              title="Push all your local page settings and additions instantly to the live site!"
            >
              <RefreshCw size={14} className="animate-spin duration-300" />
              <span>Publish to Live Site ✅</span>
            </button>
            
            <div className="text-right hidden sm:block">
              <p className="text-sm font-bold text-white">{user.email}</p>
              <p className="text-xs font-medium text-orange-500 uppercase tracking-widest font-mono">Verified Studio Admin</p>
            </div>
            {user.photoURL ? (
              <img src={user.photoURL} className="w-12 h-12 rounded-full border border-white/10" alt="avatar" />
            ) : (
              <div className="w-12 h-12 bg-orange-500 text-white rounded-full flex items-center justify-center font-black">
                A
              </div>
            )}
          </div>
        </header>

        {/* 1. SELECT A CATEGORY (TABS DASHBOARD) */}
        {activeTab === 'categories' && (
          <div className="space-y-8 animate-fade-in font-sans">
            <div className="mb-4">
              <h2 className="text-sm font-black text-orange-500 uppercase tracking-[0.3em] mb-1">DREAMCATCHERS</h2>
              <h1 className="text-4xl font-black italic uppercase tracking-tighter text-white">CONTROL PANEL</h1>
              <p className="text-sm text-white/40 mt-2 max-w-xl">
                Select a category to manage its dynamic sections, custom background banners, interactive carousel frames, revolving star layers, and cinematic film archives.
              </p>
            </div>

            {/* Category Cards Grid (Styled exactly like the sample image) */}
            <div className="grid grid-cols-1 xl:grid-cols-2 gap-8 pt-4 text-white">
              {/* Card 1: HOME PAGE */}
              <motion.div
                whileHover={{ scale: 1.02, y: -4 }}
                transition={{ duration: 0.3 }}
                onClick={() => { setActiveTab('home_manage'); handleCancel(); }}
                className="bg-zinc-950 font-sans border border-white/5 rounded-[2.5rem] p-8 flex flex-col justify-between min-h-[300px] hover:border-orange-500/40 hover:bg-zinc-900/10 transition-all cursor-pointer group relative overflow-hidden"
              >
                {/* Background watermark */}
                <div className="absolute right-[-10%] bottom-[-10%] opacity-[0.03] group-hover:opacity-[0.07] group-hover:scale-110 transition-all duration-700 pointer-events-none">
                  <Layout size={260} className="text-white" />
                </div>

                <div className="flex justify-between items-start">
                  <div className="w-14 h-14 rounded-2xl bg-orange-500/10 flex items-center justify-center border border-orange-500/20 group-hover:bg-orange-500 group-hover:text-black transition-all">
                    <Home size={28} className="text-orange-500 group-hover:text-black transition-all" />
                  </div>
                  <span className="text-[10px] uppercase font-mono tracking-widest text-white/30 bg-white/5 px-3 py-1 rounded-full border border-white/5">
                    Live Portal
                  </span>
                </div>

                <div>
                  <h3 className="text-3xl font-black italic uppercase tracking-tight text-white mb-2 font-sans">
                    HOME PAGE
                  </h3>
                  <p className="text-xs text-white/40 font-semibold tracking-wider uppercase mb-8">
                    HERO BANNERS, COVERS, CAROUSELS, ORBITS & VIDEO SHOWREELS
                  </p>
                  
                  <div className="flex items-center gap-2 text-orange-500 group-hover:text-orange-400 font-extrabold uppercase text-xs tracking-widest transition-all">
                    <span>MANAGE CONTENT</span>
                    <ChevronRight size={14} className="group-hover:translate-x-1 transition-transform" />
                  </div>
                </div>
              </motion.div>

              {/* Card 2: FILM PAGE */}
              <motion.div
                whileHover={{ scale: 1.02, y: -4 }}
                transition={{ duration: 0.3 }}
                onClick={() => { setActiveTab('film_manage'); handleCancel(); }}
                className="bg-zinc-950 font-sans border border-white/5 rounded-[2.5rem] p-8 flex flex-col justify-between min-h-[300px] hover:border-orange-500/40 hover:bg-zinc-900/10 transition-all cursor-pointer group relative overflow-hidden"
              >
                {/* Background watermark */}
                <div className="absolute right-[-10%] bottom-[-10%] opacity-[0.03] group-hover:opacity-[0.07] group-hover:scale-110 transition-all duration-700 pointer-events-none">
                  <FileVideo size={260} className="text-white" />
                </div>

                <div className="flex justify-between items-start">
                  <div className="w-14 h-14 rounded-2xl bg-orange-500/10 flex items-center justify-center border border-orange-500/20 group-hover:bg-orange-500 group-hover:text-black transition-all">
                    <FileVideo size={28} className="text-orange-500 group-hover:text-black transition-all" />
                  </div>
                  <span className="text-[10px] uppercase font-mono tracking-widest text-white/30 bg-white/5 px-3 py-1 rounded-full border border-white/5">
                    Cinematic Catalogue
                  </span>
                </div>

                <div>
                  <h3 className="text-3xl font-black italic uppercase tracking-tight text-white mb-2 font-sans">
                    FILM PAGE
                  </h3>
                  <p className="text-xs text-white/40 font-semibold tracking-wider uppercase mb-8">
                    CINEMATIC FILMS, MUSIC VIDEOS, OTT SERIES & AD POSTERS
                  </p>
                  
                  <div className="flex items-center gap-2 text-orange-500 group-hover:text-orange-400 font-extrabold uppercase text-xs tracking-widest transition-all">
                    <span>MANAGE CONTENT</span>
                    <ChevronRight size={14} className="group-hover:translate-x-1 transition-transform" />
                  </div>
                </div>
              </motion.div>

              {/* Card 3: ABOUT US PAGE */}
              <motion.div
                whileHover={{ scale: 1.02, y: -4 }}
                transition={{ duration: 0.3 }}
                onClick={() => { setActiveTab('about_manage'); handleCancel(); }}
                className="bg-zinc-950 font-sans border border-white/5 rounded-[2.5rem] p-8 flex flex-col justify-between min-h-[300px] hover:border-orange-500/40 hover:bg-zinc-900/10 transition-all cursor-pointer group relative overflow-hidden"
              >
                {/* Background watermark */}
                <div className="absolute right-[-10%] bottom-[-10%] opacity-[0.03] group-hover:opacity-[0.07] group-hover:scale-110 transition-all duration-700 pointer-events-none">
                  <BookOpen size={260} className="text-white" />
                </div>

                <div className="flex justify-between items-start">
                  <div className="w-14 h-14 rounded-2xl bg-orange-500/10 flex items-center justify-center border border-orange-500/20 group-hover:bg-orange-500 group-hover:text-black transition-all">
                    <BookOpen size={28} className="text-orange-500 group-hover:text-black transition-all" />
                  </div>
                  <span className="text-[10px] uppercase font-mono tracking-widest text-white/30 bg-white/5 px-3 py-1 rounded-full border border-white/5">
                    Studio Story
                  </span>
                </div>

                <div>
                  <h3 className="text-3xl font-black italic uppercase tracking-tight text-white mb-2 font-sans">
                    ABOUT US PAGE
                  </h3>
                  <p className="text-xs text-white/40 font-semibold tracking-wider uppercase mb-8">
                    GENESIS HISTORY, STAT METRICS, HERO COVERS & TRIBE PROFILES
                  </p>
                  
                  <div className="flex items-center gap-2 text-orange-500 group-hover:text-orange-400 font-extrabold uppercase text-xs tracking-widest transition-all">
                    <span>MANAGE CONTENT</span>
                    <ChevronRight size={14} className="group-hover:translate-x-1 transition-transform" />
                  </div>
                </div>
              </motion.div>

              {/* Card 4: CONTACT & SOCIALS */}
              <motion.div
                whileHover={{ scale: 1.02, y: -4 }}
                transition={{ duration: 0.3 }}
                onClick={() => { setActiveTab('contact_manage'); handleCancel(); }}
                className="bg-zinc-950 font-sans border border-white/5 rounded-[2.5rem] p-8 flex flex-col justify-between min-h-[300px] hover:border-orange-500/40 hover:bg-zinc-900/10 transition-all cursor-pointer group relative overflow-hidden"
              >
                {/* Background watermark */}
                <div className="absolute right-[-10%] bottom-[-10%] opacity-[0.03] group-hover:opacity-[0.07] group-hover:scale-110 transition-all duration-700 pointer-events-none">
                  <Share2 size={260} className="text-white" />
                </div>

                <div className="flex justify-between items-start">
                  <div className="w-14 h-14 rounded-2xl bg-orange-500/10 flex items-center justify-center border border-orange-500/20 group-hover:bg-orange-500 group-hover:text-black transition-all">
                    <Share2 size={28} className="text-orange-500 group-hover:text-black transition-all" />
                  </div>
                  <span className="text-[10px] uppercase font-mono tracking-widest text-white/30 bg-white/5 px-3 py-1 rounded-full border border-white/5">
                    Direct Channels
                  </span>
                </div>

                <div>
                  <h3 className="text-3xl font-black italic uppercase tracking-tight text-white mb-2 font-sans">
                    CONTACT & SOCIALS
                  </h3>
                  <p className="text-xs text-white/40 font-semibold tracking-wider uppercase mb-8">
                    CONNECT HEADINGS, DIRECT CHANNELS, PHONE CODES & SOCIAL MEDIA LINKS
                  </p>
                  
                  <div className="flex items-center gap-2 text-orange-500 group-hover:text-orange-400 font-extrabold uppercase text-xs tracking-widest transition-all">
                    <span>MANAGE CONTENT</span>
                    <ChevronRight size={14} className="group-hover:translate-x-1 transition-transform" />
                  </div>
                </div>
              </motion.div>

              {/* Card 5: BRAND PAGE PARTNERS */}
              <motion.div
                whileHover={{ scale: 1.02, y: -4 }}
                transition={{ duration: 0.3 }}
                onClick={() => { setActiveTab('brand_manage'); handleCancel(); }}
                className="bg-zinc-950 font-sans border border-white/5 rounded-[2.5rem] p-8 flex flex-col justify-between min-h-[300px] hover:border-orange-500/40 hover:bg-zinc-900/10 transition-all cursor-pointer group relative overflow-hidden xl:col-span-2"
              >
                {/* Background watermark */}
                <div className="absolute right-[-10%] bottom-[-10%] opacity-[0.03] group-hover:opacity-[0.07] group-hover:scale-110 transition-all duration-700 pointer-events-none">
                  <Sparkles size={260} className="text-white" />
                </div>

                <div className="flex justify-between items-start">
                  <div className="w-14 h-14 rounded-2xl bg-orange-500/10 flex items-center justify-center border border-orange-500/20 group-hover:bg-orange-500 group-hover:text-black transition-all">
                    <Sparkles size={28} className="text-orange-500 group-hover:text-black transition-all" />
                  </div>
                  <span className="text-[10px] uppercase font-mono tracking-widest text-white/30 bg-white/5 px-3 py-1 rounded-full border border-white/5">
                    Elite Partners
                  </span>
                </div>

                <div>
                  <h3 className="text-3xl font-black italic uppercase tracking-tight text-white mb-2 font-sans">
                    BRAND PAGE PARTNERS
                  </h3>
                  <p className="text-xs text-white/40 font-semibold tracking-wider uppercase mb-8">
                    MANAGE ELITE BRANDS, GOVERNMENT DEPARTMENTS, CORPORATES & BROADCAST NETWORK LOGOS
                  </p>
                  
                  <div className="flex items-center gap-2 text-orange-500 group-hover:text-orange-400 font-extrabold uppercase text-xs tracking-widest transition-all font-sans">
                    <span>MANAGE CONTENT</span>
                    <ChevronRight size={14} className="group-hover:translate-x-1 transition-transform" />
                  </div>
                </div>
              </motion.div>
            </div>
          </div>
        )}

        {/* 2. HOME PAGE MANAGE BLOCK */}
        {activeTab === 'home_manage' && (
          <div className="space-y-8 animate-fade-in text-white font-sans">
            {/* Top Back Controls */}
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-zinc-900/40 p-4 rounded-3xl border border-white/5">
              <button 
                onClick={() => setActiveTab('categories')}
                className="flex items-center gap-2 px-5 py-2.5 rounded-full border border-white/10 hover:border-white/30 text-xs font-black uppercase tracking-wider text-white bg-black hover:text-orange-500 transition-all font-sans"
              >
                <ChevronLeft size={16} />
                <span>BACK TO CONTROL CENTER</span>
              </button>
              <div className="flex flex-wrap gap-2">
                <button 
                  onClick={() => setHomeSubTab('hero')}
                  className={`px-5 py-2.5 rounded-full text-xs font-black uppercase tracking-wider transition-all ${homeSubTab === 'hero' ? 'bg-orange-500 text-white' : 'bg-black border border-white/10 text-white/40 hover:text-white'}`}
                >
                  1. Hero Banner & Showreel
                </button>
                <button 
                  onClick={() => setHomeSubTab('team')}
                  className={`px-5 py-2.5 rounded-full text-xs font-black uppercase tracking-wider transition-all ${homeSubTab === 'team' ? 'bg-orange-500 text-white' : 'bg-black border border-white/10 text-white/40 hover:text-white'}`}
                >
                  2. Carousel Members
                </button>
                <button 
                  onClick={() => setHomeSubTab('orbit')}
                  className={`px-5 py-2.5 rounded-full text-xs font-black uppercase tracking-wider transition-all ${homeSubTab === 'orbit' ? 'bg-orange-500 text-white' : 'bg-black border border-white/10 text-white/40 hover:text-white'}`}
                >
                  3. Orbit Stars
                </button>
                <button 
                  onClick={() => setHomeSubTab('films')}
                  className={`px-5 py-2.5 rounded-full text-xs font-black uppercase tracking-wider transition-all ${homeSubTab === 'films' ? 'bg-orange-500 text-white' : 'bg-black border border-white/10 text-white/40 hover:text-white'}`}
                >
                  4. Films Section Content
                </button>
                <button 
                  onClick={() => setHomeSubTab('clients')}
                  className={`px-5 py-2.5 rounded-full text-xs font-black uppercase tracking-wider transition-all ${homeSubTab === 'clients' ? 'bg-orange-500 text-white' : 'bg-black border border-white/10 text-white/40 hover:text-white'}`}
                >
                  5. Collaborator/Brand Logos
                </button>
                <button 
                  onClick={() => setHomeSubTab('logo')}
                  className={`px-5 py-2.5 rounded-full text-xs font-black uppercase tracking-wider transition-all ${homeSubTab === 'logo' ? 'bg-orange-500 text-white' : 'bg-black border border-white/10 text-white/40 hover:text-white'}`}
                >
                  6. Navbar brand Logo
                </button>
                <button 
                  onClick={() => setHomeSubTab('paragraph_frames')}
                  className={`px-5 py-2.5 rounded-full text-xs font-black uppercase tracking-wider transition-all ${homeSubTab === 'paragraph_frames' ? 'bg-orange-500 text-white' : 'bg-black border border-white/10 text-white/40 hover:text-white'}`}
                >
                  7. Word-Level Frames
                </button>
                <button 
                  onClick={() => setHomeSubTab('verticals')}
                  className={`px-5 py-2.5 rounded-full text-xs font-black uppercase tracking-wider transition-all ${homeSubTab === 'verticals' ? 'bg-orange-500 text-white' : 'bg-black border border-white/10 text-white/40 hover:text-white'}`}
                >
                  8. Enterprise Verticals
                </button>
                <button 
                  onClick={() => setHomeSubTab('slides')}
                  className={`px-5 py-2.5 rounded-full text-xs font-black uppercase tracking-wider transition-all ${homeSubTab === 'slides' ? 'bg-orange-500 text-white' : 'bg-black border border-white/10 text-white/40 hover:text-white'}`}
                >
                  9. Cinematic Slideshow
                </button>
              </div>
            </div>

            {/* A. Hero sub-tab content */}
            {homeSubTab === 'hero' && (
              <motion.div 
                initial={{ opacity: 0 }} 
                animate={{ opacity: 1 }}
                className="bg-zinc-900 border border-white/5 p-6 md:p-10 rounded-[2.5rem] space-y-8 text-white font-sans"
              >
                <div>
                  <h2 className="text-2xl font-black italic text-white uppercase mb-2">HERO & SHOWREEL CONFIGURE</h2>
                  <p className="text-xs text-white/40 font-semibold tracking-wider uppercase">Set your primary entrance presentation. Swap background videos or banners instantly.</p>
                </div>

                <form onSubmit={handleSaveHomeHero} className="space-y-6">
                  {/* Banner Type select */}
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-6 font-sans">
                    <div>
                      <label className="block text-xs uppercase tracking-widest text-zinc-400 font-black mb-2">Backdrop Type</label>
                      <div className="flex gap-2 font-sans">
                        <button
                          type="button"
                          onClick={() => setHomeHeroBgType('image')}
                          className={`flex-1 py-3 text-xs font-black uppercase rounded-xl border flex items-center justify-center gap-2 transition-all ${homeHeroBgType === 'image' ? 'bg-orange-500/10 border-orange-500 text-orange-500' : 'bg-black border-white/10 text-white/60 hover:text-white'}`}
                        >
                          <ImageIcon size={14} />
                          <span>IMAGE COVER</span>
                        </button>
                        <button
                          type="button"
                          onClick={() => setHomeHeroBgType('video')}
                          className={`flex-1 py-3 text-xs font-black uppercase rounded-xl border flex items-center justify-center gap-2 transition-all ${homeHeroBgType === 'video' ? 'bg-orange-500/10 border-orange-500 text-orange-500' : 'bg-black border-white/10 text-white/60 hover:text-white font-sans'}`}
                        >
                          <FileVideo size={14} />
                          <span>VIDEO LOOP</span>
                        </button>
                      </div>
                    </div>

                    <div className="md:col-span-2 font-sans">
                      <label className="block text-xs uppercase tracking-widest text-zinc-400 font-black mb-2 font-sans">
                        {homeHeroBgType === 'image' ? 'Hero Background Image url' : 'Hero Background Looping Video URL (.mp4)'}
                      </label>
                      <input 
                        type="text" 
                        required
                        value={homeHeroBgUrl}
                        onChange={(e) => setHomeHeroBgUrl(e.target.value)}
                        placeholder="Paste premium Unsplash link or direct .mp4/webm video loop URL"
                        className="w-full bg-black border border-white/10 focus:border-orange-500 outline-none rounded-xl px-4 py-3 text-sm text-white"
                      />
                    </div>
                  </div>

                  {/* Fallback Image URL specifically for mobile background cover */}
                  <div className="bg-black/30 p-6 rounded-3xl border border-white/5 font-sans space-y-3">
                    <label className="block text-xs uppercase tracking-widest text-zinc-400 font-black flex items-center gap-2">
                      <ImageIcon size={14} className="text-orange-500 animate-pulse" />
                      <span>Fallback/Mobile Background Image URL</span>
                    </label>
                    <input 
                      type="text" 
                      required
                      value={homeHeroBgImageUrl}
                      onChange={(e) => setHomeHeroBgImageUrl(e.target.value)}
                      placeholder="Paste premium Unsplash link or other high-resolution image URL"
                      className="w-full bg-black border border-white/10 focus:border-orange-500 outline-none rounded-xl px-4 py-3 text-sm text-white"
                    />
                    <p className="text-[10px] text-white/40 font-medium uppercase tracking-wider">
                      Note: On mobile browsers/screens, video backgrounds are replaced with this clean high-resolution image automatically to guarantee perfect sizing, high performance, and zero flickering.
                    </p>
                  </div>

                  {/* Showreel Config */}
                  <div className="bg-black/50 p-6 rounded-3xl border border-white/5 font-sans">
                    <label className="block text-xs uppercase tracking-widest text-orange-500 font-black mb-2 flex items-center gap-2">
                      <Play size={12} className="fill-current text-orange-500" />
                      <span>PRIMARY VIDEO SHOWREEL URL</span>
                    </label>
                    <input 
                      type="text" 
                      required
                      value={homeShowreelUrl}
                      onChange={(e) => setHomeShowreelUrl(e.target.value)}
                      placeholder="e.g. paste vimeo sd loop or custom mp4 / youtube watch link"
                      className="w-full bg-black border border-white/10 focus:border-orange-500 outline-none rounded-xl px-4 py-3 text-sm text-white font-medium"
                    />
                    <p className="text-[10px] text-white/30 mt-2 font-medium">
                      Plays in an elegant cinematic lightbox dialog overlay when viewers click the main "Play Showreel" button.
                    </p>
                  </div>

                  {/* Text slider titles */}
                  <div>
                    <h3 className="text-xs uppercase tracking-[0.2em] font-black text-white/60 mb-4 border-b border-white/5 pb-2">
                      CINEMATIC TEXT SEQUENCER CONTENT
                    </h3>
                    
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6 font-sans">
                      <div className="bg-black/30 p-4 rounded-2xl border border-white/5">
                        <span className="text-[10px] font-bold text-orange-500/80 uppercase block mb-3">SLIDE LOOP 1</span>
                        <div className="space-y-3">
                          <input 
                            type="text" value={homeTitle1Line1} onChange={(e) => setHomeTitle1Line1(e.target.value)}
                            placeholder="Line 1" className="w-full bg-black border border-white/10 rounded-lg p-2 text-xs text-white uppercase font-black"
                          />
                          <input 
                            type="text" value={homeTitle1Line2} onChange={(e) => setHomeTitle1Line2(e.target.value)}
                            placeholder="Line 2" className="w-full bg-black border border-white/10 rounded-lg p-2 text-xs text-white uppercase font-black"
                          />
                        </div>
                      </div>

                      <div className="bg-black/30 p-4 rounded-2xl border border-white/5">
                        <span className="text-[10px] font-bold text-orange-500/80 uppercase block mb-3">SLIDE LOOP 2</span>
                        <div className="space-y-3">
                          <input 
                            type="text" value={homeTitle2Line1} onChange={(e) => setHomeTitle2Line1(e.target.value)}
                            placeholder="Line 1" className="w-full bg-black border border-white/10 rounded-lg p-2 text-xs text-white uppercase font-black"
                          />
                          <input 
                            type="text" value={homeTitle2Line2} onChange={(e) => setHomeTitle2Line2(e.target.value)}
                            placeholder="Line 2" className="w-full bg-black border border-white/10 rounded-lg p-2 text-xs text-white uppercase font-black"
                          />
                        </div>
                      </div>

                      <div className="bg-black/30 p-4 rounded-2xl border border-white/5">
                        <span className="text-[10px] font-bold text-orange-500/80 uppercase block mb-3">SLIDE LOOP 3</span>
                        <div className="space-y-3">
                          <input 
                            type="text" value={homeTitle3Line1} onChange={(e) => setHomeTitle3Line1(e.target.value)}
                            placeholder="Line 1" className="w-full bg-black border border-white/10 rounded-lg p-2 text-xs text-white uppercase font-black"
                          />
                          <input 
                            type="text" value={homeTitle3Line2} onChange={(e) => setHomeTitle3Line2(e.target.value)}
                            placeholder="Line 2" className="w-full bg-black border border-white/10 rounded-lg p-2 text-xs text-white uppercase font-black"
                          />
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Form control actions */}
                  <div className="flex gap-3 pt-4 border-t border-white/5 flex-wrap font-sans">
                    <button
                      type="submit"
                      className="px-8 py-3.5 bg-orange-500 hover:bg-orange-600 font-extrabold uppercase tracking-widest text-[11px] rounded-full transition-all active:scale-95"
                    >
                      COMMIT CHANGES TO PORTAL
                    </button>
                    <button
                      type="button"
                      onClick={handleResetHomeHero}
                      className="px-6 py-3.5 bg-zinc-950 hover:bg-zinc-900 border border-white/10 font-extrabold uppercase tracking-widest text-[11px] rounded-full transition-all text-white/50 hover:text-white"
                    >
                      RESET DEFAULT HERO
                    </button>
                  </div>
                </form>
              </motion.div>
            )}

            {/* B. Team sub-tab content */}
            {homeSubTab === 'team' && (
              <motion.div 
                initial={{ opacity: 0 }} 
                animate={{ opacity: 1 }}
                className="bg-zinc-900/30 p-4 rounded-[2.5rem] border border-white/5 space-y-6"
              >
                <div className="p-6 font-sans">
                  <h2 className="text-xl font-bold uppercase italic text-orange-500 mb-1">DREAM TEAM CAROUSEL</h2>
                  <p className="text-xs text-white/40">These dynamic team members populate the rotating cover sliders on the home page.</p>
                </div>
                
                {/* Redirecting to the normal layout tab */}
                <div className="flex flex-col items-center justify-center text-center py-12 bg-black/40 rounded-[2rem] p-6 border border-white/5 font-sans">
                  <p className="text-sm text-white/60 mb-6 max-w-sm font-medium">
                    You can manage style, frames, pictures, and video loops of individual carousel blocks.
                  </p>
                  <button 
                    onClick={() => { setActiveTab('team'); }}
                    className="px-6 py-3 bg-orange-500 hover:bg-orange-600 font-extrabold text-xs uppercase tracking-widest text-white rounded-full transition-all"
                  >
                    LAUNCH CAROUSEL BUILDER
                  </button>
                </div>
              </motion.div>
            )}

            {/* C. Orbit sub-tab content */}
            {homeSubTab === 'orbit' && (
              <motion.div 
                initial={{ opacity: 0 }} 
                animate={{ opacity: 1 }}
                className="bg-zinc-900/30 p-4 rounded-[2.5rem] border border-white/5 space-y-6"
              >
                <div className="p-6 font-sans">
                  <h2 className="text-xl font-bold uppercase italic text-orange-500 mb-1">ROTATING ORBIT STAR LAYERS</h2>
                  <p className="text-xs text-white/40">Manage revolving graphic frame circles layered at the edge of screen layouts.</p>
                </div>

                <div className="flex flex-col items-center justify-center text-center py-12 bg-black/40 rounded-[2rem] p-6 border border-white/5 font-sans">
                  <p className="text-sm text-white/60 mb-6 max-w-sm font-medium">
                    You can manage orbit sequencer elements directly via the specialized geometric sequencer tools.
                  </p>
                  <button 
                    onClick={() => { setActiveTab('orbit'); }}
                    className="px-6 py-3 bg-orange-500 hover:bg-orange-600 font-extrabold text-xs uppercase tracking-widest text-white rounded-full transition-all flex items-center gap-2"
                  >
                    <span>LAUNCH ORBIT SEQUENCER</span>
                  </button>
                </div>
              </motion.div>
            )}

            {/* D. Films Section Content sub-tab */}
            {homeSubTab === 'films' && (
              <motion.div 
                initial={{ opacity: 0 }} 
                animate={{ opacity: 1 }}
                className="bg-zinc-900 border border-white/5 p-6 md:p-10 rounded-[2.5rem] space-y-8 text-white font-sans"
              >
                <div>
                  <h2 className="text-2xl font-black italic text-white uppercase mb-2">🎬 HOME PAGE FILMS CONTENT</h2>
                  <p className="text-xs text-white/40 font-semibold tracking-wider uppercase">
                    Configure the showcase section alignment, active categories, limits, and dynamic listings.
                  </p>
                </div>

                <form onSubmit={handleSaveHomeFilms} className="space-y-6">
                  {/* Toggle Panel & Section Title */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="bg-black/40 p-5 rounded-2xl border border-white/5 space-y-3 font-sans">
                      <span className="text-[10px] uppercase tracking-wider text-orange-500 font-bold block">SECTION DISPLAY SELECTOR</span>
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-sm font-bold text-white">Enable Home Films Section</p>
                          <p className="text-[10px] text-white/40">Visually toggle the entire portfolio widget from being visible.</p>
                        </div>
                        <button
                          type="button"
                          onClick={() => setHomeFilmsVisible(!homeFilmsVisible)}
                          className={`w-14 h-8 rounded-full transition-all relative ${homeFilmsVisible ? 'bg-orange-500' : 'bg-zinc-800'}`}
                        >
                          <span className={`absolute top-1 w-6 h-6 rounded-full bg-white shadow transition-all ${homeFilmsVisible ? 'right-1' : 'left-1'}`} />
                        </button>
                      </div>
                    </div>

                    <div className="bg-black/40 p-5 rounded-2xl border border-white/5 space-y-3 font-sans">
                      <span className="text-[10px] uppercase tracking-wider text-orange-500 font-bold block font-mono">PORTFOLIO DISPLAY HEADING</span>
                      <div>
                        <input
                          type="text"
                          required
                          value={homeFilmsTitle}
                          onChange={(e) => setHomeFilmsTitle(e.target.value)}
                          placeholder="e.g. Films, Portfolio, Featured Works"
                          className="w-full bg-black border border-white/10 focus:border-orange-500 outline-none rounded-xl px-4 py-2.5 text-sm text-white font-sans"
                        />
                        <p className="text-[9px] text-zinc-500 mt-1.5 font-sans">
                          Displayed as the primary decorative background display element on the main landing track.
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* Filter Tabs Toggle & Limit */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="bg-black/40 p-5 rounded-2xl border border-white/5 space-y-3 font-sans">
                      <span className="text-[10px] uppercase tracking-wider text-orange-500 font-bold block">CATEGORY SELECTION FILTER</span>
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-sm font-bold text-white">Show Category Pill Buttons</p>
                          <p className="text-[10px] text-white/40">Allow viewers to isolate listings (OTT, Branded, Unscripted).</p>
                        </div>
                        <button
                          type="button"
                          onClick={() => setHomeFilmsShowCategories(!homeFilmsShowCategories)}
                          className={`w-14 h-8 rounded-full transition-all relative ${homeFilmsShowCategories ? 'bg-orange-500' : 'bg-zinc-800'}`}
                        >
                          <span className={`absolute top-1 w-6 h-6 rounded-full bg-white shadow transition-all ${homeFilmsShowCategories ? 'right-1' : 'left-1'}`} />
                        </button>
                      </div>
                    </div>

                    <div className="bg-black/40 p-5 rounded-2xl border border-white/5 space-y-3 font-sans">
                      <span className="text-[10px] uppercase tracking-wider text-orange-500 font-bold block font-sans">MAXIMUM SHOW REELS LIMIT</span>
                      <div className="grid grid-cols-5 gap-2">
                        {['3', '6', '9', '12', 'All'].map((v) => (
                          <button
                            key={v}
                            type="button"
                            onClick={() => setHomeFilmsLimit(v as any)}
                            className={`py-2 text-[10px] font-black rounded-lg transition-all border ${homeFilmsLimit === v ? 'bg-orange-500 border-orange-500 text-black' : 'bg-black text-white/60 border-white/10 hover:text-white'}`}
                          >
                            {v}
                          </button>
                        ))}
                      </div>
                      <p className="text-[9px] text-zinc-500 font-sans">
                        Restricts the number of film card grids initialized simultaneously to preserve loading constraints.
                      </p>
                    </div>
                  </div>

                  {/* Direct connection warning and call action */}
                  <div className="p-6 bg-zinc-950/80 rounded-3xl border border-dashed border-white/10 flex flex-col md:flex-row items-start md:items-center justify-between gap-6 font-sans">
                    <div className="space-y-1">
                      <p className="text-sm font-bold text-white">Dynamic Catalogue Workspace Connection</p>
                      <p className="text-xs text-white/40 max-w-xl">
                        The film grids displayed on your home page are linked dynamically to your master Film Catalogue database. Toggle, edit, add, or delete individual videos there to sync live.
                      </p>
                    </div>
                    <button
                      type="button"
                      onClick={() => setActiveTab('film_manage')}
                      className="px-5 py-2.5 bg-zinc-800 hover:bg-white hover:text-black hover:border-white text-[10px] font-black text-white uppercase tracking-wider rounded-xl transition-all border border-white/10 block shrink-0"
                    >
                      📚 Manage Film Catalogue
                    </button>
                  </div>

                  {/* Submit Actions */}
                  <div className="flex gap-3 pt-4 border-t border-white/5 flex-wrap font-sans">
                    <button
                      type="submit"
                      className="px-8 py-3.5 bg-orange-500 hover:bg-orange-600 font-extrabold uppercase tracking-widest text-[11px] rounded-full transition-all active:scale-95 text-black"
                    >
                      COMMIT FILMS CONFIGURATION
                    </button>
                    <button
                      type="button"
                      onClick={handleResetHomeFilms}
                      className="px-6 py-3.5 bg-zinc-950 hover:bg-zinc-900 border border-white/10 font-extrabold uppercase tracking-widest text-[11px] rounded-full transition-all text-white/50 hover:text-white"
                    >
                      RESET DEFAULT FILMS SECTOR
                    </button>
                  </div>
                </form>
              </motion.div>
            )}

            {/* E. Clients/Brands sub-tab content */}
            {homeSubTab === 'clients' && (
              <motion.div 
                initial={{ opacity: 0 }} 
                animate={{ opacity: 1 }}
                className="bg-zinc-900 border border-white/5 p-6 md:p-10 rounded-[2.5rem] space-y-8 text-white font-sans"
              >
                <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                  <div>
                    <h2 className="text-2xl font-black italic text-white uppercase mb-2">🤝 COLLABORATORS & BRAND LOGOS</h2>
                    <p className="text-xs text-white/40 font-semibold tracking-wider uppercase">
                      Manage partner brands, colors, names, and logos displayed in the scrolling home-page tickers.
                    </p>
                  </div>
                  <div className="flex flex-wrap gap-2 font-sans">
                    <button
                      type="button"
                      onClick={() => {
                        setShowAddClientForm(true);
                        setEditingClientIndex(null);
                        setClientName('');
                        setClientColor('#FFFFFF');
                        setClientSize('small');
                        setClientLogoUrl('');
                        setClientLayer(1);
                      }}
                      className="px-4 py-2.5 bg-orange-500 hover:bg-orange-600 font-extrabold uppercase tracking-wider text-[10px] text-black rounded-xl transition-all flex items-center gap-1.5"
                    >
                      <Plus size={14} />
                      <span>Add Brand</span>
                    </button>
                    <button
                      type="button"
                      onClick={handleSyncBrandPartners}
                      className="px-4 py-2.5 bg-zinc-800 hover:bg-zinc-750 border border-orange-500/20 hover:border-orange-500/40 text-orange-400 hover:text-orange-350 font-extrabold uppercase tracking-wider text-[10px] rounded-xl transition-all flex items-center gap-1.5"
                    >
                      <RefreshCw size={14} className="animate-pulse" />
                      <span>Sync Brand Partners ({brandPartners.length})</span>
                    </button>
                    <button
                      type="button"
                      onClick={handleResetClients}
                      className="px-4 py-2.5 bg-zinc-850 hover:bg-zinc-700 border border-white/5 font-extrabold uppercase tracking-wider text-[10px] text-white/80 rounded-xl transition-all"
                    >
                      Reset Defaults
                    </button>
                  </div>
                </div>

                {/* Form area: Add or Edit */}
                {(showAddClientForm || editingClientIndex !== null) && (
                  <motion.div
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="p-6 bg-black/40 rounded-3xl border border-white/5 space-y-6 animate-fade-in"
                  >
                    <div className="flex justify-between items-center border-b border-white/5 pb-3">
                      <h3 className="text-sm font-black uppercase text-orange-500 tracking-wider">
                        {editingClientIndex !== null ? '🖊️ Edit Partner Brand' : '➕ Add Partner Brand'}
                      </h3>
                      <button
                        type="button"
                        onClick={() => {
                          setShowAddClientForm(false);
                          setEditingClientIndex(null);
                        }}
                        className="text-xs text-white/40 hover:text-white"
                      >
                        Cancel
                      </button>
                    </div>

                    <form onSubmit={editingClientIndex !== null ? handleUpdateFieldClient : handleAddFieldClient} className="space-y-4">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {/* Name */}
                        <div>
                          <label className="block text-xs uppercase tracking-widest text-zinc-400 font-black mb-2">
                            Brand/Client Name
                          </label>
                          <input 
                            type="text" 
                            required
                            value={clientName}
                            onChange={(e) => setClientName(e.target.value)}
                            placeholder="e.g. NETFLIX, Swachh Bharat..."
                            className="w-full bg-black border border-white/10 focus:border-orange-500 outline-none rounded-xl px-4 py-3 text-sm text-white"
                          />
                        </div>

                        {/* Logo image URL */}
                        <div>
                          <label className="block text-xs uppercase tracking-widest text-zinc-400 font-black mb-2">
                            Logo Image URL (Optional)
                          </label>
                          <input 
                            type="text" 
                            value={clientLogoUrl}
                            onChange={(e) => setClientLogoUrl(e.target.value)}
                            placeholder="Paste custom transparent PNG logo link"
                            className="w-full bg-black border border-white/10 focus:border-orange-500 outline-none rounded-xl px-4 py-3 text-sm text-white"
                          />
                        </div>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 align-top">
                        {/* Color */}
                        <div>
                          <label className="block text-xs uppercase tracking-widest text-zinc-400 font-black mb-2">
                            Brand Color Accent
                          </label>
                          <div className="flex gap-2">
                            <input 
                              type="color" 
                              value={clientColor}
                              onChange={(e) => setClientColor(e.target.value)}
                              className="w-12 h-11 bg-black border border-white/10 rounded-xl cursor-pointer p-1"
                            />
                            <input 
                              type="text" 
                              value={clientColor}
                              onChange={(e) => setClientColor(e.target.value)}
                              placeholder="#FFFFFF"
                              className="flex-1 bg-black border border-white/10 focus:border-orange-500 outline-none rounded-xl px-4 py-3 text-sm text-white"
                            />
                          </div>
                          
                          {/* Presets */}
                          <div className="flex flex-wrap gap-1.5 mt-2">
                            <span className="text-[9px] text-zinc-500 font-bold self-center mr-1">PRESETS:</span>
                            {[
                              { color: '#E50914', name: 'Netflix Red' },
                              { color: '#FFFFFF', name: 'Plain White' },
                              { color: '#FFC629', name: 'Bumble Yellow' },
                              { color: '#ED1D24', name: 'Marvel Red' },
                              { color: '#FE001A', name: 'Coke Red' },
                              { color: '#FF6700', name: 'Mi Orange' },
                            ].map((preset) => (
                              <button
                                key={preset.color}
                                type="button"
                                title={preset.name}
                                onClick={() => setClientColor(preset.color)}
                                className="w-5 h-5 rounded-full border border-white/20 transition-transform hover:scale-110 active:scale-95"
                                style={{ backgroundColor: preset.color }}
                              />
                            ))}
                          </div>
                        </div>

                        {/* Size / Type preview */}
                        <div>
                          <label className="block text-xs uppercase tracking-widest text-zinc-400 font-black mb-2">
                            Brand Size Class
                          </label>
                          <select
                            value={clientSize}
                            onChange={(e) => setClientSize(e.target.value as any)}
                            className="w-full bg-black border border-white/10 focus:border-orange-500 outline-none rounded-xl px-4 py-3 text-sm text-white"
                          >
                            <option value="small">Small (Clean Margin padding)</option>
                            <option value="medium">Medium (Regular Banner spacing)</option>
                            <option value="large">Large (High Prominence width)</option>
                            <option value="xlarge">Extra Large (High visibility)</option>
                            <option value="extralarge">Double Extra Large (Maximum visibility)</option>
                          </select>
                        </div>

                        {/* Layer row assignment */}
                        <div>
                          <label className="block text-xs uppercase tracking-widest text-orange-400 font-black mb-2">
                            Marquee Ticker Layer (Row 1, 2, or 3)
                          </label>
                          <select
                            value={clientLayer}
                            onChange={(e) => setClientLayer(Number(e.target.value) as 1 | 2 | 3)}
                            className="w-full bg-black border border-white/10 focus:border-orange-500 outline-none rounded-xl px-4 py-3 text-sm text-white"
                          >
                            <option value={1}>Layer 1 (Row 1 - Scrolls Left)</option>
                            <option value={2}>Layer 2 (Row 2 - Scrolls Right)</option>
                            <option value={3}>Layer 3 (Row 3 - Scrolls Left)</option>
                          </select>
                        </div>
                      </div>

                      {/* Visual Preview box */}
                      <div className="border border-white/5 bg-black/60 p-4 rounded-2xl flex flex-col gap-3">
                        <div className="text-xs uppercase tracking-wider text-zinc-500 font-bold">PREVIEW REAL-TIME:</div>
                        <div className="flex items-center gap-3 px-4 py-2 bg-zinc-900/60 rounded-full border border-white/5 cursor-default select-none max-w-sm">
                          <div 
                            className={`rounded-xl flex items-center justify-center text-white font-black text-xs shadow-lg ring-1 ring-white/10 overflow-hidden transition-all duration-300 ${
                              clientSize === 'small' ? 'w-10 h-10 p-1.5' :
                              clientSize === 'medium' ? 'w-14 h-14 p-2' :
                              clientSize === 'large' ? 'w-20 h-20 p-2.5' :
                              clientSize === 'xlarge' ? 'w-24 h-24 p-3' :
                              'w-28 h-28 p-3.5'
                            }`} 
                            style={{ 
                              backgroundColor: clientColor || '#333333',
                            }}
                          >
                            {clientLogoUrl && clientLogoUrl.trim().length > 0 ? (
                              <img src={clientLogoUrl} alt="Preview Logo" className="w-full h-full object-contain" referrerPolicy="no-referrer" />
                            ) : (
                              <span className={
                                clientSize === 'small' ? 'text-xs' :
                                clientSize === 'medium' ? 'text-lg' :
                                clientSize === 'large' ? 'text-2xl' :
                                clientSize === 'xlarge' ? 'text-3xl' :
                                'text-4xl'
                              }>{clientName ? clientName.substring(0, 1).toUpperCase() : 'C'}</span>
                            )}
                          </div>
                          <div className="flex flex-col gap-0.5">
                            <span className="text-sm font-bold text-zinc-300">
                              {clientName || 'Brand Name'}
                            </span>
                            <span className="text-[9px] uppercase font-mono tracking-widest text-orange-500 font-black">
                              Size Class: {clientSize}
                            </span>
                          </div>
                        </div>
                      </div>

                      <div className="flex gap-2">
                        <button
                          type="submit"
                          className="px-6 py-2.5 bg-orange-500 hover:bg-orange-600 font-extrabold uppercase tracking-wider text-[10px] text-white rounded-lg transition-all"
                        >
                          {editingClientIndex !== null ? 'Save Changes' : 'Create Brand'}
                        </button>
                        <button
                          type="button"
                          onClick={() => {
                            setShowAddClientForm(false);
                            setEditingClientIndex(null);
                          }}
                          className="px-6 py-2.5 bg-zinc-800 hover:bg-zinc-700 font-bold text-[10px] text-white rounded-lg transition-all"
                        >
                          Cancel
                        </button>
                      </div>
                    </form>
                  </motion.div>
                )}

                {/* Brands grid */}
                <div className="space-y-4">
                  <div className="flex justify-between items-center bg-zinc-950 p-4 rounded-2xl border border-white/5">
                    <span className="text-xs font-bold text-white/50 uppercase tracking-widest">
                      Currently Live ({clients.length} partner brands)
                    </span>
                    <span className="text-[10px] text-orange-500 font-bold uppercase tracking-wider">
                      ★ Renders dynamically in scrolling left/right tickers
                    </span>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4 font-sans">
                    {clients.map((client, idx) => {
                      const hasLogo = client.logoUrl && client.logoUrl.trim().length > 0;
                      return (
                        <div 
                          key={client.id || `${client.name}-${idx}`}
                          className="bg-black/55 p-4 rounded-2xl border border-white/5 flex items-center justify-between group hover:border-white/10 transition-colors"
                        >
                          <div className="flex items-center gap-3">
                            {/* Logo circle */}
                            <div 
                              className="w-10 h-10 rounded-xl flex items-center justify-center text-white font-black text-xs ring-1 ring-white/10 overflow-hidden shrink-0 shadow-md"
                              style={{ 
                                backgroundColor: client.color || '#333333'
                              }}
                            >
                              {hasLogo ? (
                                <img src={transformGoogleDriveUrl(client.logoUrl)} alt={client.name} className="w-full h-full object-contain p-1" referrerPolicy="no-referrer" />
                              ) : (
                                <span>{client.name ? client.name.substring(0, 1).toUpperCase() : 'C'}</span>
                              )}
                            </div>
                            <div className="min-w-0">
                              <h4 className="text-xs font-black uppercase text-white truncate max-w-[130px]" title={client.name}>
                                {client.name}
                              </h4>
                              <div className="flex flex-wrap items-center gap-2 mt-1">
                                <p className="text-[9px] uppercase font-mono tracking-widest text-[#a1a1aa] flex items-center gap-1">
                                  <span className="w-2 h-2 rounded-full inline-block border border-white/10" style={{ backgroundColor: client.color }} />
                                  {client.color}
                                </p>
                                <span className={`text-[8px] font-mono font-bold uppercase tracking-wider px-1.5 py-0.5 rounded-full ${
                                  client.size === 'small' ? 'bg-zinc-400/10 text-zinc-400 border border-zinc-400/10' :
                                  client.size === 'medium' ? 'bg-teal-400/10 text-teal-400 border border-teal-400/10' :
                                  client.size === 'large' ? 'bg-orange-400/10 text-orange-400 border border-orange-400/10' :
                                  client.size === 'xlarge' ? 'bg-pink-400/10 text-pink-400 border border-pink-400/10' :
                                  'bg-amber-400/10 text-amber-305 border border-amber-400/10'
                                }`}>
                                  {client.size || 'medium'}
                                </span>
                                <span className={`text-[8px] font-mono font-bold uppercase tracking-wider px-1.5 py-0.5 rounded-full ${
                                  (client.layer ? Number(client.layer) : (idx % 3 + 1)) === 1 ? 'bg-cyan-500/10 text-cyan-400 border border-cyan-500/10' :
                                  (client.layer ? Number(client.layer) : (idx % 3 + 1)) === 2 ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/10' :
                                  'bg-purple-500/10 text-purple-400 border border-purple-500/10'
                                }`}>
                                  L{(client.layer ? Number(client.layer) : (idx % 3 + 1))}
                                </span>
                              </div>
                            </div>
                          </div>

                          {/* Action controls */}
                          <div className="flex items-center gap-1 relative z-10 font-sans">
                            {/* move up */}
                            <button
                              type="button"
                              disabled={idx === 0}
                              onClick={() => handleMoveClient(idx, 'up')}
                              className="p-1 px-1.5 bg-zinc-900 border border-white/5 hover:border-white/20 text-white/40 hover:text-white rounded-md disabled:opacity-20 transition-all text-[8px] font-black"
                              title="Move Left (Up)"
                            >
                              <ArrowUp size={12} />
                            </button>
                            {/* move down */}
                            <button
                              type="button"
                              disabled={idx === clients.length - 1}
                              onClick={() => handleMoveClient(idx, 'down')}
                              className="p-1 px-1.5 bg-zinc-900 border border-white/5 hover:border-white/20 text-white/40 hover:text-white rounded-md disabled:opacity-20 transition-all text-[8px] font-black"
                              title="Move Right (Down)"
                            >
                              <ArrowDown size={12} />
                            </button>
                            {/* edit */}
                            <button
                              type="button"
                              onClick={() => handleEditClientClick(idx)}
                              className="p-1 px-1.5 bg-orange-500/10 hover:bg-orange-500 text-orange-500 hover:text-black rounded-md transition-all text-[8px]"
                              title="Edit"
                            >
                              <Edit2 size={12} />
                            </button>
                            {/* delete */}
                            <button
                              type="button"
                              onClick={() => handleDeleteClient(idx)}
                              className="p-1 px-1.5 bg-red-500/10 hover:bg-red-500 text-red-500 hover:text-white rounded-md transition-all text-[8px]"
                              title="Remove"
                            >
                              <Trash2 size={12} />
                            </button>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </motion.div>
            )}

            {homeSubTab === 'logo' && (
              <motion.div 
                initial={{ opacity: 0 }} 
                animate={{ opacity: 1 }}
                className="bg-zinc-900 border border-white/5 p-6 md:p-10 rounded-[2.5rem] space-y-8 text-white font-sans"
              >
                <div>
                  <h2 className="text-2xl font-black italic text-white uppercase mb-2">NAVBAR BRAND LOGO SETTINGS</h2>
                  <p className="text-xs text-white/50 leading-relaxed font-sans">
                    Define how your agency brand identity appears in the top navigation bar. You can choose either an elegant text logo or upload a custom transparent graphic image logo.
                  </p>
                </div>

                <form onSubmit={handleSaveNavLogo} className="space-y-6 font-sans">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {/* Logo Type selector */}
                    <div className="space-y-2">
                      <label className="block text-[10px] font-black uppercase tracking-widest text-orange-500">Logo Presentation Type</label>
                      <div className="grid grid-cols-2 gap-4">
                        <button
                          type="button"
                          onClick={() => setNavLogoType('text')}
                          className={`py-3 px-4 rounded-xl border text-xs font-bold uppercase tracking-wider transition-all ${navLogoType === 'text' ? 'bg-orange-500/10 border-orange-500 text-orange-500' : 'bg-black border-white/5 text-white/50 hover:text-white'}`}
                        >
                          Text brand logo
                        </button>
                        <button
                          type="button"
                          onClick={() => setNavLogoType('image')}
                          className={`py-3 px-4 rounded-xl border text-xs font-bold uppercase tracking-wider transition-all ${navLogoType === 'image' ? 'bg-orange-500/10 border-orange-500 text-orange-500' : 'bg-black border-white/5 text-white/50 hover:text-white'}`}
                        >
                          Image graphic logo
                        </button>
                      </div>
                      <p className="text-[10px] text-white/30 text-left">
                        {navLogoType === 'text' 
                          ? "Displays styled bold typography of your agency short initials and full name."
                          : "Upload and display a custom transparent graphic overlay in the top-left of the screen."}
                      </p>
                    </div>

                    {/* Logo Image URL */}
                    {navLogoType === 'image' && (
                      <div className="space-y-2">
                        <label className="block text-[10px] font-black uppercase tracking-widest text-orange-500">Logo Image URL</label>
                        <input
                          type="url"
                          required
                          value={navLogoImageUrl}
                          onChange={(e) => setNavLogoImageUrl(e.target.value)}
                          placeholder="e.g. https://domain.com/transparent-logo.png"
                          className="w-full bg-black border border-white/10 rounded-xl px-4 py-3 text-xs text-white focus:outline-none focus:border-orange-500 transition-colors"
                        />
                        <p className="text-[10px] text-white/30 text-left">
                          For best results, use a transparent horizontal PNG logo (max height recommendation of 60px).
                        </p>
                      </div>
                    )}

                    {/* Custom short text */}
                    {navLogoType === 'text' && (
                      <div className="space-y-2">
                        <label className="block text-[10px] font-black uppercase tracking-widest text-orange-500">Logo Short Text (Accent Initials)</label>
                        <input
                          type="text"
                          required
                          maxLength={10}
                          value={navLogoTextShort}
                          onChange={(e) => setNavLogoTextShort(e.target.value)}
                          placeholder="e.g. DC"
                          className="w-full bg-black border border-white/10 rounded-xl px-4 py-3 text-xs text-white focus:outline-none focus:border-orange-500 transition-colors"
                        />
                        <p className="text-[10px] text-white/30 text-left">
                          Short visual monogram (e.g., 'DC' for Dreamcatchers).
                        </p>
                      </div>
                    )}

                    {/* Custom full text */}
                    {navLogoType === 'text' && (
                      <div className="space-y-2">
                        <label className="block text-[10px] font-black uppercase tracking-widest text-orange-500">Logo Full Text (Main Name)</label>
                        <input
                          type="text"
                          required
                          maxLength={30}
                          value={navLogoTextFull}
                          onChange={(e) => setNavLogoTextFull(e.target.value)}
                          placeholder="e.g. DREAMCATCHERS"
                          className="w-full bg-black border border-white/10 rounded-xl px-4 py-3 text-xs text-white focus:outline-none focus:border-orange-500 transition-colors"
                        />
                        <p className="text-[10px] text-white/30 text-left">
                          Displayed on desktop sizes immediately beside the accent short initials.
                        </p>
                      </div>
                    )}
                  </div>

                  {/* Preview Area */}
                  <div className="bg-black/40 p-6 rounded-2xl border border-white/5 space-y-3">
                    <span className="block text-[10px] font-black uppercase tracking-widest text-white/40">Visual Live Preview</span>
                    <div className="h-16 flex items-center justify-start bg-zinc-950 px-6 rounded-xl border border-white/5 relative overflow-hidden">
                      <div className="absolute inset-0 bg-radial from-transparent to-black pointer-events-none" />
                      <div className="flex items-center gap-3 font-sans">
                        {navLogoType === 'image' && navLogoImageUrl ? (
                          <img 
                            src={transformGoogleDriveUrl(navLogoImageUrl)} 
                            alt="Brand Logo Preview" 
                            className="h-10 object-contain max-w-[180px]" 
                            referrerPolicy="no-referrer"
                            onError={(e) => {
                              (e.currentTarget as HTMLImageElement).src = 'https://placehold.co/150x50/ff4500/ffffff?text=Logo+Error';
                            }}
                          />
                        ) : (
                          <>
                            <span className="text-xl md:text-2xl font-black italic tracking-tighter text-orange-500 leading-none">{navLogoTextShort}</span>
                            <span className="text-xs md:text-sm font-bold tracking-[0.2em] text-white">{navLogoTextFull}</span>
                          </>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Form Submission buttons */}
                  <div className="flex flex-wrap gap-4 pt-4">
                    <button
                      type="submit"
                      className="px-8 py-3.5 bg-orange-500 hover:bg-orange-600 font-extrabold uppercase text-xs tracking-widest text-white rounded-full flex items-center gap-2 shadow-lg hover:shadow-orange-500/20 active:scale-95 transition-all"
                    >
                      <span>SAVE NAV LOGO CONFIGURATION</span>
                    </button>
                    <button
                      type="button"
                      onClick={handleResetNavLogo}
                      className="px-8 py-3.5 bg-black hover:bg-zinc-950 font-extrabold uppercase text-xs tracking-widest text-white/60 hover:text-white rounded-full border border-white/10 hover:border-white/30 transition-all"
                    >
                      RESET LOGO DEFAULTS
                    </button>
                  </div>
                </form>
              </motion.div>
            )}

            {homeSubTab === 'paragraph_frames' && (
              <motion.div 
                initial={{ opacity: 0 }} 
                animate={{ opacity: 1 }}
                className="bg-zinc-900 border border-white/5 p-6 md:p-10 rounded-[2.5rem] space-y-8 text-white font-sans"
              >
                <div>
                  <h2 className="text-2xl font-black italic text-white uppercase mb-2">WORD-LEVEL INLINE MEDIA FRAMES</h2>
                  <p className="text-xs text-white/50 leading-relaxed font-sans font-medium uppercase tracking-wider">
                    Configure the 5 custom animated frames embedded inside the home introductory paragraph. You can toggle each frame to display either an image or source a background video URL.
                  </p>
                </div>

                <form onSubmit={handleSaveParagraphFrames} className="space-y-8 font-sans">
                  <div className="space-y-6">
                    {paragraphFrames.map((frame, index) => {
                      const transformedUrl = transformGoogleDriveUrl(frame.url, frame.type);
                      return (
                        <div 
                          key={frame.id} 
                          className="bg-black/40 border border-white/5 p-5 md:p-6 rounded-2xl flex flex-col lg:flex-row gap-6 items-start lg:items-center justify-between"
                        >
                          <div className="space-y-4 flex-1 w-full">
                            {/* Header / Label details */}
                            <div className="flex items-center gap-3">
                              <span className="px-3 py-1 bg-orange-500/10 text-orange-500 text-[10px] font-black uppercase tracking-widest rounded-md border border-orange-500/20">
                                {frame.id.toUpperCase()}
                              </span>
                              <h3 className="text-sm font-bold text-white uppercase">{frame.label}</h3>
                            </div>

                            {/* Type and URL Controls */}
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 font-sans">
                              <div className="space-y-2">
                                <label className="block text-[9px] font-black uppercase tracking-widest text-white/40">Media Type</label>
                                <div className="grid grid-cols-2 gap-2">
                                  <button
                                    type="button"
                                    onClick={() => handleUpdateFrameField(frame.id, 'type', 'image')}
                                    className={`py-2 px-3 rounded-lg border text-[10px] font-bold uppercase tracking-wider transition-all ${frame.type === 'image' ? 'bg-orange-500/10 border-orange-500 text-orange-500' : 'bg-black border-white/5 text-white/40 hover:text-white'}`}
                                  >
                                    Image
                                  </button>
                                  <button
                                    type="button"
                                    onClick={() => handleUpdateFrameField(frame.id, 'type', 'video')}
                                    className={`py-2 px-3 rounded-lg border text-[10px] font-bold uppercase tracking-wider transition-all ${frame.type === 'video' ? 'bg-orange-500/10 border-orange-500 text-orange-500' : 'bg-black border-white/5 text-white/40 hover:text-white'}`}
                                  >
                                    Video
                                  </button>
                                </div>
                              </div>

                              <div className="md:col-span-2 space-y-2">
                                <label className="block text-[9px] font-black uppercase tracking-widest text-white/40">Source URL (Support Google Drive, Unsplash, etc.)</label>
                                <input
                                  type="url"
                                  required
                                  value={frame.url}
                                  onChange={(e) => handleUpdateFrameField(frame.id, 'url', e.target.value)}
                                  placeholder="Enter photo/video complete HTTPS URL..."
                                  className="w-full bg-black border border-white/10 rounded-lg px-4 py-2 text-xs text-white focus:outline-none focus:border-orange-500 transition-colors"
                                />
                              </div>
                            </div>
                          </div>

                          {/* Preview Area container */}
                          <div className="w-full lg:w-36 h-28 shrink-0 bg-zinc-950 rounded-xl border border-white/5 relative overflow-hidden flex items-center justify-center">
                            {frame.url ? (
                              frame.type === 'video' ? (
                                <video
                                  src={transformedUrl}
                                  className="w-full h-full object-cover"
                                  autoPlay
                                  loop
                                  muted
                                  playsInline
                                />
                              ) : (
                                <img
                                  src={transformedUrl}
                                  alt="Frame Preview"
                                  className="w-full h-full object-cover"
                                  referrerPolicy="no-referrer"
                                  onError={(e) => {
                                    (e.currentTarget as HTMLImageElement).src = 'https://placehold.co/150x150/111111/ff4500/ffffff?text=Image+Error';
                                  }}
                                />
                              )
                            ) : (
                              <span className="text-[10px] text-white/20 uppercase font-black tracking-wider">No Media</span>
                            )}
                            <div className="absolute inset-0 bg-radial from-transparent to-black/60 pointer-events-none" />
                          </div>
                        </div>
                      );
                    })}
                  </div>

                  {/* Form Submission buttons */}
                  <div className="flex flex-wrap gap-4 pt-4 border-t border-white/5 font-sans">
                    <button
                      type="submit"
                      className="px-8 py-3.5 bg-orange-500 hover:bg-orange-600 font-extrabold uppercase text-xs tracking-widest text-white rounded-full flex items-center gap-2 shadow-lg hover:shadow-orange-500/20 active:scale-95 transition-all"
                    >
                      <span>SAVE WORD-LEVEL FRAMES CONFIGURATION</span>
                    </button>
                    <button
                      type="button"
                      onClick={handleResetParagraphFrames}
                      className="px-8 py-3.5 bg-black hover:bg-zinc-950 font-extrabold uppercase text-xs tracking-widest text-white/60 hover:text-white rounded-full border border-white/10 hover:border-white/30 transition-all"
                    >
                      RESET FRAMES DEFAULTS
                    </button>
                  </div>
                </form>
              </motion.div>
            )}

            {homeSubTab === 'verticals' && (
              <motion.div 
                initial={{ opacity: 0 }} 
                animate={{ opacity: 1 }}
                className="bg-zinc-900 border border-white/5 p-6 md:p-10 rounded-[2.5rem] space-y-8 text-white font-sans"
              >
                <div>
                  <h2 className="text-2xl font-black italic text-white uppercase mb-2">ENTERPRISE VERTICALS & SUB-BRANDS</h2>
                  <p className="text-xs text-white/50 leading-relaxed font-sans font-medium uppercase tracking-wider">
                    Configure the titles, descriptions, and cinematic background videos or preview frames for "SPORTS BOX" and "DC DIGITAL STUDIO" on the Home page.
                  </p>
                </div>

                <form onSubmit={handleSaveVerticals} className="space-y-8 font-sans">
                  <div className="space-y-6">
                    {verticalsList.map((vertical) => {
                      const transformedUrl = transformGoogleDriveUrl(vertical.url, vertical.type);
                      return (
                        <div 
                          key={vertical.id} 
                          className="bg-black/40 border border-white/5 p-5 md:p-6 rounded-2xl flex flex-col lg:flex-row gap-6 items-start lg:items-center justify-between"
                        >
                          <div className="space-y-4 flex-1 w-full font-sans font-medium">
                            {/* Header / Label details */}
                            <div className="flex items-center gap-3">
                              <span className="px-3 py-1 bg-orange-500/10 text-orange-500 text-[10px] font-black uppercase tracking-widest rounded-md border border-orange-500/20">
                                {vertical.id.replace('_', ' ').toUpperCase()}
                              </span>
                              <h3 className="text-sm font-bold text-white uppercase">{vertical.label}</h3>
                            </div>

                            {/* Inputs for Title, Subtitle, Description */}
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                              <div className="space-y-1">
                                <label className="block text-[9px] font-black uppercase tracking-widest text-white/40">Item Title</label>
                                <input
                                  type="text"
                                  required
                                  value={vertical.title}
                                  onChange={(e) => handleUpdateVerticalField(vertical.id, 'title', e.target.value)}
                                  placeholder="e.g. SPORTS BOX"
                                  className="w-full bg-black border border-white/10 rounded-lg px-4 py-2 text-xs text-white focus:outline-none focus:border-orange-500 transition-colors"
                                />
                              </div>
                              <div className="space-y-1">
                                <label className="block text-[9px] font-black uppercase tracking-widest text-white/40">Item Subtitle</label>
                                <input
                                  type="text"
                                  required
                                  value={vertical.subtitle}
                                  onChange={(e) => handleUpdateVerticalField(vertical.id, 'subtitle', e.target.value)}
                                  placeholder="e.g. SPORTS VERTICAL"
                                  className="w-full bg-black border border-white/10 rounded-lg px-4 py-2 text-xs text-white focus:outline-none focus:border-orange-500 transition-colors"
                                />
                              </div>
                              <div className="space-y-1">
                                <label className="block text-[9px] font-black uppercase tracking-widest text-white/40">Item Description</label>
                                <input
                                  type="text"
                                  required
                                  value={vertical.description}
                                  onChange={(e) => handleUpdateVerticalField(vertical.id, 'description', e.target.value)}
                                  placeholder="e.g. International Live Sports"
                                  className="w-full bg-black border border-white/10 rounded-lg px-4 py-2 text-xs text-white focus:outline-none focus:border-orange-500 transition-colors"
                                />
                              </div>
                            </div>

                            {/* Type, URL and Upload Controls */}
                            <div className="space-y-4">
                              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                <div className="space-y-2">
                                  <label className="block text-[9px] font-black uppercase tracking-widest text-white/40">Media Type</label>
                                  <div className="grid grid-cols-2 gap-2">
                                    <button
                                      type="button"
                                      onClick={() => handleUpdateVerticalField(vertical.id, 'type', 'image')}
                                      className={`py-2 px-3 rounded-lg border text-[10px] font-bold uppercase tracking-wider transition-all ${vertical.type === 'image' ? 'bg-orange-500/10 border-orange-500 text-orange-500' : 'bg-black border-white/5 text-white/40 hover:text-white'}`}
                                    >
                                      Image
                                    </button>
                                    <button
                                      type="button"
                                      onClick={() => handleUpdateVerticalField(vertical.id, 'type', 'video')}
                                      className={`py-2 px-3 rounded-lg border text-[10px] font-bold uppercase tracking-wider transition-all ${vertical.type === 'video' ? 'bg-orange-500/10 border-orange-500 text-orange-500' : 'bg-black border-white/5 text-white/40 hover:text-white'}`}
                                    >
                                      Video
                                    </button>
                                  </div>
                                </div>

                                <div className="md:col-span-2 space-y-2">
                                  <label className="block text-[9px] font-black uppercase tracking-widest text-white/40">Source URL (Support Google Drive share-link, Direct MP4, or YouTube link)</label>
                                  <input
                                    type="url"
                                    value={vertical.url || ''}
                                    onChange={(e) => handleUpdateVerticalField(vertical.id, 'url', e.target.value)}
                                    placeholder="Enter complete HTTPS video or image URL to showcase interactive player..."
                                    className="w-full bg-black border border-white/10 rounded-lg px-4 py-2 text-xs text-white focus:outline-none focus:border-orange-500 transition-colors"
                                  />
                                </div>
                              </div>

                              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                {/* Local File Upload Drop-Zone */}
                                <div className="space-y-1">
                                  <label className="block text-[9px] font-black uppercase tracking-widest text-white/40">Or Upload Local Image File</label>
                                  <div className="relative border border-dashed border-white/15 hover:border-orange-500/50 rounded-xl px-4 py-3 bg-black/40 flex items-center justify-center gap-3 transition-all cursor-pointer group">
                                    <input
                                      type="file"
                                      accept="image/*"
                                      onChange={(e) => {
                                        const file = e.target.files?.[0];
                                        if (file) {
                                          if (file.size > 2 * 1024 * 1024) {
                                            alert("Note: To prevent issues with dashboard backup sizes, we recommend images under 2MB. Please select a smaller image or optimize it.");
                                            return;
                                          }
                                          const reader = new FileReader();
                                          reader.onload = (event) => {
                                            if (event.target && typeof event.target.result === 'string') {
                                              handleUpdateVerticalField(vertical.id, 'url', event.target.result);
                                              handleUpdateVerticalField(vertical.id, 'type', 'image');
                                            }
                                          };
                                          reader.readAsDataURL(file);
                                        }
                                      }}
                                      className="absolute inset-0 opacity-0 cursor-pointer w-full h-full z-10"
                                    />
                                    <svg className="w-5 h-5 text-white/30 group-hover:text-orange-500 transition-colors shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                                      <path strokeLinecap="round" strokeLinejoin="round" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" />
                                    </svg>
                                    <div className="text-left font-sans">
                                      <p className="text-[10px] text-white/85 font-black uppercase tracking-wider group-hover:text-white transition-colors">Select Local Image</p>
                                      <p className="text-[8px] text-white/40 uppercase">JPEG, PNG, WebP (Max 2MB)</p>
                                    </div>
                                  </div>
                                </div>

                                {/* Curated Prebuilt Quick-Apply Accent Presets */}
                                <div className="space-y-1">
                                  <label className="block text-[9px] font-black uppercase tracking-widest text-white/40 font-mono text-orange-500">Quick-Apply Creative Presets</label>
                                  <div className="flex gap-2 h-full items-start">
                                    {vertical.id === 'sports_box' ? (
                                      <>
                                        <button
                                          type="button"
                                          onClick={() => {
                                            handleUpdateVerticalField(vertical.id, 'url', 'https://images.unsplash.com/photo-1508098682722-e99c43a406b2?auto=format&fit=crop&q=80&w=1200');
                                            handleUpdateVerticalField(vertical.id, 'type', 'image');
                                          }}
                                          className="flex-1 bg-black/60 hover:bg-neutral-900 border border-white/5 hover:border-orange-500/40 p-2 rounded-xl text-left transition-all group"
                                        >
                                          <span className="block text-[10px] text-white/80 font-bold uppercase truncate group-hover:text-white">Stadium Lights</span>
                                          <span className="block text-[8px] text-orange-500/60 uppercase font-mono tracking-wider mt-0.5">Arena Theme</span>
                                        </button>
                                        <button
                                          type="button"
                                          onClick={() => {
                                            handleUpdateVerticalField(vertical.id, 'url', 'https://images.unsplash.com/photo-1461896836934-ffe607ba8211?auto=format&fit=crop&q=80&w=1200');
                                            handleUpdateVerticalField(vertical.id, 'type', 'image');
                                          }}
                                          className="flex-1 bg-black/60 hover:bg-neutral-900 border border-white/5 hover:border-orange-500/40 p-2 rounded-xl text-left transition-all group"
                                        >
                                          <span className="block text-[10px] text-white/80 font-bold uppercase truncate group-hover:text-white">Action Energy</span>
                                          <span className="block text-[8px] text-orange-500/60 uppercase font-mono tracking-wider mt-0.5">High Performance</span>
                                        </button>
                                      </>
                                    ) : (
                                      <>
                                        <button
                                          type="button"
                                          onClick={() => {
                                            handleUpdateVerticalField(vertical.id, 'url', 'https://images.unsplash.com/photo-1542744094-3a31f103e35f?auto=format&fit=crop&q=80&w=1200');
                                            handleUpdateVerticalField(vertical.id, 'type', 'image');
                                          }}
                                          className="flex-1 bg-black/60 hover:bg-neutral-900 border border-white/5 hover:border-amber-500/40 p-2 rounded-xl text-left transition-all group"
                                        >
                                          <span className="block text-[10px] text-white/80 font-bold uppercase truncate group-hover:text-white">Digital Agency</span>
                                          <span className="block text-[8px] text-amber-500/60 uppercase font-mono tracking-wider mt-0.5">Modern Work</span>
                                        </button>
                                        <button
                                          type="button"
                                          onClick={() => {
                                            handleUpdateVerticalField(vertical.id, 'url', 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?auto=format&fit=crop&q=80&w=1200');
                                            handleUpdateVerticalField(vertical.id, 'type', 'image');
                                          }}
                                          className="flex-1 bg-black/60 hover:bg-neutral-900 border border-white/5 hover:border-amber-500/40 p-2 rounded-xl text-left transition-all group"
                                        >
                                          <span className="block text-[10px] text-white/80 font-bold uppercase truncate group-hover:text-white">AI Art Render</span>
                                          <span className="block text-[8px] text-amber-500/60 uppercase font-mono tracking-wider mt-0.5">Organic Wave</span>
                                        </button>
                                      </>
                                    )}
                                  </div>
                                </div>
                              </div>
                            </div>
                          </div>

                          {/* Preview Area container */}
                          <div className="w-full lg:w-48 h-32 shrink-0 bg-zinc-950 rounded-xl border border-white/5 relative overflow-hidden flex items-center justify-center">
                            {vertical.url ? (
                              vertical.type === 'video' ? (
                                <video
                                  src={transformedUrl}
                                  className="w-full h-full object-cover"
                                  autoPlay
                                  loop
                                  muted
                                  playsInline
                                />
                              ) : (
                                <img
                                  src={transformedUrl}
                                  alt="Frame Preview"
                                  className="w-full h-full object-cover"
                                  referrerPolicy="no-referrer"
                                  onError={(e) => {
                                    (e.currentTarget as HTMLImageElement).src = 'https://placehold.co/150x150/111111/ff4500/ffffff?text=Image+Error';
                                  }}
                                />
                              )
                            ) : (
                              <div className="flex flex-col items-center justify-center text-center p-2 font-sans">
                                <span className="text-[10px] text-white/20 uppercase font-black tracking-wider block mb-1">Branding Only</span>
                                <span className="text-[8px] text-orange-500/40 uppercase font-bold">Paste URL for video frame preview</span>
                              </div>
                            )}
                            <div className="absolute inset-0 bg-radial from-transparent to-black/60 pointer-events-none" />
                          </div>
                        </div>
                      );
                    })}
                  </div>

                  {/* Form Submission buttons */}
                  <div className="flex flex-wrap gap-4 pt-4 border-t border-white/5 font-sans">
                    <button
                      type="submit"
                      className="px-8 py-3.5 bg-orange-500 hover:bg-orange-600 font-extrabold uppercase text-xs tracking-widest text-white rounded-full flex items-center gap-2 shadow-lg hover:shadow-orange-500/20 active:scale-95 transition-all"
                    >
                      <span>SAVE ENTERPRISE VERTICALS CONFIGURATION</span>
                    </button>
                    <button
                      type="button"
                      onClick={handleResetVerticals}
                      className="px-8 py-3.5 bg-black hover:bg-zinc-950 font-extrabold uppercase text-xs tracking-widest text-white/60 hover:text-white rounded-full border border-white/10 hover:border-white/30 transition-all"
                    >
                      RESET VERTICALS DEFAULTS
                    </button>
                  </div>
                </form>
              </motion.div>
            )}

            {homeSubTab === 'slides' && (
              <motion.div 
                initial={{ opacity: 0 }} 
                animate={{ opacity: 1 }}
                className="bg-zinc-900 border border-white/5 p-6 md:p-10 rounded-[2.5rem] space-y-8 text-white font-sans"
              >
                <div>
                  <h2 className="text-2xl font-black italic text-white uppercase mb-2">9 CINEMATIC SLIDESHOW</h2>
                  <p className="text-xs text-white/50 leading-relaxed font-sans font-medium uppercase tracking-wider">
                    Configure the titles, descriptions, and high-fidelity background images for the 9-slide scrolling section located between the Hero and Collaborators sections.
                  </p>
                </div>

                <form onSubmit={handleSaveSlideshow} className="space-y-8 font-sans">
                  <div className="space-y-6">
                    {slidesList.map((slide, index) => {
                      const transformedUrl = transformGoogleDriveUrl(slide.imageUrl, 'image');
                      return (
                        <div 
                          key={slide.id} 
                          className="bg-black/40 border border-white/5 p-5 md:p-6 rounded-2xl flex flex-col lg:flex-row gap-6 items-start lg:items-center justify-between"
                        >
                          <div className="space-y-4 flex-1 w-full font-sans font-medium">
                            <div className="flex items-center gap-3">
                              <span className="px-3 py-1 bg-orange-500/10 text-orange-500 text-[10px] font-black uppercase tracking-widest rounded-md border border-orange-500/20">
                                SLIDE 0{index + 1} ({slide.id.replace('_', ' ').toUpperCase()})
                              </span>
                              <h3 className="text-sm font-bold text-white uppercase">{slide.title}</h3>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                              <div className="space-y-1">
                                <label className="block text-[9px] font-black uppercase tracking-widest text-white/40">Slide Title</label>
                                <input
                                  type="text"
                                  required
                                  value={slide.title}
                                  onChange={(e) => handleUpdateSlideField(slide.id, 'title', e.target.value)}
                                  placeholder="Slide Category Title"
                                  className="w-full bg-black border border-white/10 rounded-lg px-4 py-2 text-xs text-white focus:outline-none focus:border-orange-500 transition-colors"
                                />
                              </div>
                              <div className="space-y-1">
                                <label className="block text-[9px] font-black uppercase tracking-widest text-white/40">Slide Image URL (Compatible with Google Drive share-link, Unsplash, etc.)</label>
                                <input
                                  type="url"
                                  required
                                  value={slide.imageUrl}
                                  onChange={(e) => handleUpdateSlideField(slide.id, 'imageUrl', e.target.value)}
                                  placeholder="Enter complete HTTPS image source URL..."
                                  className="w-full bg-black border border-white/10 rounded-lg px-4 py-2 text-xs text-white focus:outline-none focus:border-orange-500 transition-colors"
                                />
                              </div>
                            </div>

                            <div className="space-y-1">
                              <label className="block text-[9px] font-black uppercase tracking-widest text-white/40">Slide Description / Subtext</label>
                              <textarea
                                required
                                rows={2}
                                value={slide.description}
                                onChange={(e) => handleUpdateSlideField(slide.id, 'description', e.target.value)}
                                placeholder="Explain this cinematic genre or collection..."
                                className="w-full bg-black border border-white/10 rounded-lg px-4 py-2 text-xs text-white focus:outline-none focus:border-orange-500 transition-colors resize-none"
                              />
                            </div>

                            {/* Local Image File upload drop zone specifically for this slide */}
                            <div className="space-y-1">
                              <label className="block text-[9px] font-black uppercase tracking-widest text-white/40">Or Upload Local Slide Image</label>
                              <div className="relative border border-dashed border-white/15 hover:border-orange-500/50 rounded-xl px-4 py-3 bg-black/40 flex items-center justify-center gap-3 transition-all cursor-pointer group">
                                <input
                                  type="file"
                                  accept="image/*"
                                  onChange={(e) => {
                                    const file = e.target.files?.[0];
                                    if (file) {
                                      if (file.size > 2 * 1024 * 1024) {
                                        alert("Note: To prevent issues with database backup sizes, we recommend images under 2MB. Please select a smaller or optimized image.");
                                        return;
                                      }
                                      const reader = new FileReader();
                                      reader.onload = (event) => {
                                        if (event.target && typeof event.target.result === 'string') {
                                          handleUpdateSlideField(slide.id, 'imageUrl', event.target.result);
                                        }
                                      };
                                      reader.readAsDataURL(file);
                                    }
                                  }}
                                  className="absolute inset-0 opacity-0 cursor-pointer w-full h-full z-10"
                                />
                                <svg className="w-5 h-5 text-white/30 group-hover:text-orange-500 transition-colors shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                                  <path strokeLinecap="round" strokeLinejoin="round" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" />
                                </svg>
                                <div className="text-left font-sans">
                                  <p className="text-[10px] text-white/85 font-black uppercase tracking-wider group-hover:text-white transition-colors">Select Local Image for Slide 0{index + 1}</p>
                                  <p className="text-[8px] text-white/40 uppercase">JPEG, PNG, WebP (Max 2MB)</p>
                                </div>
                              </div>
                            </div>
                          </div>

                          {/* Preview container */}
                          <div className="w-full lg:w-48 h-32 shrink-0 bg-zinc-950 rounded-xl border border-white/5 relative overflow-hidden flex items-center justify-center">
                            {slide.imageUrl ? (
                              <img
                                src={transformedUrl}
                                alt={`Slide ${index + 1} Preview`}
                                className="w-full h-full object-cover"
                                referrerPolicy="no-referrer"
                                onError={(e) => {
                                  (e.currentTarget as HTMLImageElement).src = 'https://placehold.co/150x150/111111/ff4500/ffffff?text=Image+Error';
                                }}
                              />
                            ) : (
                              <span className="text-[8px] text-white/20 uppercase font-black font-sans">No URL Entered</span>
                            )}
                            <div className="absolute inset-0 bg-radial from-transparent to-black/60 pointer-events-none" />
                          </div>
                        </div>
                      );
                    })}
                  </div>

                  <div className="flex flex-wrap gap-4 pt-4 border-t border-white/5 font-sans">
                    <button
                      type="submit"
                      className="px-8 py-3.5 bg-orange-500 hover:bg-orange-600 font-extrabold uppercase text-xs tracking-widest text-white rounded-full flex items-center gap-2 shadow-lg hover:shadow-orange-500/20 active:scale-95 transition-all"
                    >
                      <span>SAVE CINEMATIC SLIDESHOW CONFIGURATION</span>
                    </button>
                    <button
                      type="button"
                      onClick={handleResetSlideshow}
                      className="px-8 py-3.5 bg-black hover:bg-zinc-950 font-extrabold uppercase text-xs tracking-widest text-white/60 hover:text-white rounded-full border border-white/10 hover:border-white/30 transition-all font-sans"
                    >
                      RESET 9 SLIDES TO DEFAULTS
                    </button>
                  </div>
                </form>
              </motion.div>
            )}
          </div>
        )}

        {/* 3. FILM PAGE AREA (CINEMATIC MOVIE LISTINGS) */}
        {activeTab === 'film_manage' && (
          <div className="space-y-8 animate-fade-in font-sans text-white">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-zinc-900/40 p-4 rounded-3xl border border-white/5">
              <button 
                onClick={() => setActiveTab('categories')}
                className="flex items-center gap-2 px-5 py-2.5 rounded-full border border-white/10 hover:border-white/30 text-xs font-black uppercase tracking-wider text-white bg-black hover:text-orange-500 transition-all font-sans"
              >
                <ChevronLeft size={16} />
                <span>BACK TO CONTROL CENTER</span>
              </button>
              
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => { setShowAddFilmForm(!showAddFilmForm); setEditingFilmIndex(null); }}
                  className="px-5 py-2.5 bg-orange-500 hover:bg-orange-600 text-white font-black uppercase tracking-wider text-xs rounded-full flex items-center gap-2 transition-all shadow-lg active:scale-95"
                >
                  <Plus size={14} />
                  <span>{showAddFilmForm ? 'CLOSE FORM' : 'ADD NEW CINEMATIC FILM'}</span>
                </button>
                <button
                  type="button"
                  onClick={handleResetFilmsDefaults}
                  className="px-5 py-2.5 bg-zinc-950 hover:bg-zinc-900 text-white/60 hover:text-white font-black uppercase tracking-wider text-xs rounded-full flex items-center gap-2 transition-all border border-white/10"
                >
                  <RefreshCw size={12} />
                  <span>RESET DEFAULT LIBRARY</span>
                </button>
              </div>
            </div>

            {/* Dynamic film registration / edit forms */}
            <AnimatePresence>
              {(showAddFilmForm || editingFilmIndex !== null) && (
                <motion.div
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.95 }}
                  className="bg-zinc-900 border border-orange-500/30 p-6 md:p-8 rounded-[2.5rem] overflow-hidden shadow-2xl relative text-white"
                >
                  <h3 className="text-xl font-black uppercase italic tracking-tight mb-6 text-orange-500 flex items-center gap-2">
                    {editingFilmIndex !== null ? `✍️ EDIT FILM POSTER #${editingFilmIndex + 1}` : '✨ REGISTER NEW CINEMATIC FILM'}
                  </h3>
                  
                  <form onSubmit={editingFilmIndex !== null ? handleSaveEditFilm : handleAddFilm} className="space-y-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div>
                        <label className="block text-xs uppercase tracking-widest text-zinc-400 font-black mb-2 font-sans">Film Name Title</label>
                        <input
                          type="text"
                          required
                          value={filmTitle}
                          onChange={(e) => setFilmTitle(e.target.value)}
                          placeholder="e.g. Maleficent / Deadpool & Wolverine"
                          className="w-full bg-black border border-white/10 focus:border-orange-500 outline-none rounded-xl px-4 py-3 text-sm text-white font-semibold"
                        />
                      </div>
                      
                      <div>
                        <label className="block text-xs uppercase tracking-widest text-zinc-400 font-black mb-2">Category Channel</label>
                        <select
                          value={filmCategory}
                          onChange={(e) => setFilmCategory(e.target.value)}
                          className="w-full bg-black border border-white/10 focus:border-orange-500 outline-none rounded-xl px-4 py-3 text-sm text-white font-black uppercase"
                        >
                          <option value="Branded Content">Branded Content</option>
                          <option value="Documentaries">Documentaries</option>
                          <option value="Travel & Lifestyle">Travel & Lifestyle</option>
                          <option value="Corporate">Corporate</option>
                          <option value="Sports">Sports</option>
                          <option value="Reality">Reality</option>
                          <option value="Commercials">Commercials</option>
                          <option value="Influencer">Influencer</option>
                        </select>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div>
                        <label className="block text-xs uppercase tracking-widest text-zinc-400 font-black mb-2 font-sans">Film Banner Poster URL</label>
                        <input
                          type="text"
                          required
                          value={filmImg}
                          onChange={(e) => setFilmImg(e.target.value)}
                          placeholder="Paste premium movie high-res cover URL or unsplash photo link"
                          className="w-full bg-black border border-white/10 focus:border-orange-500 outline-none rounded-xl px-4 py-3 text-sm text-white"
                        />
                      </div>

                      <div>
                        <label className="block text-xs uppercase tracking-widest text-zinc-400 font-black mb-2">YouTube Video Link</label>
                        <input
                          type="text"
                          value={filmVideo}
                          onChange={(e) => setFilmVideo(e.target.value)}
                          placeholder="Paste YouTube watch link, share link, shorts, or embed URL"
                          className="w-full bg-black border border-white/10 focus:border-orange-500 outline-none rounded-xl px-4 py-3 text-sm text-white"
                        />
                      </div>
                    </div>

                    <div className="bg-black/40 p-5 rounded-2xl border border-white/5 space-y-3">
                      <label className="block text-xs uppercase tracking-widest text-zinc-400 font-black font-sans">Frame Aspect Orientation Option</label>
                      <div className="grid grid-cols-3 gap-3">
                        <button
                          type="button"
                          onClick={() => setFilmFrameType('auto')}
                          className={`py-2.5 px-3 rounded-xl text-xs font-black uppercase tracking-wider border transition-all ${
                            filmFrameType === 'auto'
                              ? 'bg-orange-500 border-orange-500 text-white'
                              : 'bg-black border-white/10 text-zinc-400 hover:border-white/30 hover:text-white'
                          }`}
                        >
                          ⚙ Auto Collage
                        </button>
                        <button
                          type="button"
                          onClick={() => setFilmFrameType('landscape')}
                          className={`py-2.5 px-3 rounded-xl text-xs font-black uppercase tracking-wider border transition-all ${
                            filmFrameType === 'landscape'
                              ? 'bg-emerald-500 border-emerald-500 text-white'
                              : 'bg-black border-white/10 text-zinc-400 hover:border-white/30 hover:text-white'
                          }`}
                        >
                          ↔ Landscape
                        </button>
                        <button
                          type="button"
                          onClick={() => setFilmFrameType('vertical')}
                          className={`py-2.5 px-3 rounded-xl text-xs font-black uppercase tracking-wider border transition-all ${
                            filmFrameType === 'vertical'
                              ? 'bg-indigo-500 border-indigo-500 text-white'
                              : 'bg-black border-white/10 text-zinc-400 hover:border-white/30 hover:text-white'
                          }`}
                        >
                          ↕ Vertical
                        </button>
                      </div>
                      <p className="text-zinc-500 text-[10px] font-mono uppercase tracking-wider leading-relaxed">
                        Customize how this film card builds on the Portfolio page. &quot;Vertical&quot; represents tall portrait/reel shapes. &quot;Landscape&quot; forces widescreen ratios. &quot;Auto Collage&quot; leverages our rhythmic asymmetrical portfolio mosaic grid.
                      </p>
                    </div>

                    <div className="flex gap-3 justify-end pt-4">
                      <button
                        type="button"
                        onClick={() => { setShowAddFilmForm(false); setEditingFilmIndex(null); setFilmTitle(''); setFilmImg(''); setFilmVideo(''); setFilmFrameType('auto'); }}
                        className="px-6 py-3 border border-white/10 font-bold uppercase text-[11px] rounded-full text-white/50 hover:text-white"
                      >
                        CANCEL
                      </button>
                      <button
                        type="submit"
                        className="px-8 py-3 bg-orange-500 hover:bg-orange-600 font-black uppercase text-[11px] rounded-full text-white"
                      >
                        {editingFilmIndex !== null ? 'SAVE EDITS' : 'ADD FILM TO CATALOG'}
                      </button>
                    </div>
                  </form>
                </motion.div>
              )}
            </AnimatePresence>

            {/* List Table Grid of Movie Database */}
            <div className="space-y-4">
              <div className="flex justify-between items-center bg-black p-4 rounded-2xl border border-white/5">
                <span className="text-xs uppercase font-mono tracking-widest text-white/40">Movie catalogue listing sequence</span>
                <span className="text-xs font-mono text-zinc-500">Total registered reels: <strong className="text-white font-black">{films.length}</strong></span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                {films.map((film, idx) => (
                  <motion.div 
                    key={film.id || idx}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="bg-zinc-900/60 rounded-[2rem] border border-white/5 overflow-hidden flex flex-col justify-between group"
                  >
                    <div 
                      onClick={() => {
                        if (film.video) {
                          const urlToOpen = isYouTubeUrl(film.video) ? getYouTubeWatchUrl(film.video) : film.video;
                          window.open(urlToOpen, '_blank', 'noopener,noreferrer');
                        }
                      }}
                      className={`relative aspect-video bg-black overflow-hidden ${film.video ? 'cursor-pointer group/poster' : ''}`}
                      title={film.video ? (isYouTubeUrl(film.video) ? 'Click to open in YouTube' : 'Click to open video') : undefined}
                    >
                      <img 
                        src={transformGoogleDriveUrl(film.img)} 
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" 
                        alt="cover" 
                        referrerPolicy="no-referrer"
                      />
                      <span className="absolute top-4 left-4 text-[9px] uppercase font-black bg-orange-500 text-white px-3 py-1 rounded-full tracking-widest shadow-lg z-10">
                        {film.category || 'OTT'}
                      </span>
                      <span className="absolute bottom-4 right-4 text-[9px] uppercase font-mono bg-black/70 text-white/75 px-3 py-1 rounded-md border border-white/10 z-10">
                        Seq #{idx + 1}
                      </span>

                      {/* On-Hover Play / YouTube Indicator */}
                      {film.video && (
                        <div className="absolute inset-0 bg-black/50 opacity-0 group-hover/poster:opacity-100 transition-opacity duration-300 flex flex-col items-center justify-center gap-2 z-20">
                          <div className="w-12 h-12 bg-orange-500 rounded-full flex items-center justify-center shadow-lg transform scale-90 group-hover/poster:scale-100 transition-transform duration-300">
                            {isYouTubeUrl(film.video) ? (
                              <svg className="w-6 h-6 fill-current text-white" viewBox="0 0 24 24">
                                <path d="M23.498 6.163a3.003 3.003 0 0 0-2.11-2.11C19.518 3.545 12 3.545 12 3.545s-7.518 0-9.388.507a3.003 3.003 0 0 0-2.11 2.11C0 8.033 0 12 0 12s0 3.967.502 5.837a3.003 3.003 0 0 0 2.11 2.11c1.87.507 9.388.507 9.388.507s7.518 0 9.388-.507a3.003 3.003 0 0 0 2.11-2.11C24 15.967 24 12 24 12s0-3.967-.502-5.837zM9.545 15.568V8.432L15.818 12l-6.273 3.568z"/>
                              </svg>
                            ) : (
                              <Play className="w-5 h-5 fill-current text-white translate-x-0.5" />
                            )}
                          </div>
                          <span className="text-[10px] font-black uppercase tracking-widest text-white bg-black/60 px-2.5 py-1 rounded border border-white/10">
                            {isYouTubeUrl(film.video) ? 'Open in YouTube' : 'Play Video'}
                          </span>
                        </div>
                      )}
                    </div>

                    <div className="p-6 space-y-4 text-white font-sans">
                      <div>
                        <div className="flex items-center gap-2 mb-1.5 flex-wrap">
                          <span className="bg-orange-500 text-black text-[10px] font-mono font-black uppercase px-2 py-0.5 rounded shadow-md">
                            REEL #{idx + 1}
                          </span>
                          <span className="text-zinc-500 text-[10px] font-bold">●</span>
                          <span className={`text-[9px] font-bold font-mono uppercase px-2 py-0.5 rounded tracking-wider border ${
                            film.frameType === 'vertical' ? 'bg-indigo-500/20 text-indigo-400 border-indigo-500/30' :
                            film.frameType === 'landscape' ? 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30' :
                            'bg-zinc-800 text-zinc-400 border-zinc-700'
                          }`}>
                            {film.frameType === 'vertical' ? 'Vertical ↕' : film.frameType === 'landscape' ? 'Landscape ↔' : 'Auto Collage ⚙'}
                          </span>
                        </div>
                        <h4 className="text-md font-black tracking-tight uppercase italic text-white line-clamp-1">{film.title}</h4>
                        <p 
                          className={`text-[10px] truncate mt-1 ${film.video ? 'text-orange-400 hover:underline cursor-pointer font-medium' : 'text-white/30'}`}
                          onClick={() => {
                            if (film.video) {
                              const urlToOpen = isYouTubeUrl(film.video) ? getYouTubeWatchUrl(film.video) : film.video;
                              window.open(urlToOpen, '_blank', 'noopener,noreferrer');
                            }
                          }}
                        >
                          {film.video || 'No custom trailer link'}
                        </p>
                      </div>

                      <div className="flex justify-between items-center border-t border-white/5 pt-4">
                        {/* Sort actions */}
                        <div className="flex gap-2">
                          <button 
                            type="button"
                            disabled={idx === 0}
                            onClick={() => handleMoveFilmUp(idx)}
                            className="p-2 bg-black hover:bg-white/5 text-white/60 hover:text-white rounded-lg border border-white/10 disabled:opacity-30 disabled:pointer-events-none transition-all"
                            title="Move Up"
                          >
                            <ArrowUp size={14} />
                          </button>
                          <button 
                            type="button"
                            disabled={idx === films.length - 1}
                            onClick={() => handleMoveFilmDown(idx)}
                            className="p-2 bg-black hover:bg-white/5 text-white/60 hover:text-white rounded-lg border border-white/10 disabled:opacity-30 disabled:pointer-events-none transition-all"
                            title="Move Down"
                          >
                            <ArrowDown size={14} />
                          </button>
                        </div>

                        {/* Edit delete actions */}
                        <div className="flex gap-2 font-sans">
                          <button
                            type="button"
                            onClick={() => handleStartEditFilm(idx)}
                            className="px-3.5 py-2 bg-zinc-800 hover:bg-zinc-700 text-white text-xs font-bold uppercase rounded-xl flex items-center gap-1.5 transition-all"
                          >
                            <Edit2 size={12} />
                            <span>Edit</span>
                          </button>
                          <button
                            type="button"
                            onClick={() => handleDeleteFilm(idx)}
                            className="p-2 bg-red-500/10 hover:bg-red-500 text-red-500 hover:text-white border border-red-500/10 rounded-xl transition-all"
                            title="Delete film"
                          >
                            <Trash2 size={13} />
                          </button>
                        </div>
                      </div>
                    </div>
                  </motion.div>
                ))}
              </div>
            </div>
          </div>
        )}

        {activeTab === 'team' && (
          <div className="space-y-8">
            {/* Header controls */}
            <div className="flex flex-col sm:flex-row gap-4 justify-between items-start sm:items-center">
              <div className="flex flex-wrap gap-2">
                <button
                  type="button"
                  onClick={() => { setShowAddForm(true); setIsEditing(null); }}
                  className="px-5 py-3 bg-orange-500 hover:bg-orange-600 text-white font-black uppercase tracking-wider text-xs rounded-2xl flex items-center gap-2 transition-all shadow-lg active:scale-95"
                >
                  <Plus size={16} />
                  <span>Add Img or Video Frame</span>
                </button>
                <button
                  type="button"
                  onClick={handleResetDefaults}
                  className="px-5 py-3 bg-zinc-900 hover:bg-zinc-800 text-white/80 hover:text-white font-black uppercase tracking-wider text-xs rounded-2xl flex items-center gap-2 transition-all border border-white/10"
                >
                  <RefreshCw size={14} />
                  <span>Reset Default 4</span>
                </button>
              </div>
              <span className="text-xs font-mono text-zinc-500 bg-zinc-900 px-4 py-2 rounded-full border border-white/5">
                Total Frames: <strong className="text-white font-black">{teamMembers.length}</strong>
              </span>
            </div>

            {/* Add / Edit Form Overlay */}
            <AnimatePresence>
              {(showAddForm || isEditing !== null) && (
                <motion.div
                  initial={{ opacity: 0, y: -15 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -15 }}
                  className="bg-zinc-900 border border-orange-500/30 p-6 md:p-8 rounded-[2.5rem] overflow-hidden shadow-2xl relative"
                >
                  <h3 className="text-xl font-black uppercase italic tracking-tight mb-6 text-orange-500 flex items-center gap-2">
                    {isEditing !== null ? `✍️ Edit Active Frame #${teamMembers.findIndex(m => m.id === isEditing) + 1}` : '✨ Create New Carousel Frame'}
                  </h3>
                  <form onSubmit={isEditing !== null ? handleSaveEdit : handleAddNew} className="space-y-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      {/* Name input */}
                      <div>
                        <label className="block text-xs uppercase tracking-widest text-zinc-400 font-black mb-2">Display Name</label>
                        <input
                          type="text"
                          required
                          value={name}
                          onChange={(e) => setName(e.target.value)}
                          placeholder="e.g. Rahul Mehra"
                          className="w-full bg-black border border-white/10 focus:border-orange-500 outline-none rounded-xl px-4 py-3 text-sm text-white"
                        />
                      </div>
                      {/* Role input */}
                      <div>
                        <label className="block text-xs uppercase tracking-widest text-zinc-400 font-black mb-2">Role/Tagline</label>
                        <input
                          type="text"
                          value={role}
                          onChange={(e) => setRole(e.target.value)}
                          placeholder="e.g. Lead Editor / Post-Production"
                          className="w-full bg-black border border-white/10 focus:border-orange-500 outline-none rounded-xl px-4 py-3 text-sm text-white"
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                      {/* Media selector */}
                      <div className="md:col-span-1">
                        <label className="block text-xs uppercase tracking-widest text-zinc-400 font-black mb-2">Media Type</label>
                        <div className="flex gap-2">
                          <button
                            type="button"
                            onClick={() => setMediaType('image')}
                            className={`flex-1 py-3 text-xs font-black uppercase rounded-xl border flex items-center justify-center gap-2 transition-all ${mediaType === 'image' ? 'bg-orange-500/10 border-orange-500 text-orange-500' : 'bg-black border-white/10 text-white/60 hover:text-white'}`}
                          >
                            <ImageIcon size={14} />
                            <span>IMAGE</span>
                          </button>
                          <button
                            type="button"
                            onClick={() => setMediaType('video')}
                            className={`flex-1 py-3 text-xs font-black uppercase rounded-xl border flex items-center justify-center gap-2 transition-all ${mediaType === 'video' ? 'bg-orange-500/10 border-orange-500 text-orange-500' : 'bg-black border-white/10 text-white/60 hover:text-white'}`}
                          >
                            <FileVideo size={14} />
                            <span>VIDEO</span>
                          </button>
                        </div>
                      </div>

                      {/* Media URL link input */}
                      <div className="md:col-span-2">
                        <label className="block text-xs uppercase tracking-widest text-zinc-400 font-black mb-2">
                          {mediaType === 'image' ? 'Image Direct URL' : 'Video Loop Direct URL (.mp4)'}
                        </label>
                        <input
                          type="url"
                          required
                          value={mediaUrl}
                          onChange={(e) => setMediaUrl(e.target.value)}
                          placeholder={mediaType === 'image' ? 'https://images.unsplash.com/photo-...' : 'e.g. https://www.w3schools.com/html/mov_bbb.mp4'}
                          className="w-full bg-black border border-white/10 focus:border-orange-500 outline-none rounded-xl px-4 py-3 text-sm text-white font-mono"
                        />
                      </div>
                    </div>

                    {/* Live Preview Box */}
                    {mediaUrl && (
                      <div className="p-4 bg-black/40 border border-white/5 rounded-2xl space-y-2">
                        <label className="block text-[10px] uppercase tracking-widest text-zinc-500 font-bold">Real-time Frame Preview (Auto-resolvers Active)</label>
                        <div className="flex items-center gap-4">
                          <div className="w-16 h-16 md:w-20 md:h-20 rounded-2xl overflow-hidden bg-black flex-shrink-0 border border-white/10 relative">
                            {mediaType === 'video' || (mediaUrl.endsWith('.mp4') || mediaUrl.includes('video') || mediaUrl.includes('.mov')) ? (
                              <video
                                src={transformGoogleDriveUrl(mediaUrl, 'video')}
                                muted
                                loop
                                autoPlay
                                playsInline
                                className="w-full h-full object-cover"
                                onError={(e) => { (e.target as HTMLElement).style.display = 'none'; }}
                              />
                            ) : (
                              <img
                                src={transformGoogleDriveUrl(mediaUrl, 'image')}
                                alt="Live Preview"
                                className="w-full h-full object-cover"
                                referrerPolicy="no-referrer"
                                onError={(e) => { (e.target as HTMLElement).style.display = 'none'; }}
                              />
                            )}
                          </div>
                          <div className="min-w-0">
                            <p className="text-xs font-bold text-white uppercase tracking-wider">{name || 'Unnamed Frame'}</p>
                            <p className="text-[10px] text-orange-500 font-bold uppercase tracking-widest mt-0.5">{role || 'No Role / Tagline'}</p>
                            <p className="text-[9px] font-mono text-zinc-500 mt-1 truncate max-w-sm md:max-w-lg" title={mediaUrl}>{mediaUrl}</p>
                          </div>
                        </div>
                      </div>
                    )}

                    <div className="flex justify-end gap-3 pt-4 border-t border-white/5">
                      <button
                        type="button"
                        onClick={handleCancel}
                        className="px-6 py-3 bg-zinc-800 hover:bg-zinc-700 text-white font-black uppercase text-xs tracking-wider rounded-xl transition-all"
                      >
                        Cancel
                      </button>
                      <button
                        type="submit"
                        className="px-6 py-3 bg-white text-black hover:bg-orange-500 hover:text-white font-black uppercase text-xs tracking-wider rounded-xl transition-all"
                      >
                        {isEditing !== null ? 'Save Changes' : 'Create Frame'}
                      </button>
                    </div>
                  </form>
                </motion.div>
              )}
            </AnimatePresence>

            {/* List of frames with indexing */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {teamMembers.map((member, index) => {
                const isVideo = member.mediaType === 'video' || (member.image && (member.image.endsWith('.mp4') || member.image.includes('video') || member.image.includes('.mov')));
                
                return (
                  <div
                    key={member.id}
                    className="relative flex items-center gap-5 p-4 md:p-6 bg-zinc-900/60 rounded-[2.5rem] border border-white/5 hover:border-white/15 transition-all group overflow-hidden"
                  >
                    {/* Indexing flag */}
                    <div className="absolute top-0 right-0 bg-orange-500/10 border-l border-b border-orange-500/20 px-4 py-1 text-[11px] font-mono font-black text-orange-500 rounded-bl-[1.2rem]">
                      #{String(index + 1).padStart(2, '0')}
                    </div>

                    {/* Left preview avatar */}
                    <div className="w-20 h-20 md:w-28 md:h-28 rounded-[1.8rem] overflow-hidden bg-black flex-shrink-0 border border-white/10 relative">
                      {isVideo ? (
                        <video
                          src={transformGoogleDriveUrl(member.image, 'video')}
                          muted
                          loop
                          autoPlay
                          playsInline
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <img
                          src={transformGoogleDriveUrl(member.image, 'image')}
                          alt={member.name}
                          className="w-full h-full object-cover"
                          referrerPolicy="no-referrer"
                        />
                      )}
                      
                      {/* Media Indicator badge */}
                      <div className="absolute bottom-1 right-1 p-1 bg-black/80 rounded-lg text-[9px] font-bold text-white flex items-center justify-center border border-white/10">
                        {isVideo ? <FileVideo size={10} className="text-orange-500" /> : <ImageIcon size={10} className="text-blue-400" />}
                      </div>
                    </div>

                    {/* Middle Info descriptors */}
                    <div className="flex-1 min-w-0 pr-8">
                      <p className="text-[10px] font-bold text-orange-500 uppercase tracking-widest">{member.role}</p>
                      <h4 className="text-lg md:text-xl font-bold tracking-tight text-white mt-1 uppercase truncate font-sans">{member.name}</h4>
                      <p className="text-[10px] font-mono text-zinc-500 mt-2 truncate max-w-[200px]" title={member.image}>
                        {member.image}
                      </p>
                    </div>

                    {/* Right Control actions */}
                    <div className="flex flex-col gap-1.5 justify-center">
                      <button
                        type="button"
                        onClick={() => handleMoveUp(index)}
                        disabled={index === 0}
                        title="Move Up"
                        className="p-1.5 rounded-lg bg-zinc-800 hover:bg-white hover:text-black hover:scale-105 active:scale-95 disabled:opacity-30 disabled:pointer-events-none text-white/70 transition-all font-bold"
                      >
                        <ArrowUp size={14} />
                      </button>
                      
                      <button
                        type="button"
                        onClick={() => handleMoveDown(index)}
                        disabled={index === teamMembers.length - 1}
                        title="Move Down"
                        className="p-1.5 rounded-lg bg-zinc-800 hover:bg-white hover:text-black hover:scale-105 active:scale-95 disabled:opacity-30 disabled:pointer-events-none text-white/70 transition-all font-bold"
                      >
                        <ArrowDown size={14} />
                      </button>

                      <button
                        type="button"
                        onClick={() => handleStartEdit(member)}
                        title="Edit Frame"
                        className="p-1.5 rounded-lg bg-zinc-800 hover:bg-blue-500 hover:text-white hover:scale-105 active:scale-95 text-blue-400 transition-all"
                      >
                        <Edit2 size={14} />
                      </button>

                      <button
                        type="button"
                        onClick={() => handleDelete(member.id)}
                        disabled={teamMembers.length <= 1}
                        title="Delete Frame"
                        className="p-1.5 rounded-lg bg-red-950/45 border border-red-500/10 hover:border-red-500 hover:bg-red-600 hover:text-white disabled:opacity-30 disabled:pointer-events-none text-red-400 hover:scale-105 active:scale-95 transition-all"
                      >
                        <Trash2 size={14} />
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {activeTab === 'orbit' && (
          <div className="space-y-8 animate-fade-in font-sans">
            {/* Header / Controls */}
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-zinc-900/40 p-6 rounded-3xl border border-white/5">
              <div>
                <h3 className="text-xl font-bold italic uppercase tracking-tight text-white mb-1">Orbit Frames Sequencing</h3>
                <p className="text-xs text-white/40">These images rotate in 3D around the central "DC" logo. Minimum recommended: 1 image.</p>
              </div>
              <div className="flex flex-wrap items-center gap-3">
                <button
                  type="button"
                  onClick={() => {
                    handleCancel();
                    setShowAddOrbitForm(true);
                  }}
                  className="px-5 py-2.5 bg-orange-500 hover:bg-orange-600 active:scale-95 text-black font-black uppercase text-xs tracking-wider rounded-xl transition-all shadow-lg shadow-orange-500/10 flex items-center gap-2"
                >
                  <Plus size={16} strokeWidth={3} />
                  <span>Add Star Frame</span>
                </button>
                <button
                  type="button"
                  onClick={handleResetOrbitDefaults}
                  className="px-5 py-2.5 bg-zinc-800 hover:bg-white hover:text-black active:scale-95 font-bold uppercase text-xs tracking-wider rounded-xl transition-all border border-white/10 flex items-center gap-2"
                >
                  <RefreshCw size={14} />
                  <span>Reset Defaults</span>
                </button>
              </div>
            </div>

            {/* Orbit Form overlay / Modal */}
            <AnimatePresence>
              {(showAddOrbitForm || editingOrbitIndex !== null) && (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  className="fixed inset-0 bg-black/80 backdrop-blur-md z-50 flex items-center justify-center p-4"
                >
                  <motion.div
                    initial={{ scale: 0.9, y: 20 }}
                    animate={{ scale: 1, y: 0 }}
                    exit={{ scale: 0.9, y: 20 }}
                    className="bg-zinc-900 border border-white/10 rounded-[2.5rem] p-8 max-w-lg w-full shadow-2xl relative"
                  >
                    <h2 className="text-2xl font-black italic uppercase tracking-tighter mb-4 text-orange-500">
                      {editingOrbitIndex !== null ? `Edit Rotating Star #${editingOrbitIndex + 1}` : 'Add Autumn Star Frame'}
                    </h2>
                    <p className="text-xs font-medium text-white/50 mb-6 uppercase tracking-widest font-mono">
                      Input Unsplash or direct image URLs to display inside the revolving spheres.
                    </p>

                    <form onSubmit={editingOrbitIndex !== null ? handleSaveEditOrbit : handleAddOrbitImage} className="space-y-6">
                      <div className="space-y-2">
                        <label className="text-xs uppercase font-bold tracking-widest text-white/60 block">Media URL (Google Drive, Unsplash, Direct Link)</label>
                        <input
                          type="url"
                          required
                          placeholder="https://images.unsplash.com/photo-... or Google Drive link"
                          value={editingOrbitIndex !== null ? orbitEditUrl : orbitInputUrl}
                          onChange={(e) => editingOrbitIndex !== null ? setOrbitEditUrl(e.target.value) : setOrbitInputUrl(e.target.value)}
                          className="w-full bg-black border border-white/10 rounded-xl px-4 py-3 text-white placeholder-white/20 text-sm focus:outline-none focus:border-orange-500/50 focus:ring-1 focus:ring-orange-500/20 transition-all font-mono"
                        />
                      </div>

                      <div className="space-y-2">
                        <label className="text-xs uppercase font-bold tracking-widest text-white/60 block">Media Type</label>
                        <div className="flex gap-4">
                          <button
                            type="button"
                            onClick={() => editingOrbitIndex !== null ? setOrbitEditType('image') : setOrbitInputType('image')}
                            className={`flex-1 py-3 px-4 rounded-xl text-xs font-black uppercase tracking-wider transition-all border flex items-center justify-center gap-2 ${
                              (editingOrbitIndex !== null ? orbitEditType : orbitInputType) === 'image'
                                ? 'bg-orange-500 text-black border-orange-500 font-black'
                                : 'bg-black text-white/60 border-white/10 hover:text-white hover:border-white/20'
                            }`}
                          >
                            <ImageIcon size={14} />
                            <span>Photo</span>
                          </button>
                          <button
                            type="button"
                            onClick={() => editingOrbitIndex !== null ? setOrbitEditType('video') : setOrbitInputType('video')}
                            className={`flex-1 py-3 px-4 rounded-xl text-xs font-black uppercase tracking-wider transition-all border flex items-center justify-center gap-2 ${
                              (editingOrbitIndex !== null ? orbitEditType : orbitInputType) === 'video'
                                ? 'bg-orange-500 text-black border-orange-500 font-black'
                                : 'bg-black text-white/60 border-white/10 hover:text-white hover:border-white/20'
                            }`}
                          >
                            <FileVideo size={14} />
                            <span>Video</span>
                          </button>
                        </div>
                      </div>

                      {/* URL Preview */}
                      <div className="p-4 bg-black/50 rounded-2xl border border-white/5 flex items-center gap-4">
                        <div className="w-16 h-16 rounded-full overflow-hidden border border-white/10 shrink-0 bg-zinc-950 flex items-center justify-center text-white/20 text-xs">
                          {(editingOrbitIndex !== null ? orbitEditUrl : orbitInputUrl) ? (
                            (editingOrbitIndex !== null ? orbitEditType : orbitInputType) === 'video' ? (
                              <video
                                src={transformGoogleDriveUrl(editingOrbitIndex !== null ? orbitEditUrl : orbitInputUrl, 'video')}
                                className="w-full h-full object-cover"
                                autoPlay
                                loop
                                muted
                                playsInline
                              />
                            ) : (
                              <img
                                src={transformGoogleDriveUrl(editingOrbitIndex !== null ? orbitEditUrl : orbitInputUrl, 'image')}
                                alt="Preview"
                                className="w-full h-full object-cover"
                                onError={(e) => {
                                  (e.target as HTMLImageElement).src = 'https://images.unsplash.com/photo-1542204172-3c3066385d0d?auto=format&fit=crop&q=80&w=500';
                                }}
                              />
                            )
                          ) : (
                            <ImageIcon size={20} />
                          )}
                        </div>
                        <div>
                          <p className="text-xs uppercase font-bold tracking-widest text-orange-500 mb-1">Live Orbit Preview</p>
                          <p className="text-[10px] text-white/40 truncate max-w-[240px] font-mono">
                            {(editingOrbitIndex !== null ? orbitEditUrl : orbitInputUrl) || 'No valid URL supplied'}
                          </p>
                        </div>
                      </div>

                      <div className="flex gap-4 pt-4">
                        <button
                          type="submit"
                          className="flex-1 bg-orange-500 hover:bg-orange-600 active:scale-95 text-black font-black uppercase tracking-wider text-xs py-3 rounded-xl transition-all shadow-lg shadow-orange-500/10"
                        >
                          Save Changes
                        </button>
                        <button
                          type="button"
                          onClick={handleCancel}
                          className="flex-1 bg-zinc-800 hover:bg-zinc-700 active:scale-95 text-white font-bold uppercase tracking-wider text-xs py-3 rounded-xl transition-all border border-white/5"
                        >
                          Cancel
                        </button>
                      </div>
                    </form>
                  </motion.div>
                </motion.div>
              )}
            </AnimatePresence>

            {/* Orbit List Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {orbitImages.map((item, index) => {
                let currentUrl = '';
                let currentType: 'image' | 'video' = 'image';
                if (typeof item === 'string') {
                  currentUrl = item;
                  const lower = item.toLowerCase();
                  const isVideo = lower.endsWith('.mp4') || lower.endsWith('.mov') || lower.endsWith('.webm') || (lower.includes('drive.google.com/file/d/') && (lower.includes('video') || lower.includes('playback') || lower.includes('mp4')));
                  currentType = isVideo ? 'video' : 'image';
                } else if (item && typeof item === 'object') {
                  currentUrl = item.url || '';
                  currentType = item.type === 'video' ? 'video' : 'image';
                }
                const transformedPreviewUrl = transformGoogleDriveUrl(currentUrl, currentType);

                return (
                  <div
                    key={index}
                    className="bg-zinc-900/30 rounded-3xl border border-white/5 p-5 flex items-center justify-between gap-4 hover:border-orange-500/20 hover:bg-zinc-900/50 transition-all group"
                  >
                    <div className="flex items-center gap-4 min-w-0">
                      {/* Star Index Circle */}
                      <span className="text-xl font-mono text-white/20 font-bold group-hover:text-orange-500/40 transition-colors">
                        {String(index + 1).padStart(2, '0')}
                      </span>

                      {/* Image or Video Thumbnail */}
                      <div className="relative w-16 h-16 rounded-full overflow-hidden border border-white/10 shrink-0 bg-black flex items-center justify-center">
                        {currentType === 'video' ? (
                          <div className="relative w-full h-full">
                            <video
                              src={transformedPreviewUrl}
                              className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
                              autoPlay
                              loop
                              muted
                              playsInline
                            />
                            <div className="absolute inset-0 bg-black/40 flex items-center justify-center">
                              <Play size={12} className="text-white fill-white shrink-0 animate-pulse" />
                            </div>
                          </div>
                        ) : (
                          <img
                            src={transformedPreviewUrl}
                            alt={`Rotating star ${index + 1}`}
                            className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
                            onError={(e) => {
                              (e.target as HTMLImageElement).src = 'https://images.unsplash.com/photo-1542204172-3c3066385d0d?auto=format&fit=crop&q=80&w=500';
                            }}
                          />
                        )}
                      </div>

                      <div className="min-w-0">
                        <div className="flex items-center gap-1.5">
                          <h4 className="text-sm font-bold text-white truncate max-w-[150px]">Revolving Star Frame</h4>
                          <span className={`text-[8px] uppercase tracking-wider font-extrabold px-1.5 py-0.5 rounded-full ${currentType === 'video' ? 'bg-orange-500/10 text-orange-500' : 'bg-white/10 text-white/60'}`}>
                            {currentType}
                          </span>
                        </div>
                        <p className="text-[10px] text-white/30 font-mono truncate max-w-[200px] mt-0.5">{currentUrl}</p>
                      </div>
                    </div>

                    {/* Sorting & Action buttons */}
                    <div className="flex gap-1.5 justify-center shrink-0">
                      <button
                        type="button"
                        onClick={() => handleMoveOrbitUp(index)}
                        disabled={index === 0}
                        title="Move Counter-Clockwise Sequence"
                        className="p-1.5 rounded-lg bg-zinc-800 hover:bg-white hover:text-black hover:scale-105 active:scale-95 disabled:opacity-30 disabled:pointer-events-none text-white/70 transition-all font-bold"
                      >
                        <ArrowUp size={14} />
                      </button>

                      <button
                        type="button"
                        onClick={() => handleMoveOrbitDown(index)}
                        disabled={index === orbitImages.length - 1}
                        title="Move Clockwise Sequence"
                        className="p-1.5 rounded-lg bg-zinc-800 hover:bg-white hover:text-black hover:scale-105 active:scale-95 disabled:opacity-30 disabled:pointer-events-none text-white/70 transition-all font-bold"
                      >
                        <ArrowDown size={14} />
                      </button>

                      <button
                        type="button"
                        onClick={() => handleStartEditOrbit(index)}
                        title="Edit Orbit Image"
                        className="p-1.5 rounded-lg bg-zinc-800 hover:bg-blue-500 hover:text-white hover:scale-105 active:scale-95 text-blue-400 transition-all"
                      >
                        <Edit2 size={14} />
                      </button>

                      <button
                        type="button"
                        onClick={() => handleDeleteOrbit(index)}
                        disabled={orbitImages.length <= 1}
                        title="Remove Orbit Image"
                        className="p-1.5 rounded-lg bg-red-950/45 border border-red-500/10 hover:border-red-500 hover:bg-red-600 hover:text-white disabled:opacity-30 disabled:pointer-events-none text-red-400 hover:scale-105 active:scale-95 transition-all"
                      >
                        <Trash2 size={14} />
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {activeTab === 'about_manage' && (
          <div className="space-y-8 animate-fade-in text-white font-sans pb-16">
            {/* Action buttons & controls */}
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-zinc-900/40 p-6 rounded-3xl border border-white/5">
              <div>
                <h3 className="text-xl font-bold italic uppercase tracking-tight text-white mb-1">About Us Editorial Content</h3>
                <p className="text-xs text-white/40">Adjust the visual copy, headers, metrics, and core creative tribe on your About Page.</p>
              </div>
              <div className="flex gap-3">
                <button
                  type="button"
                  onClick={handleResetAboutDetails}
                  className="px-5 py-2.5 bg-zinc-800 hover:bg-white hover:text-black active:scale-95 font-bold uppercase text-xs tracking-wider rounded-xl transition-all border border-white/10 flex items-center gap-2"
                >
                  <RefreshCw size={14} />
                  <span>Reset defaults</span>
                </button>
              </div>
            </div>

            {/* Layout Form columns */}
            <form onSubmit={handleSaveAboutDetails} className="grid grid-cols-1 lg:grid-cols-3 gap-8">
              {/* Left & Center Form fields */}
              <div className="lg:col-span-2 space-y-8">
                {/* 1. HERO HEADER AREA */}
                <div className="bg-zinc-950 border border-white/5 p-6 md:p-8 rounded-[2.5rem] space-y-6">
                  <h3 className="text-lg font-black uppercase italic tracking-tight text-orange-500 border-b border-white/5 pb-3">
                    🌌 About Hero Branding
                  </h3>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs uppercase tracking-widest text-zinc-400 font-bold mb-2">Title Line 1 (White)</label>
                      <input
                        type="text"
                        required
                        value={aboutWord1}
                        onChange={(e) => setAboutWord1(e.target.value)}
                        placeholder="e.g. Dream"
                        className="w-full bg-black border border-white/10 focus:border-orange-500/50 outline-none rounded-xl px-4 py-3 text-sm text-white"
                      />
                    </div>
                    <div>
                      <label className="block text-xs uppercase tracking-widest text-zinc-400 font-bold mb-2">Title Line 2 (Orange Accent)</label>
                      <input
                        type="text"
                        required
                        value={aboutWord2}
                        onChange={(e) => setAboutWord2(e.target.value)}
                        placeholder="e.g. Catchers"
                        className="w-full bg-black border border-white/10 focus:border-orange-500/50 outline-none rounded-xl px-4 py-3 text-sm text-white"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs uppercase tracking-widest text-zinc-400 font-bold mb-2">Branding Sub-Tagline</label>
                    <textarea
                      required
                      value={aboutTagline}
                      onChange={(e) => setAboutTagline(e.target.value)}
                      rows={3}
                      placeholder="e.g. Engineers of visual euphoria..."
                      className="w-full bg-black border border-white/10 focus:border-orange-500/50 outline-none rounded-xl px-4 py-3 text-sm text-white resize-none"
                    />
                  </div>

                  <div>
                    <label className="block text-xs uppercase tracking-widest text-zinc-400 font-bold mb-2">Background Image Cover Direct URL</label>
                    <input
                      type="url"
                      required
                      value={aboutHeroBg || ''}
                      onChange={(e) => setAboutHeroBg(e.target.value)}
                      placeholder="https://images.unsplash.com/photo-..."
                      className="w-full bg-black border border-white/10 focus:border-orange-500/50 outline-none rounded-xl px-4 py-3 text-sm text-white font-mono"
                    />
                    <div className="mt-4 rounded-2xl h-36 overflow-hidden border border-white/5 relative bg-zinc-900 flex items-center justify-center">
                      {aboutHeroBg ? (
                        <img src={aboutHeroBg} className="w-full h-full object-cover brightness-50" alt="Cover Preview" onError={(e) => { (e.target as HTMLImageElement).src = 'https://images.unsplash.com/photo-1533488765986-dfa2a9939acd?auto=format&fit=crop&q=80&w=2072'; }} />
                      ) : (
                        <span className="text-white/20 text-xs font-mono">No Cover URL Provided</span>
                      )}
                      <div className="absolute inset-0 bg-gradient-to-t from-black/80 to-transparent flex items-end p-4">
                        <span className="text-[10px] font-mono tracking-widest uppercase font-bold text-orange-500">Live Background Cover Preview</span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* 2. THE GENESIS BIOGRAPHY STORIES */}
                <div className="bg-zinc-950 border border-white/5 p-6 md:p-8 rounded-[2.5rem] space-y-6">
                  <h3 className="text-lg font-black uppercase italic tracking-tight text-orange-500 border-b border-white/5 pb-3">
                    🎬 The Genesis Biography
                  </h3>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs uppercase tracking-widest text-zinc-400 font-bold mb-2">Genesis Tag Name</label>
                      <input
                        type="text"
                        required
                        value={aboutGenesisSub}
                        onChange={(e) => setAboutGenesisSub(e.target.value)}
                        placeholder="e.g. The Genesis"
                        className="w-full bg-black border border-white/10 focus:border-orange-500/50 outline-none rounded-xl px-4 py-3 text-sm text-white"
                      />
                    </div>
                    <div>
                      <label className="block text-xs uppercase tracking-widest text-zinc-400 font-bold mb-2">Genesis Main Heading</label>
                      <input
                        type="text"
                        required
                        value={aboutGenesisTitle}
                        onChange={(e) => setAboutGenesisTitle(e.target.value)}
                        placeholder="Where Magic Finds Its Form."
                        className="w-full bg-black border border-white/10 focus:border-orange-500/50 outline-none rounded-xl px-4 py-3 text-sm text-white"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs uppercase tracking-widest text-zinc-400 font-bold mb-2">Intro Biography Paragraph 1</label>
                    <textarea
                      required
                      value={aboutGenesisP1}
                      onChange={(e) => setAboutGenesisP1(e.target.value)}
                      rows={3}
                      placeholder="..."
                      className="w-full bg-black border border-white/10 focus:border-orange-500/50 outline-none rounded-xl px-4 py-3 text-sm text-white resize-none"
                    />
                  </div>

                  <div>
                    <label className="block text-xs uppercase tracking-widest text-zinc-400 font-bold mb-2">Intro Biography Paragraph 2</label>
                    <textarea
                      required
                      value={aboutGenesisP2}
                      onChange={(e) => setAboutGenesisP2(e.target.value)}
                      rows={3}
                      placeholder="..."
                      className="w-full bg-black border border-white/10 focus:border-orange-500/50 outline-none rounded-xl px-4 py-3 text-sm text-white resize-none"
                    />
                  </div>

                  {/* 2b. THE EVOLUTION BIOGRAPHY STORIES */}
                  <div className="pt-6 border-t border-white/5 space-y-4">
                    <h4 className="text-sm font-black text-orange-500 uppercase tracking-wider">
                      🚀 Evolution Section
                    </h4>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-xs uppercase tracking-widest text-zinc-400 font-bold mb-2">Evolution Tag Name</label>
                        <input
                          type="text"
                          required
                          value={aboutGenesisSub3}
                          onChange={(e) => setAboutGenesisSub3(e.target.value)}
                          placeholder="e.g. Our Evolution"
                          className="w-full bg-black border border-white/10 focus:border-orange-500/50 outline-none rounded-xl px-4 py-3 text-sm text-white"
                        />
                      </div>
                      <div>
                        <label className="block text-xs uppercase tracking-widest text-zinc-400 font-bold mb-2">Evolution Heading</label>
                        <input
                          type="text"
                          required
                          value={aboutGenesisTitle3}
                          onChange={(e) => setAboutGenesisTitle3(e.target.value)}
                          placeholder="From Curiosity to Creation"
                          className="w-full bg-black border border-white/10 focus:border-orange-500/50 outline-none rounded-xl px-4 py-3 text-sm text-white"
                        />
                      </div>
                    </div>
                    <div>
                      <label className="block text-xs uppercase tracking-widest text-zinc-400 font-bold mb-2">Evolution Description Paragraph</label>
                      <textarea
                        required
                        value={aboutGenesisP3}
                        onChange={(e) => setAboutGenesisP3(e.target.value)}
                        rows={4}
                        placeholder="..."
                        className="w-full bg-black border border-white/10 focus:border-orange-500/50 outline-none rounded-xl px-4 py-3 text-sm text-white resize-none"
                      />
                    </div>
                  </div>
                </div>
              </div>

              {/* Right panel: METRICS & SUBMIT ACTIONS */}
              <div className="space-y-8">
                {/* 3. METRICS / STAT COUNTERS */}
                <div className="bg-zinc-950 border border-white/5 p-6 rounded-[2.5rem] space-y-6">
                  <h3 className="text-lg font-black uppercase italic tracking-tight text-orange-500 border-b border-white/5 pb-2">
                    📊 Studio Metrics
                  </h3>

                  <div className="space-y-4">
                    {/* Stat Card 1 */}
                    <div className="p-3 bg-black/60 rounded-2xl border border-white/5 grid grid-cols-3 gap-3">
                      <div className="col-span-1">
                        <label className="block text-[9px] uppercase tracking-wider text-zinc-500 font-bold mb-1">Value</label>
                        <input
                          type="text"
                          required
                          value={aboutStat1Val}
                          onChange={(e) => setAboutStat1Val(e.target.value)}
                          className="w-full bg-zinc-900 border border-white/10 focus:border-orange-500/50 outline-none rounded-xl p-2 text-xs text-orange-500 font-extrabold text-center"
                        />
                      </div>
                      <div className="col-span-2">
                        <label className="block text-[9px] uppercase tracking-wider text-zinc-500 font-bold mb-1">Label Title</label>
                        <input
                          type="text"
                          required
                          value={aboutStat1Lbl}
                          onChange={(e) => setAboutStat1Lbl(e.target.value)}
                          className="w-full bg-zinc-900 border border-white/10 focus:border-orange-500/50 outline-none rounded-xl p-2 text-xs text-white"
                        />
                      </div>
                    </div>

                    {/* Stat Card 2 */}
                    <div className="p-3 bg-black/60 rounded-2xl border border-white/5 grid grid-cols-3 gap-3">
                      <div className="col-span-1">
                        <label className="block text-[9px] uppercase tracking-wider text-zinc-500 font-bold mb-1">Value</label>
                        <input
                          type="text"
                          required
                          value={aboutStat2Val}
                          onChange={(e) => setAboutStat2Val(e.target.value)}
                          className="w-full bg-zinc-900 border border-white/10 focus:border-orange-500/50 outline-none rounded-xl p-2 text-xs text-orange-500 font-extrabold text-center"
                        />
                      </div>
                      <div className="col-span-2">
                        <label className="block text-[9px] uppercase tracking-wider text-zinc-500 font-bold mb-1">Label Title</label>
                        <input
                          type="text"
                          required
                          value={aboutStat2Lbl}
                          onChange={(e) => setAboutStat2Lbl(e.target.value)}
                          className="w-full bg-zinc-900 border border-white/10 focus:border-orange-500/50 outline-none rounded-xl p-2 text-xs text-white"
                        />
                      </div>
                    </div>

                    {/* Stat Card 3 */}
                    <div className="p-3 bg-black/60 rounded-2xl border border-white/5 grid grid-cols-3 gap-3">
                      <div className="col-span-1">
                        <label className="block text-[9px] uppercase tracking-wider text-zinc-500 font-bold mb-1">Value</label>
                        <input
                          type="text"
                          required
                          value={aboutStat3Val}
                          onChange={(e) => setAboutStat3Val(e.target.value)}
                          className="w-full bg-zinc-900 border border-white/10 focus:border-orange-500/50 outline-none rounded-xl p-2 text-xs text-orange-500 font-extrabold text-center"
                        />
                      </div>
                      <div className="col-span-2">
                        <label className="block text-[9px] uppercase tracking-wider text-zinc-500 font-bold mb-1">Label Title</label>
                        <input
                          type="text"
                          required
                          value={aboutStat3Lbl}
                          onChange={(e) => setAboutStat3Lbl(e.target.value)}
                          className="w-full bg-zinc-900 border border-white/10 focus:border-orange-500/50 outline-none rounded-xl p-2 text-xs text-white"
                        />
                      </div>
                    </div>

                    {/* Stat Card 4 */}
                    <div className="p-3 bg-black/60 rounded-2xl border border-white/5 grid grid-cols-3 gap-3">
                      <div className="col-span-1">
                        <label className="block text-[9px] uppercase tracking-wider text-zinc-500 font-bold mb-1">Value</label>
                        <input
                          type="text"
                          required
                          value={aboutStat4Val}
                          onChange={(e) => setAboutStat4Val(e.target.value)}
                          className="w-full bg-zinc-900 border border-white/10 focus:border-orange-500/50 outline-none rounded-xl p-2 text-xs text-orange-500 font-extrabold text-center"
                        />
                      </div>
                      <div className="col-span-2">
                        <label className="block text-[9px] uppercase tracking-wider text-zinc-500 font-bold mb-1">Label Title</label>
                        <input
                          type="text"
                          required
                          value={aboutStat4Lbl}
                          onChange={(e) => setAboutStat4Lbl(e.target.value)}
                          className="w-full bg-zinc-900 border border-white/10 focus:border-orange-500/50 outline-none rounded-xl p-2 text-xs text-white"
                        />
                      </div>
                    </div>
                  </div>
                </div>

                {/* SUBMIT FORM BUTTONS */}
                <div className="bg-zinc-950 border border-white/5 p-6 rounded-[2.5rem] flex flex-col gap-3">
                  <button
                    type="submit"
                    className="w-full bg-orange-500 hover:bg-orange-600 active:scale-95 text-black font-black uppercase text-xs py-4 tracking-wider rounded-xl transition-all shadow-lg shadow-orange-500/10"
                  >
                    🚀 Save Editorial Changes
                  </button>
                  <button
                    type="button"
                    onClick={() => setActiveTab('categories')}
                    className="w-full bg-zinc-800 hover:bg-zinc-700 active:scale-95 text-white font-bold uppercase text-[10px] py-4 tracking-wider rounded-xl transition-all border border-white/5"
                  >
                    Back to Control Panel
                  </button>
                </div>
              </div>
            </form>

            {/* 4. ABOUT DREAM TEAM SEQUENCERS */}
            <div className="bg-zinc-950 border border-white/5 p-6 md:p-8 rounded-[2.5rem] space-y-8 mt-12">
              <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                <div>
                  <h3 className="text-xl font-black uppercase italic tracking-tight text-white flex items-center gap-2">
                    👥 Dream Team Tribe Profiles
                  </h3>
                  <p className="text-xs text-white/40 font-medium">Re-sequence and edit the personal profile cards displayed on your public Story. Minimum recommended: 1 profile.</p>
                </div>
                <button
                  type="button"
                  onClick={() => {
                    setEditingAboutTeamIndex(null);
                    setAboutTeamName('');
                    setAboutTeamRole('');
                    setAboutTeamImg('');
                    setShowAddAboutTeamForm(true);
                  }}
                  className="px-5 py-2.5 bg-orange-500 hover:bg-orange-600 active:scale-95 text-black font-black uppercase text-xs tracking-wider rounded-xl transition-all shadow-lg shadow-orange-500/10 flex items-center gap-2"
                >
                  <Plus size={16} strokeWidth={3} />
                  <span>Add Member Card</span>
                </button>
              </div>

              {/* Form trigger overlay (About team card) */}
              <AnimatePresence>
                {(showAddAboutTeamForm || editingAboutTeamIndex !== null) && (
                  <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className="p-6 bg-zinc-900 rounded-[2rem] border border-orange-500/20 shadow-xl space-y-6"
                  >
                    <h4 className="text-sm font-black uppercase tracking-wider text-orange-500 flex items-center gap-2">
                      {editingAboutTeamIndex !== null ? `✍️ EDIT TRIBE MEMBER #${editingAboutTeamIndex + 1}` : '✨ WORKSPACE: CREATE NEW MEMBER PROFILE'}
                    </h4>
                    <form onSubmit={editingAboutTeamIndex !== null ? handleSaveEditAboutTeam : handleAddAboutTeamMember} className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div>
                        <label className="block text-[10px] uppercase font-black text-white/40 mb-2">Display Name</label>
                        <input
                          type="text"
                          required
                          value={aboutTeamName}
                          onChange={(e) => setAboutTeamName(e.target.value)}
                          placeholder="ARJUN SHARMA"
                          className="w-full bg-black border border-white/10 rounded-xl px-4 py-3 text-sm text-white"
                        />
                      </div>
                      <div>
                        <label className="block text-[10px] uppercase font-black text-white/40 mb-2">Avatar URL (Direct link)</label>
                        <input
                          type="url"
                          required
                          value={aboutTeamImg}
                          onChange={(e) => setAboutTeamImg(e.target.value)}
                          placeholder="https://images.unsplash.com/photo-..."
                          className="w-full bg-black border border-white/10 rounded-xl px-4 py-3 text-sm text-white font-mono"
                        />
                      </div>

                      {/* Preview avatar */}
                      <div className="md:col-span-2 flex items-center gap-4 bg-black/40 p-4 rounded-2xl border border-white/5">
                        <div className="w-14 h-14 rounded-full overflow-hidden border border-white/10 shrink-0 bg-zinc-950">
                          {aboutTeamImg ? (
                            <img src={transformGoogleDriveUrl(aboutTeamImg, 'image')} className="w-full h-full object-cover" alt="Preview Image" onError={(e) => { (e.target as HTMLImageElement).src = 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&q=80&w=400'; }} />
                          ) : (
                            <div className="w-full h-full flex items-center justify-center text-white/20"><Users size={20} /></div>
                          )}
                        </div>
                        <div>
                          <p className="text-xs uppercase font-extrabold text-white">{aboutTeamName || 'Tribe Member Name'}</p>
                        </div>
                      </div>

                      <div className="md:col-span-2 flex justify-end gap-3 pt-2">
                        <button
                          type="button"
                          onClick={() => {
                            setShowAddAboutTeamForm(false);
                            setEditingAboutTeamIndex(null);
                            setAboutTeamName('');
                            setAboutTeamRole('');
                            setAboutTeamImg('');
                          }}
                          className="px-5 py-2.5 bg-zinc-800 hover:bg-zinc-700 text-white font-bold uppercase text-[10px] tracking-wider rounded-xl transition-all"
                        >
                          Cancel
                        </button>
                        <button
                          type="submit"
                          className="px-5 py-2.5 bg-white hover:bg-orange-500 hover:text-white text-black font-black uppercase text-[10px] tracking-wider rounded-xl transition-all"
                        >
                          {editingAboutTeamIndex !== null ? 'Save Tribe Card' : 'Insert Member Card'}
                        </button>
                      </div>
                    </form>
                  </motion.div>
                )}
              </AnimatePresence>

              {/* Members Dynamic Grid cards */}
              <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
                {aboutTeam.map((member, index) => {
                  return (
                    <div
                      key={index}
                      className="relative bg-black/40 border border-white/5 hover:border-orange-500/20 group p-5 rounded-[2rem] flex items-center gap-4 transition-all"
                    >
                      {/* Flag counter */}
                      <span className="absolute top-2 right-4 font-mono text-[10.5px] text-white/30 font-black">
                        #{String(index + 1).padStart(2, '0')}
                      </span>

                      {/* Left Thumbnail */}
                      <div className="w-16 h-16 rounded-2xl overflow-hidden shrink-0 border border-white/10 bg-zinc-950">
                        <img
                          src={transformGoogleDriveUrl(member.img, 'image')}
                          alt={member.name}
                          className="w-full h-full object-cover scale-100 group-hover:scale-105 duration-500 transition-transform"
                          onError={(e) => { (e.target as HTMLImageElement).src = 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&q=80&w=400'; }}
                        />
                      </div>

                      {/* Middle Details */}
                      <div className="flex-1 min-w-0 pr-12">
                        <h4 className="text-sm font-black text-white truncate uppercase tracking-tight">{member.name}</h4>
                      </div>

                      {/* Action buttons list */}
                      <div className="flex flex-col gap-1 inline-flex shrink-0">
                        <button
                          type="button"
                          onClick={() => handleMoveAboutTeamUp(index)}
                          disabled={index === 0}
                          className="p-1 rounded bg-zinc-800 text-white/50 hover:text-white disabled:opacity-20 disabled:pointer-events-none"
                        >
                          <ArrowUp size={12} />
                        </button>
                        <button
                          type="button"
                          onClick={() => handleMoveAboutTeamDown(index)}
                          disabled={index === aboutTeam.length - 1}
                          className="p-1 rounded bg-zinc-800 text-white/50 hover:text-white disabled:opacity-20 disabled:pointer-events-none"
                        >
                          <ArrowDown size={12} />
                        </button>
                        <button
                          type="button"
                          onClick={() => handleStartEditAboutTeam(index)}
                          className="p-1 rounded bg-zinc-800 text-blue-400 hover:text-white"
                        >
                          <Edit2 size={12} />
                        </button>
                        <button
                          type="button"
                          onClick={() => handleDeleteAboutTeam(index)}
                          disabled={aboutTeam.length <= 1}
                          className="p-1 rounded bg-zinc-800 text-red-400 hover:text-white disabled:opacity-20"
                        >
                          <Trash2 size={12} />
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        )}

        {activeTab === 'contact_manage' && (
          <div className="space-y-8 animate-fade-in text-white font-sans max-w-4xl pb-16">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-zinc-900/40 p-6 rounded-3xl border border-white/5">
              <div>
                <h3 className="text-xl font-bold italic uppercase tracking-tight text-white mb-1">Contact Channels & Social Media Profiles</h3>
                <p className="text-xs text-white/40">Manage headings, physical address, support email, phone numbers, and footer social media links.</p>
              </div>
              <div className="flex gap-3">
                <button
                  type="button"
                  onClick={handleResetContactDetails}
                  className="px-5 py-2.5 bg-zinc-800 hover:bg-white hover:text-black active:scale-95 font-bold uppercase text-xs tracking-wider rounded-xl transition-all border border-white/10 flex items-center gap-2"
                >
                  <RefreshCw size={14} />
                  <span>Restore Defaults</span>
                </button>
              </div>
            </div>

            <form onSubmit={handleSaveContactDetails} className="bg-zinc-950 border border-white/5 p-6 md:p-8 rounded-[2.5rem] space-y-6">
              <h3 className="text-lg font-black uppercase italic tracking-tight text-orange-500 border-b border-white/5 pb-3">
                📬 Contact Branding & Channel Details
              </h3>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div>
                  <label className="block text-xs uppercase tracking-widest text-zinc-400 font-bold mb-2">Display Heading Word 1</label>
                  <input
                    type="text"
                    required
                    value={contactTitleFirst}
                    onChange={(e) => setContactTitleFirst(e.target.value)}
                    className="w-full bg-black border border-white/10 focus:border-orange-500/50 outline-none rounded-xl px-4 py-3 text-sm text-white"
                  />
                </div>
                <div>
                  <label className="block text-xs uppercase tracking-widest text-zinc-400 font-bold mb-2">Display Heading Word 2 (Orange Accent)</label>
                  <input
                    type="text"
                    required
                    value={contactTitleOrange}
                    onChange={(e) => setContactTitleOrange(e.target.value)}
                    className="w-full bg-black border border-white/10 focus:border-orange-500/50 outline-none rounded-xl px-4 py-3 text-sm text-white"
                  />
                </div>
                <div>
                  <label className="block text-xs uppercase tracking-widest text-zinc-400 font-bold mb-2">Intro Subheading Description</label>
                  <input
                    type="text"
                    required
                    value={contactSubtitle}
                    onChange={(e) => setContactSubtitle(e.target.value)}
                    className="w-full bg-black border border-white/10 focus:border-orange-500/50 outline-none rounded-xl px-4 py-3 text-sm text-white"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-xs uppercase tracking-widest text-zinc-400 font-bold mb-2">Official Channel Support Email</label>
                  <input
                    type="email"
                    required
                    value={contactEmail}
                    onChange={(e) => setContactEmail(e.target.value)}
                    className="w-full bg-black border border-white/10 focus:border-orange-500/50 outline-none rounded-xl px-4 py-3 text-sm text-white font-mono"
                  />
                </div>
                <div>
                  <label className="block text-xs uppercase tracking-widest text-zinc-400 font-bold mb-2">Official Channel Inbound Phone</label>
                  <input
                    type="text"
                    required
                    value={contactPhone}
                    onChange={(e) => setContactPhone(e.target.value)}
                    className="w-full bg-black border border-white/10 focus:border-orange-500/50 outline-none rounded-xl px-4 py-3 text-sm text-white font-sans"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs uppercase tracking-widest text-zinc-400 font-bold mb-2">Studio Visits Physical Address</label>
                <input
                  type="text"
                  required
                  value={contactAddress}
                  onChange={(e) => setContactAddress(e.target.value)}
                  className="w-full bg-black border border-white/10 focus:border-orange-500/50 outline-none rounded-xl px-4 py-3 text-sm text-white"
                />
              </div>

              <h3 className="text-lg font-black uppercase italic tracking-tight text-orange-500 border-b border-white/5 pb-3">
                🌐 Social Media Accounts (Footer Icons)
              </h3>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-xs uppercase tracking-widest text-zinc-400 font-bold mb-2">Instagram Link</label>
                  <input
                    type="text"
                    value={socialInstagram}
                    onChange={(e) => setSocialInstagram(e.target.value)}
                    placeholder="e.g. https://instagram.com/dreamcatchers"
                    className="w-full bg-black border border-white/10 focus:border-orange-500/50 outline-none rounded-xl px-4 py-3 text-sm text-white font-mono"
                  />
                </div>
                <div>
                  <label className="block text-xs uppercase tracking-widest text-zinc-400 font-bold mb-2">Facebook Link</label>
                  <input
                    type="text"
                    value={socialFacebook}
                    onChange={(e) => setSocialFacebook(e.target.value)}
                    placeholder="e.g. https://facebook.com/dreamcatchers"
                    className="w-full bg-black border border-white/10 focus:border-orange-500/50 outline-none rounded-xl px-4 py-3 text-sm text-white font-mono"
                  />
                </div>
                <div>
                  <label className="block text-xs uppercase tracking-widest text-zinc-400 font-bold mb-2">YouTube Link</label>
                  <input
                    type="text"
                    value={socialYoutube}
                    onChange={(e) => setSocialYoutube(e.target.value)}
                    placeholder="e.g. https://youtube.com/c/dreamcatchers"
                    className="w-full bg-black border border-white/10 focus:border-orange-500/50 outline-none rounded-xl px-4 py-3 text-sm text-white font-mono"
                  />
                </div>
                <div>
                  <label className="block text-xs uppercase tracking-widest text-zinc-400 font-bold mb-2">Twitter Link</label>
                  <input
                    type="text"
                    value={socialTwitter}
                    onChange={(e) => setSocialTwitter(e.target.value)}
                    placeholder="e.g. https://twitter.com/dreamcatchers"
                    className="w-full bg-black border border-white/10 focus:border-orange-500/50 outline-none rounded-xl px-4 py-3 text-sm text-white font-mono"
                  />
                </div>
              </div>

              {/* Submit panel */}
              <div className="flex gap-4 pt-4 border-t border-white/5">
                <button
                  type="submit"
                  className="flex-1 bg-orange-500 hover:bg-orange-600 active:scale-95 text-black font-black uppercase text-xs py-3 rounded-xl transition-all shadow-lg"
                >
                  Apply & Commit Contact Channel Details
                </button>
                <button
                  type="button"
                  onClick={() => setActiveTab('categories')}
                  className="px-6 py-3 bg-zinc-855 hover:bg-zinc-800 text-white font-bold uppercase text-xs rounded-xl transition-all border border-white/5"
                >
                  Cancel
                </button>
              </div>
            </form>

            {/* Corporate Stations & Maps Management section */}
            <div className="bg-zinc-950 border border-white/5 p-6 md:p-8 rounded-[2.5rem] space-y-6">
              <div className="border-b border-white/5 pb-3">
                <h3 className="text-lg font-black uppercase italic tracking-tight text-orange-500 flex items-center gap-2">
                  <MapPin size={20} className="text-orange-500" />
                  <span>Corporate Stations & Map Controls</span>
                </h3>
                <p className="text-xs text-white/40 mt-1">
                  Upload custom map images and link Google Map coordinates for each global shoot base or corporate station.
                </p>
              </div>

              <div className="space-y-6">
                {locations.map((loc, idx) => {
                  return (
                    <div key={loc.id} className="bg-zinc-900/30 border border-white/5 p-5 rounded-2xl space-y-4">
                      <div className="flex items-center justify-between pb-2 border-b border-white/5">
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded-lg bg-orange-500/10 flex items-center justify-center border border-orange-500/20">
                            <span className="text-orange-500 font-sans text-xs font-black italic">{idx + 1}</span>
                          </div>
                          <div>
                            <h4 className="text-sm font-black uppercase tracking-wider text-white">{loc.cityAlt}</h4>
                            <p className="text-[10px] text-zinc-500">{loc.title}</p>
                          </div>
                        </div>
                        {loc.mapImage && (
                          <button
                            type="button"
                            onClick={() => {
                              const updated = [...locations];
                              updated[idx] = { ...updated[idx], mapImage: "" };
                              setLocations(updated);
                            }}
                            className="text-[10px] uppercase tracking-widest font-black text-rose-500 hover:text-rose-450 transition-colors bg-rose-500/5 px-2.5 py-1 rounded-md border border-rose-500/10"
                          >
                            Reset to Vector Map
                          </button>
                        )}
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="space-y-4">
                          {/* Google Map URL Input */}
                          <div>
                            <label className="block text-xs uppercase tracking-widest text-zinc-400 font-bold mb-2">Google Map Redirect URL (On Click)</label>
                            <input
                              type="text"
                              value={loc.mapsUrl}
                              onChange={(e) => {
                                const updated = [...locations];
                                updated[idx] = { ...updated[idx], mapsUrl: e.target.value };
                                setLocations(updated);
                              }}
                              placeholder="https://maps.google.com/?q=..."
                              className="w-full bg-black border border-white/10 focus:border-orange-500/50 outline-none rounded-xl px-4 py-2.5 text-sm text-white font-mono"
                            />
                          </div>

                          {/* Text input path for Web Image URL */}
                          <div>
                            <label className="block text-xs uppercase tracking-widest text-zinc-400 font-bold mb-2">Map Image URL</label>
                            <input
                              type="text"
                              value={loc.mapImage || ""}
                              onChange={(e) => {
                                const url = transformGoogleDriveUrl(e.target.value);
                                const updated = [...locations];
                                updated[idx] = { ...updated[idx], mapImage: url };
                                setLocations(updated);
                              }}
                              placeholder="Enter image URL or upload file on right..."
                              className="w-full bg-black border border-white/10 focus:border-orange-500/50 outline-none rounded-xl px-4 py-2.5 text-sm text-white"
                            />
                          </div>
                        </div>

                        {/* File Upload / Image drag-and-drop preview block */}
                        <div>
                          <label className="block text-xs uppercase tracking-widest text-zinc-400 font-bold mb-2">Map Image File (Upload)</label>
                          <div className="grid grid-cols-3 gap-3 h-[96px]">
                            {/* drag and drop file selector box */}
                            <div
                              onClick={() => {
                                const fInput = document.getElementById(`file-input-loc-${loc.id}`);
                                if (fInput) fInput.click();
                              }}
                              className="col-span-2 relative border border-dashed border-white/15 hover:border-orange-500/50 bg-black/40 rounded-xl flex flex-col items-center justify-center text-center cursor-pointer transition-all p-2 group"
                            >
                              <input
                                id={`file-input-loc-${loc.id}`}
                                type="file"
                                accept="image/*"
                                className="hidden"
                                onChange={(e) => {
                                  if (e.target.files && e.target.files[0]) {
                                    const file = e.target.files[0];
                                    const reader = new FileReader();
                                    reader.onload = (evt) => {
                                      if (evt.target && typeof evt.target.result === "string") {
                                        const updated = [...locations];
                                        updated[idx] = { ...updated[idx], mapImage: evt.target.result };
                                        setLocations(updated);
                                      }
                                    };
                                    reader.readAsDataURL(file);
                                  }
                                }}
                              />
                              <Upload size={18} className="text-zinc-500 group-hover:text-orange-500 transition-colors mb-1" />
                              <span className="text-[9px] font-black uppercase text-zinc-400 select-none">UPLOAD FILE</span>
                              <span className="text-[8px] text-zinc-500 select-none">PNG, JPG, WebP</span>
                            </div>

                            {/* Map element Preview */}
                            <div className="border border-white/5 bg-black rounded-xl overflow-hidden flex items-center justify-center relative justify-items-center">
                              {loc.mapImage ? (
                                <img
                                  src={loc.mapImage}
                                  alt="Preview"
                                  className="w-full h-full object-contain p-1.5"
                                  referrerPolicy="no-referrer"
                                />
                              ) : (
                                <div className="text-center p-2">
                                  <span className="text-[8px] font-mono font-bold text-zinc-500 block uppercase">VECTOR</span>
                                  <span className="text-[7px] text-zinc-600 block mt-0.5 font-bold">ACTIVE</span>
                                </div>
                              )}
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>

              <div className="pt-4 border-t border-white/5 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div className="flex flex-wrap gap-3">
                  <button
                    type="button"
                    onClick={() => {
                      saveLocations(locations);
                      setMapSavedStatus('Map configuration successfully committed!');
                      setTimeout(() => setMapSavedStatus(''), 4000);
                    }}
                    className="px-6 py-3 bg-orange-500 hover:bg-orange-600 active:scale-95 text-black border border-orange-500 rounded-xl transition-all font-black uppercase text-xs tracking-wider flex items-center gap-2 shadow-lg"
                  >
                    <Save size={14} />
                    <span>Apply & Save Map Changes</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      if (confirm("Reset all operational map base URLs and custom images to original defaults?")) {
                        saveLocations(DEFAULT_LOCATIONS);
                        setLocations(DEFAULT_LOCATIONS);
                        setMapSavedStatus('Map configuration reset to defaults!');
                        setTimeout(() => setMapSavedStatus(''), 4000);
                      }
                    }}
                    className="px-5 py-2.5 bg-zinc-800 hover:bg-white hover:text-black active:scale-95 text-white border border-white/10 rounded-xl transition-all font-bold uppercase text-xs tracking-wider flex items-center gap-2"
                  >
                    <RefreshCw size={12} />
                    <span>Restore Map Defaults</span>
                  </button>
                </div>

                <AnimatePresence>
                  {mapSavedStatus && (
                    <motion.div
                      initial={{ opacity: 0, x: 20 }}
                      animate={{ opacity: 1, x: 0 }}
                      exit={{ opacity: 0, x: 20 }}
                      className="text-xs text-emerald-400 font-mono font-bold flex items-center gap-1.5 bg-emerald-500/10 px-3.5 py-2 rounded-xl border border-emerald-500/20"
                    >
                      <Check size={14} className="text-emerald-400 animate-pulse" />
                      <span>{mapSavedStatus}</span>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            </div>
          </div>
        )}

        {/* 6. BRAND PAGE PARTNERS MANAGE BLOCK */}
        {activeTab === 'brand_manage' && (
          <div className="space-y-8 animate-fade-in text-white font-sans max-w-5xl pb-16">
            {/* Top Back Controls */}
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-zinc-900/40 p-4 rounded-3xl border border-white/5">
              <button 
                onClick={() => setActiveTab('categories')}
                className="flex items-center gap-2 px-5 py-2.5 rounded-full border border-white/10 hover:border-white/30 text-xs font-black uppercase tracking-wider text-white bg-black hover:text-orange-500 transition-all font-sans"
              >
                <ChevronLeft size={16} />
                <span>BACK TO CONTROL CENTER</span>
              </button>
              <div className="flex gap-2">
                <button
                  onClick={handleResetBrandPartners}
                  className="px-5 py-2.5 bg-yellow-600/10 hover:bg-yellow-600 hover:text-black hover:border-yellow-600 text-yellow-500 rounded-full text-xs font-black uppercase tracking-wider transition-all border border-yellow-500/10 flex items-center gap-2"
                >
                  <RefreshCw size={12} />
                  <span>Restore Defaults</span>
                </button>
                <button
                  onClick={() => {
                    setEditingBrandIndex(null);
                    setBrandName('');
                    setBrandCategory('platforms');
                    setBrandLogoUrl('');
                    setBrandDescription('');
                    setLogoInputType('upload');
                    setShowAddBrandForm(!showAddBrandForm);
                  }}
                  className="px-5 py-2.5 bg-orange-500 text-white hover:bg-orange-600 rounded-full text-xs font-black uppercase tracking-wider transition-all flex items-center gap-2"
                >
                  <Plus size={14} />
                  <span>{showAddBrandForm ? 'Close Editor' : 'Add New Partner'}</span>
                </button>
              </div>
            </div>

            {/* Editor form (Add / Edit) */}
            {(showAddBrandForm || editingBrandIndex !== null) && (
              <form 
                onSubmit={editingBrandIndex !== null ? handleUpdateBrandPartner : handleAddBrandPartner}
                className="bg-zinc-950 border border-white/5 p-6 md:p-8 rounded-[2.5rem] space-y-6"
              >
                <h3 className="text-xl font-black italic uppercase tracking-tight text-orange-500 border-b border-white/5 pb-3">
                  {editingBrandIndex !== null ? '✏️ Edit Partner Logo Profile' : '➕ Add Partner Logo Profile'}
                </h3>
                
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  <div>
                    <label className="block text-xs uppercase tracking-widest text-zinc-400 font-bold mb-2">Partner Name (e.g. Rolex)</label>
                    <input
                      type="text"
                      required
                      value={brandName}
                      onChange={(e) => setBrandName(e.target.value)}
                      placeholder="Enter brand or government department name"
                      className="w-full bg-black border border-white/10 focus:border-orange-500/50 outline-none rounded-xl px-4 py-3 text-sm text-white"
                    />
                  </div>

                  <div>
                    <label className="block text-xs uppercase tracking-widest text-zinc-400 font-bold mb-2">Category Segment</label>
                    <select
                      value={brandCategory}
                      onChange={(e) => setBrandCategory(e.target.value as any)}
                      className="w-full bg-black border border-white/10 focus:border-orange-500/50 outline-none rounded-xl px-4 py-3 text-sm text-white"
                    >
                      <option value="platforms">PLATFORMS (platforms)</option>
                      <option value="govt">GOVT (govt)</option>
                      <option value="corporates">CORPORATES (corporates)</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs uppercase tracking-widest text-zinc-400 font-bold mb-2">Logo Size Class</label>
                    <select
                      value={brandLogoSize}
                      onChange={(e) => setBrandLogoSize(e.target.value as any)}
                      className="w-full bg-black border border-white/10 focus:border-orange-500/50 outline-none rounded-xl px-4 py-3 text-sm text-white font-medium"
                    >
                      <option value="small">Small (65% width scale)</option>
                      <option value="medium">Medium (85% standard scale)</option>
                      <option value="large">Large (100% full scale)</option>
                      <option value="xlarge">Extra Large (115% prominent scale)</option>
                    </select>
                  </div>
                </div>

                <div className="grid grid-cols-1 gap-6">
                  <div className="border border-white/5 bg-black/40 p-5 rounded-2xl space-y-4">
                    <div className="flex items-center justify-between border-b border-white/5 pb-3">
                      <label className="text-xs uppercase tracking-widest text-zinc-400 font-bold">Partner Brand Logo</label>
                      <div className="flex p-0.5 bg-zinc-900 rounded-lg border border-white/5">
                        <button
                          type="button"
                          onClick={() => setLogoInputType('upload')}
                          className={`px-3 py-1 text-[10px] font-black uppercase tracking-wider rounded-md transition-all ${logoInputType === 'upload' ? 'bg-orange-500 text-black' : 'text-white/60 hover:text-white'}`}
                        >
                          Upload File
                        </button>
                        <button
                          type="button"
                          onClick={() => setLogoInputType('url')}
                          className={`px-3 py-1 text-[10px] font-black uppercase tracking-wider rounded-md transition-all ${logoInputType === 'url' ? 'bg-orange-500 text-black' : 'text-white/60 hover:text-white'}`}
                        >
                          Web image URL
                        </button>
                      </div>
                    </div>

                    {logoInputType === 'upload' ? (
                      <div className="space-y-4">
                        {/* Drag and drop zone with custom file select */}
                        <div
                          onDragOver={(e) => {
                            e.preventDefault();
                            setIsDraggingLogo(true);
                          }}
                          onDragLeave={() => setIsDraggingLogo(false)}
                          onDrop={(e) => {
                            e.preventDefault();
                            setIsDraggingLogo(false);
                            if (e.dataTransfer.files && e.dataTransfer.files[0]) {
                              handleBrandLogoFileChange(e.dataTransfer.files[0]);
                            }
                          }}
                          className={`relative border-2 border-dashed rounded-xl p-6 flex flex-col items-center justify-center text-center cursor-pointer transition-all ${
                            isDraggingLogo 
                              ? 'border-orange-500 bg-orange-500/5' 
                              : brandLogoUrl.startsWith('data:image/') 
                                ? 'border-green-500/40 bg-green-500/5' 
                                : 'border-white/10 hover:border-white/20 bg-black/50'
                          }`}
                          onClick={() => {
                            const input = document.getElementById('brandLogoFileInput');
                            if (input) input.click();
                          }}
                        >
                          <input
                            type="file"
                            id="brandLogoFileInput"
                            accept="image/*"
                            className="hidden"
                            onChange={(e) => {
                              if (e.target.files && e.target.files[0]) {
                                handleBrandLogoFileChange(e.target.files[0]);
                              }
                            }}
                          />
                          
                          {brandLogoUrl.startsWith('data:image/') ? (
                            <div className="space-y-2">
                              {/* Logo preview */}
                              <div className="h-24 px-8 py-3 bg-zinc-900/65 rounded-xl border border-white/5 flex items-center justify-center mx-auto overflow-hidden max-w-[200px]">
                                <img 
                                  src={brandLogoUrl} 
                                  alt="Preview" 
                                  className="max-h-full max-w-full object-contain" 
                                />
                              </div>
                              <p className="text-xs text-green-400 font-bold uppercase tracking-wider">✓ Logo Loaded Successfully</p>
                              <p className="text-[10px] text-white/40 tracking-widest uppercase">Click or drag a new image file to replace</p>
                            </div>
                          ) : (
                            <div className="space-y-3">
                              <div className="w-12 h-12 rounded-full bg-zinc-900 border border-white/5 flex items-center justify-center mx-auto text-orange-500">
                                <Upload size={20} />
                              </div>
                              <div className="space-y-1">
                                <p className="text-xs font-bold text-white uppercase tracking-wider">Drag & Drop brand logo here</p>
                                <p className="text-[10px] text-white/40 uppercase tracking-widest">or click to browse from computer (PNG, SVG, JPG, WebP)</p>
                              </div>
                            </div>
                          )}
                        </div>

                        {/* If they currently have a standard HTTP logo URL and are on the upload tab, offer to clear or let them see the current state */}
                        {brandLogoUrl && !brandLogoUrl.startsWith('data:image/') && (
                          <div className="p-3 bg-zinc-900/40 rounded-xl border border-white/5 flex items-center justify-between text-xs text-white/60">
                            <span className="truncate max-w-[300px]">Current Brand logo is web-hosted: <code className="text-[11px] font-mono text-orange-500">{brandLogoUrl}</code></span>
                            <button
                              type="button"
                              onClick={() => setBrandLogoUrl('')}
                              className="text-[10px] font-black uppercase text-red-500 hover:text-red-400 px-3 py-1 bg-red-500/10 rounded-lg transition-all"
                            >
                              Reset
                            </button>
                          </div>
                        )}
                      </div>
                    ) : (
                      <div className="space-y-3">
                        <input
                          type="text"
                          value={brandLogoUrl}
                          onChange={(e) => setBrandLogoUrl(e.target.value)}
                          placeholder="e.g. https://domain.com/logo.png"
                          className="w-full bg-black border border-white/10 focus:border-orange-500/50 outline-none rounded-xl px-4 py-3 text-sm text-white font-mono"
                        />
                        <p className="text-[10px] text-white/30 uppercase tracking-wider leading-relaxed">
                          Enter a direct URL image path (PNG, SVG, JPEG, GIF) originating from a web server or cloud bucket.
                        </p>
                        
                        {/* Instant miniature live web URL preview */}
                        {brandLogoUrl && !brandLogoUrl.startsWith('data:image/') && (
                          <div className="p-3 bg-zinc-900 border border-white/5 rounded-xl flex items-center gap-3">
                            <div className="w-16 h-12 bg-black rounded border border-white/5 flex items-center justify-center shrink-0 overflow-hidden">
                              <img src={transformGoogleDriveUrl(brandLogoUrl)} alt="Preview Link" className="max-w-[90%] max-h-[90%] object-contain" onError={(e) => { (e.target as HTMLElement).style.display = 'none'; }} />
                            </div>
                            <div className="min-w-0">
                              <p className="text-[10px] font-bold text-white uppercase tracking-widest">Web logo preview ready</p>
                              <p className="text-[9px] text-white/40 truncate max-w-xs">{brandLogoUrl}</p>
                            </div>
                          </div>
                        )}
                      </div>
                    )}

                    {/* Clear/Delete active logo button if exists */}
                    {brandLogoUrl && (
                      <div className="mt-4 flex items-center justify-between p-3 bg-red-500/5 rounded-xl border border-red-500/10 text-xs text-red-400">
                        <span className="font-semibold uppercase tracking-wider text-[9px]">Active logo loaded: {brandLogoUrl.startsWith('data:image/') ? 'Uploaded Image' : 'Web Link'}</span>
                        <button
                          type="button"
                          onClick={() => {
                            if (window.confirm("Are you sure you want to delete this brand logo? It will fall back to its beautiful built-in SVG logo or clean text layout.")) {
                              setBrandLogoUrl('');
                            }
                          }}
                          className="px-3 py-1.5 bg-red-500/10 hover:bg-red-500 hover:text-white rounded-lg font-black uppercase text-[10px] tracking-wider transition-all border border-red-500/10"
                        >
                          Delete Logo
                        </button>
                      </div>
                    )}
                  </div>

                  <div>
                    <label className="block text-xs uppercase tracking-widest text-zinc-400 font-bold mb-2">Brief Tagline or Service Summary (Optional)</label>
                    <input
                      type="text"
                      value={brandDescription}
                      onChange={(e) => setBrandDescription(e.target.value)}
                      placeholder="e.g. Premium luxury commercial & residential real estate."
                      className="w-full bg-black border border-white/10 focus:border-orange-500/50 outline-none rounded-xl px-4 py-3 text-sm text-white"
                    />
                  </div>
                </div>

                <div className="flex gap-4 pt-4 border-t border-white/5">
                  <button
                    type="submit"
                    className="flex-1 bg-orange-500 hover:bg-orange-600 active:scale-95 text-black font-black uppercase text-xs py-3 rounded-xl transition-all shadow-lg"
                  >
                    {editingBrandIndex !== null ? 'Save Partner Profile & Commit' : 'Add Brand Partner to Page'}
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setShowAddBrandForm(false);
                      setEditingBrandIndex(null);
                    }}
                    className="px-6 py-3 bg-zinc-900 hover:bg-zinc-800 text-white font-bold uppercase text-xs rounded-xl transition-all border border-white/5"
                  >
                    Cancel
                  </button>
                </div>
              </form>
            )}

            {/* List and Order block */}
            <div className="bg-zinc-950 border border-white/5 p-6 md:p-8 rounded-[2.5rem] space-y-6">
              <h3 className="text-lg font-black uppercase italic tracking-tight text-white border-b border-white/5 pb-3">
                📋 Brand Page Partners Log ({brandPartners.length} Total Partners)
              </h3>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {brandPartners.map((item, index) => {
                  return (
                    <div 
                      key={item.id}
                      className="bg-black/60 border border-white/5 hover:border-orange-500/20 p-4 rounded-xl flex items-center justify-between gap-4 transition-all"
                    >
                      <div className="flex items-center gap-3 min-w-0">
                        {/* Logo Preview box */}
                        <div className="w-16 h-12 rounded bg-zinc-900/60 border border-white/5 flex items-center justify-center overflow-hidden shrink-0">
                          {item.logoUrl ? (
                            <img src={transformGoogleDriveUrl(item.logoUrl)} alt={item.name} className="max-w-[90%] max-h-[90%] object-contain" referrerPolicy="no-referrer" />
                          ) : (
                            <span className="text-[9px] font-black tracking-widest text-[#EAB308]">BUILT-IN</span>
                          )}
                        </div>
                        <div className="min-w-0">
                          <h4 className="text-sm font-black uppercase tracking-tight text-white truncate">{item.name}</h4>
                          <div className="flex flex-wrap items-center gap-2 mt-0.5">
                            <span className="text-[9px] font-bold text-orange-500 uppercase tracking-widest bg-orange-500/10 px-1.5 py-0.5 rounded border border-orange-500/15">
                              {item.category}
                            </span>
                            <span className="text-[9px] font-bold text-teal-400 uppercase tracking-widest bg-teal-400/10 px-1.5 py-0.5 rounded border border-teal-400/15">
                              Size: {item.logoSize || 'medium'}
                            </span>
                            {item.description && (
                              <span className="text-[10px] text-white/40 truncate max-w-xs">{item.description}</span>
                            )}
                          </div>
                        </div>
                      </div>

                      {/* Controls (edit, delete, move) */}
                      <div className="flex items-center gap-1 shrink-0">
                        <button
                          type="button"
                          onClick={() => handleMoveBrandPartner(index, 'up')}
                          disabled={index === 0}
                          title="Move Up"
                          className="p-1.5 rounded bg-zinc-900 text-white/60 hover:text-white disabled:opacity-20 disabled:hover:text-white/60 transition-all border border-white/5"
                        >
                          <ArrowUp size={14} />
                        </button>
                        <button
                          type="button"
                          onClick={() => handleMoveBrandPartner(index, 'down')}
                          disabled={index === brandPartners.length - 1}
                          title="Move Down"
                          className="p-1.5 rounded bg-zinc-900 text-white/60 hover:text-white disabled:opacity-20 disabled:hover:text-white/60 transition-all border border-white/5"
                        >
                          <ArrowDown size={14} />
                        </button>
                        {item.logoUrl && (
                          <button
                            type="button"
                            onClick={() => {
                              if (window.confirm(`Are you sure you want to delete the logo image of "${item.name}"? It will revert to its default vector logo or clean text layout.`)) {
                                const updated = [...brandPartners];
                                updated[index] = { ...updated[index], logoUrl: '' };
                                saveBrandPartners(updated);
                              }
                            }}
                            title="Delete Logo Image"
                            className="p-1.5 rounded bg-orange-500/10 text-orange-400 hover:bg-orange-500 hover:text-black transition-all border border-orange-500/10"
                          >
                            <ImageOff size={14} />
                          </button>
                        )}
                        <button
                          type="button"
                          onClick={() => handleEditBrandClick(index)}
                          title="Edit Partner"
                          className="p-1.5 rounded bg-[#3B82F6]/10 text-blue-400 hover:bg-[#3B82F6] hover:text-white transition-all border border-[#3B82F6]/10"
                        >
                          <Edit2 size={14} />
                        </button>
                        <button
                          type="button"
                          onClick={() => handleDeleteBrandPartner(index)}
                          title="Delete Partner"
                          className="p-1.5 rounded bg-red-500/10 text-red-500 hover:bg-red-500 hover:text-white transition-all border border-red-500/10"
                        >
                          <Trash2 size={14} />
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default AdminPanel;
