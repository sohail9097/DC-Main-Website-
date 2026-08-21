import React from 'react';
import { DEFAULT_CLIENTS, DEFAULT_BRAND_PARTNERS } from '../lib/siteDefaults';

export interface BrandItem {
  id: string;
  name: string;
  category: 'brands' | 'platforms' | 'govt' | 'corporates';
  logoUrl?: string;
  renderLogo?: () => React.ReactNode;
  description?: string;
  logoSize?: 'small' | 'medium' | 'large' | 'xlarge';
}

export interface ClientItem {
  id: string;
  name: string;
  color: string;
  size?: 'small' | 'medium' | 'large' | 'xlarge' | 'extralarge' | string;
  logoUrl?: string;
  layer?: 1 | 2 | 3 | 4 | string;
  description?: string;
  renderLogo?: () => React.ReactNode;
}

export function transformGoogleDriveUrl(url: string, type: 'image' | 'video' = 'image'): string {
  if (!url) return '';
  const trimmed = url.trim();

  // Extract file ID from google drive share link if it's a google drive url
  if (trimmed.includes('drive.google.com') || trimmed.includes('docs.google.com')) {
    const fileIdRegex = /(?:\/file\/d\/|id=)([^/?#]+)/;
    const match = trimmed.match(fileIdRegex);
    if (match && match[1]) {
      const fileId = match[1];
      if (type === 'video') {
        return `/api/drive-stream?id=${fileId}`;
      }
      return `https://lh3.googleusercontent.com/d/${fileId}=w1200`;
    }
  }

  // Optimize direct lh3.googleusercontent.com links
  if (trimmed.includes('lh3.googleusercontent.com/d/')) {
    if (type === 'image' && !trimmed.includes('=w') && !trimmed.includes('=s') && !trimmed.includes('=h')) {
      return `${trimmed}=w1200`;
    }
    return trimmed;
  }

  // Unsplash image performance optimization
  if (type === 'image' && trimmed.includes('images.unsplash.com')) {
    if (!trimmed.includes('auto=format')) {
      const separator = trimmed.includes('?') ? '&' : '?';
      return `${trimmed}${separator}auto=format&fit=crop&q=80&w=1200`;
    }
  }

  // Cloudinary image performance optimization
  if (type === 'image' && trimmed.includes('cloudinary.com') && trimmed.includes('/image/upload/')) {
    if (!trimmed.includes('f_auto') && !trimmed.includes('q_auto')) {
      return trimmed.replace('/image/upload/', '/image/upload/f_auto,q_auto,w_1200/');
    }
  }

  return trimmed;
}

export const DEFAULT_CLIENTS_LIST: ClientItem[] = DEFAULT_CLIENTS as unknown as ClientItem[];

export const DEFAULT_BRAND_ITEMS: BrandItem[] = DEFAULT_BRAND_PARTNERS as unknown as BrandItem[];
