import { useEffect, useRef } from 'react';

// AdSense publisher ID from environment variable
// Set VITE_ADSENSE_CLIENT_ID in your .env file (e.g., VITE_ADSENSE_CLIENT_ID=ca-pub-1234567890123456)
const ADSENSE_CLIENT_ID = import.meta.env.VITE_ADSENSE_CLIENT_ID || '';

// Ad slot IDs from environment variables
const AD_SLOTS = {
  BANNER: import.meta.env.VITE_ADSENSE_SLOT_BANNER || 'XXXXXXXXXX',
  SIDEBAR: import.meta.env.VITE_ADSENSE_SLOT_SIDEBAR || 'XXXXXXXXXX',
  IN_FEED: import.meta.env.VITE_ADSENSE_SLOT_INFEED || 'XXXXXXXXXX',
};

interface GoogleAdProps {
  adSlot: string;
  adFormat?: 'auto' | 'rectangle' | 'horizontal' | 'vertical';
  fullWidthResponsive?: boolean;
  className?: string;
  style?: React.CSSProperties;
}

declare global {
  interface Window {
    adsbygoogle: unknown[];
  }
}

/**
 * Check if AdSense script is already loaded by querying the DOM.
 * This is more reliable than module-level state for HMR and SSR scenarios.
 */
function isAdsenseScriptLoaded(): boolean {
  return !!document.querySelector('script[src*="adsbygoogle"]');
}

// Promise that resolves when AdSense script is ready
let adsenseReadyPromise: Promise<void> | null = null;

/**
 * Dynamically loads the AdSense script with the correct client ID.
 * Returns a promise that resolves when the script is loaded and ready.
 */
function loadAdsenseScript(): Promise<void> {
  if (!ADSENSE_CLIENT_ID) {
    return Promise.reject(new Error('AdSense client ID not configured'));
  }

  if (adsenseReadyPromise) {
    return adsenseReadyPromise;
  }

  if (isAdsenseScriptLoaded()) {
    adsenseReadyPromise = Promise.resolve();
    return adsenseReadyPromise;
  }

  adsenseReadyPromise = new Promise((resolve, reject) => {
    const script = document.createElement('script');
    script.src = `https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=${ADSENSE_CLIENT_ID}`;
    script.async = true;
    script.crossOrigin = 'anonymous';
    
    script.onload = () => resolve();
    script.onerror = () => {
      // Reset promise so we can retry later
      adsenseReadyPromise = null;
      reject(new Error('Failed to load AdSense script (possibly blocked by ad blocker)'));
    };
    
    document.head.appendChild(script);
  });

  return adsenseReadyPromise;
}

export function GoogleAd({
  adSlot,
  adFormat = 'auto',
  fullWidthResponsive = true,
  className = '',
  style = {},
}: GoogleAdProps) {
  const isAdPushed = useRef(false);

  useEffect(() => {
    let isMounted = true;

    // Skip if no client ID configured
    if (!ADSENSE_CLIENT_ID) {
      if (import.meta.env.DEV) {
        console.warn('GoogleAd: VITE_ADSENSE_CLIENT_ID not configured');
      }
      return;
    }

    // Skip if using placeholder slot
    if (adSlot.includes('XXXXXXXXXX')) {
      if (import.meta.env.DEV) {
        console.warn('GoogleAd: Using placeholder ad slot. Replace with actual slot ID before production.');
      }
      return;
    }

    // Only push the ad once per component instance.
    // We intentionally use an empty dependency array because:
    // 1. AdSense ads should only be initialized once when the component mounts
    // 2. Changing adSlot after mount would require a full remount anyway
    // 3. The adsbygoogle.push() call is not idempotent - calling it multiple times
    //    can cause duplicate ads or errors
    if (isAdPushed.current) return;

    // Load the AdSense script and wait for it to be ready before pushing
    loadAdsenseScript()
      .then(() => {
        if (!isMounted || isAdPushed.current) return;
        
        try {
          (window.adsbygoogle = window.adsbygoogle || []).push({});
          isAdPushed.current = true;
        } catch (error) {
          console.error('Google AdSense error:', error);
        }
      })
      .catch((error) => {
        // Script failed to load (likely ad blocker)
        if (import.meta.env.DEV) {
          console.warn('GoogleAd:', error.message);
        }
      });

    // Cleanup function to handle unmount during async initialization
    return () => {
      isMounted = false;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []); // See comment above for why this is intentionally empty

  // Don't render if client ID is not configured
  if (!ADSENSE_CLIENT_ID) {
    if (import.meta.env.DEV) {
      return (
        <div 
          className={`google-ad-placeholder bg-neutral-50 border border-dashed border-neutral-200 flex items-center justify-center text-neutral-400 text-sm ${className}`} 
          style={{ minHeight: '90px', ...style }}
        >
          Set VITE_ADSENSE_CLIENT_ID to enable ads
        </div>
      );
    }
    return null;
  }

  // Don't render placeholder ads in production
  if (adSlot.includes('XXXXXXXXXX')) {
    if (import.meta.env.DEV) {
      return (
        <div 
          className={`google-ad-placeholder bg-neutral-50 border border-dashed border-neutral-200 flex items-center justify-center text-neutral-400 text-sm ${className}`} 
          style={{ minHeight: '90px', ...style }}
        >
          Ad Placeholder - Configure slot ID
        </div>
      );
    }
    return null;
  }

  return (
    <div className={`google-ad-container ${className}`} style={style}>
      <ins
        className="adsbygoogle"
        style={{ display: 'block' }}
        data-ad-client={ADSENSE_CLIENT_ID}
        data-ad-slot={adSlot}
        data-ad-format={adFormat}
        data-full-width-responsive={fullWidthResponsive.toString()}
      />
    </div>
  );
}

// Preset ad components for common placements
// Heights are set to common AdSense ad unit sizes to minimize CLS

export function BannerAd({ className = '' }: { className?: string }) {
  return (
    <GoogleAd
      adSlot={AD_SLOTS.BANNER}
      adFormat="horizontal"
      className={`w-full ${className}`}
      style={{ minHeight: '90px' }} // Standard leaderboard height
    />
  );
}

export function SidebarAd({ className = '' }: { className?: string }) {
  return (
    <GoogleAd
      adSlot={AD_SLOTS.SIDEBAR}
      adFormat="rectangle"
      className={`w-full ${className}`}
      style={{ minHeight: '250px' }} // Medium rectangle (300x250)
    />
  );
}

export function InFeedAd({ className = '' }: { className?: string }) {
  return (
    <GoogleAd
      adSlot={AD_SLOTS.IN_FEED}
      adFormat="auto"
      className={`w-full ${className}`}
      style={{ minHeight: '100px' }} // Reasonable minimum for in-feed
    />
  );
}

// Default export for backwards compatibility
export default GoogleAd;
