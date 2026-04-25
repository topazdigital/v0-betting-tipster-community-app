'use client';

import * as React from 'react';
import Image from 'next/image';
import { cn } from '@/lib/utils';
import { countryCodeToFlag } from '@/lib/country-flags';

const SIZE_MAP = {
  xs: { w: 14, h: 10, twW: 'w-3.5', twH: 'h-2.5' },
  sm: { w: 18, h: 13, twW: 'w-[18px]', twH: 'h-[13px]' },
  md: { w: 24, h: 18, twW: 'w-6', twH: 'h-[18px]' },
  lg: { w: 32, h: 24, twW: 'w-8', twH: 'h-6' },
  xl: { w: 48, h: 36, twW: 'w-12', twH: 'h-9' },
};

const SUBDIVISION_FLAGS: Record<string, string> = {
  'GB-ENG': 'https://flagcdn.com/w40/gb-eng.png',
  'GB-SCT': 'https://flagcdn.com/w40/gb-sct.png',
  'GB-WLS': 'https://flagcdn.com/w40/gb-wls.png',
  'GB-NIR': 'https://flagcdn.com/w40/gb-nir.png',
};

const SUBDIVISION_FLAGS_HD: Record<string, string> = {
  'GB-ENG': 'https://flagcdn.com/w80/gb-eng.png',
  'GB-SCT': 'https://flagcdn.com/w80/gb-sct.png',
  'GB-WLS': 'https://flagcdn.com/w80/gb-wls.png',
  'GB-NIR': 'https://flagcdn.com/w80/gb-nir.png',
};

const SPECIAL_EMOJI: Record<string, string> = {
  EU: '🇪🇺',
  WO: '🌍',
  AF: '🌍',
  SA: '🌎',
  NA: '🌎',
  AS: '🌏',
  SH: '🌏',
};

export interface FlagIconProps {
  countryCode?: string | null;
  size?: keyof typeof SIZE_MAP;
  className?: string;
  alt?: string;
  title?: string;
  rounded?: boolean;
}

export function FlagIcon({
  countryCode,
  size = 'md',
  className,
  alt,
  title,
  rounded = true,
}: FlagIconProps) {
  const code = (countryCode || '').toString().trim();
  const dim = SIZE_MAP[size];
  const upper = code.toUpperCase();

  // Handle special continent / EU codes via emoji span (no proper flag image exists)
  if (SPECIAL_EMOJI[upper]) {
    return (
      <span
        role="img"
        aria-label={alt || upper}
        title={title || alt || upper}
        className={cn(
          'inline-flex items-center justify-center leading-none',
          dim.twW,
          dim.twH,
          className
        )}
        style={{ fontSize: dim.h * 1.2 }}
      >
        {SPECIAL_EMOJI[upper]}
      </span>
    );
  }

  // Subdivision flags (England, Scotland, Wales, NI)
  const subdivision = SUBDIVISION_FLAGS[upper];
  if (subdivision) {
    return (
      <Image
        src={subdivision}
        alt={alt || upper}
        title={title || alt || upper}
        width={dim.w}
        height={dim.h}
        unoptimized
        className={cn(
          'inline-block object-cover shadow-sm',
          rounded && 'rounded-[2px]',
          dim.twW,
          dim.twH,
          className
        )}
      />
    );
  }

  // Standard ISO-2 country code
  if (upper.length === 2 && /^[A-Z]{2}$/.test(upper)) {
    const lower = upper.toLowerCase();
    const src = `https://flagcdn.com/w${dim.w * 2}/${lower}.png`;
    return (
      <Image
        src={src}
        alt={alt || upper}
        title={title || alt || upper}
        width={dim.w}
        height={dim.h}
        unoptimized
        className={cn(
          'inline-block object-cover shadow-sm',
          rounded && 'rounded-[2px]',
          dim.twW,
          dim.twH,
          className
        )}
      />
    );
  }

  // Final fallback: emoji from existing helper
  return (
    <span
      role="img"
      aria-label={alt || upper || 'flag'}
      title={title || alt || upper}
      className={cn(
        'inline-flex items-center justify-center leading-none',
        dim.twW,
        dim.twH,
        className
      )}
      style={{ fontSize: dim.h * 1.2 }}
    >
      {countryCodeToFlag(upper)}
    </span>
  );
}

export function flagSrcForCode(countryCode?: string | null, width = 40): string | null {
  if (!countryCode) return null;
  const upper = countryCode.toString().trim().toUpperCase();
  if (SUBDIVISION_FLAGS_HD[upper]) {
    return width >= 80 ? SUBDIVISION_FLAGS_HD[upper] : SUBDIVISION_FLAGS[upper];
  }
  if (upper.length !== 2 || !/^[A-Z]{2}$/.test(upper)) return null;
  return `https://flagcdn.com/w${width}/${upper.toLowerCase()}.png`;
}
