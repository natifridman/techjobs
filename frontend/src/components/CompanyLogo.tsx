import { useState } from 'react';
import type { HTMLAttributes } from 'react';

interface CompanyLogoProps extends Omit<HTMLAttributes<HTMLDivElement>, 'children'> {
  name: string;
  logoUrl?: string;
  className?: string;
  textSize?: string;
}

export default function CompanyLogo({
  name,
  logoUrl: providedLogoUrl,
  className = "w-12 h-12",
  textSize = "text-xl",
  ...rest
}: CompanyLogoProps) {
  const [error, setError] = useState(false);

  // Clean company name for better logo matching
  const cleanName = name?.replace(/ Ltd\.?$/i, '').replace(/ Inc\.?$/i, '').trim();
  const clearbitUrl = `https://logo.clearbit.com/${cleanName?.replace(/\s+/g, '').toLowerCase()}.com`;

  const logoUrl = providedLogoUrl || clearbitUrl;

  if (!name) return null;

  if (error) {
    return (
      <div 
        className={`${className} rounded-lg bg-iris-100 flex items-center justify-center ${textSize} font-bold text-iris-600 shrink-0`}
        role="img"
        aria-label={`${name} logo`}
        {...rest}
      >
        {name.charAt(0).toUpperCase()}
      </div>
    );
  }

  return (
    <div 
      className={`${className} rounded-lg bg-white border border-warm-100 flex items-center justify-center overflow-hidden shrink-0`}
      {...rest}
    >
      <img
        src={logoUrl}
        alt={`${name} logo`}
        className="w-full h-full object-contain p-2"
        onError={() => setError(true)}
      />
    </div>
  );
}
