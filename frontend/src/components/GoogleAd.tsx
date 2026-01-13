import { useEffect, useRef, useState } from 'react';

// AdSense publisher ID from environment variable
// Set VITE_ADSENSE_CLIENT_ID in your .env file (e.g., VITE_ADSENSE_CLIENT_ID=ca-pub-1234567890123456)
const ADSENSE_CLIENT_ID = import.meta.env.VITE_ADSENSE_CLIENT_ID || '';

// Ad slot IDs from environment variables
const AD_SLOTS = {
  BANNER: import.meta.env.VITE_ADSENSE_SLOT_BANNER || 'XXXXXXXXXX',
  SIDEBAR: import.meta.env.VITE_ADSENSE_SLOT_SIDEBAR || 'XXXXXXXXXX',
  IN_FEED: import.meta.env.VITE_ADSENSE_SLOT_INFEED || 'XXXXXXXXXX',
};

/**
 * Check if ads should be shown for a given slot.
 * Returns false in production if client ID is missing or slot is placeholder.
 * In dev mode, always returns true to show placeholder UI.
 */
function shouldShowAds(adSlot: string): boolean {
  if (import.meta.env.DEV) {
    return true; // Show placeholder in dev
  }
  if (!ADSENSE_CLIENT_ID) {
    return false;
  }
  if (adSlot.includes('XXXXXXXXXX')) {
    return false;
  }
  return true;
}

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

// Reset module state on HMR to prevent stale promises
if (import.meta.hot) {
  import.meta.hot.dispose(() => {
    adsenseReadyPromise = null;
  });
}

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
      reject(new Error('AD_BLOCKED'));
    };
    
    document.head.appendChild(script);
  });

  return adsenseReadyPromise;
}

/**
 * Google AdSense ad component.
 * 
 * @important If you need to change the adSlot after mount, use a key prop to force remount:
 * ```tsx
 * <GoogleAd key={adSlot} adSlot={adSlot} />
 * ```
 * 
 * @example
 * // Basic usage
 * <GoogleAd adSlot="1234567890" />
 * 
 * // With custom format
 * <GoogleAd adSlot="1234567890" adFormat="rectangle" />
 * 
 * // Using preset components (recommended)
 * <BannerAd />
 * <SidebarAd />
 * <InFeedAd />
 */
export function GoogleAd({
  adSlot,
  adFormat = 'auto',
  fullWidthResponsive = true,
  className = '',
  style = {},
}: GoogleAdProps) {
  const isAdPushed = useRef(false);
  const [isBlocked, setIsBlocked] = useState(false);

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
    // 2. Changing adSlot after mount would require a full remount (use key prop)
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
        if (!isMounted) return;
        
        // Script failed to load (likely ad blocker)
        if (error.message === 'AD_BLOCKED') {
          setIsBlocked(true);
        }
        
        if (import.meta.env.DEV) {
          console.warn('GoogleAd: Failed to load (ad blocker may be active)');
        }
      });

    // Cleanup function to handle unmount during async initialization
    return () => {
      isMounted = false;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []); // See comment above - use key prop to change adSlot

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

  // Graceful degradation for users with ad blockers
  if (isBlocked) {
    // Return empty container to maintain layout (CLS prevention)
    return <div className={className} style={style} />;
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
// Each component includes its own wrapper to avoid empty containers when ads aren't shown

export function BannerAd({ className = '' }: { className?: string }) {
  if (!shouldShowAds(AD_SLOTS.BANNER)) {
    return null;
  }

  return (
    <div className={`max-w-7xl mx-auto px-4 py-2 ${className}`} role="complementary" aria-label="Advertisements">
      <GoogleAd
        adSlot={AD_SLOTS.BANNER}
        adFormat="horizontal"
        className="w-full"
        style={{ minHeight: '90px' }} // Standard leaderboard height
      />
    </div>
  );
}

export function SidebarAd({ className = '' }: { className?: string }) {
  if (!shouldShowAds(AD_SLOTS.SIDEBAR)) {
    return null;
  }

  return (
    <aside className={className} role="complementary" aria-label="Advertisements">
      <GoogleAd
        adSlot={AD_SLOTS.SIDEBAR}
        adFormat="rectangle"
        className="w-full"
        style={{ minHeight: '250px' }} // Medium rectangle (300x250)
      />
    </aside>
  );
}

export function InFeedAd({ className = '' }: { className?: string }) {
  if (!shouldShowAds(AD_SLOTS.IN_FEED)) {
    return null;
  }

  return (
    <div className={className} role="complementary" aria-label="Sponsored content">
      <GoogleAd
        adSlot={AD_SLOTS.IN_FEED}
        adFormat="auto"
        className="w-full"
        style={{ minHeight: '100px' }} // Reasonable minimum for in-feed
      />
    </div>
  );
}

// Default export for backwards compatibility
export default GoogleAd;
