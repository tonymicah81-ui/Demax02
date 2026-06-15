'use client';
import Image from 'next/image';

interface LogoProps {
  logoUrl?: string;
  platformName?: string;
  size?: number;
  className?: string;
}

export function Logo({ logoUrl, platformName = 'Platform', size = 40, className }: LogoProps) {
  if (logoUrl) {
    return <Image src={logoUrl} alt={platformName} width={size} height={size} className={`rounded-lg object-contain ${className || ''}`} />;
  }
  return (
    <div style={{ width: size, height: size }}
      className={`rounded-lg bg-[var(--color-primary)] flex items-center justify-center text-white font-black text-lg ${className || ''}`}>
      {platformName.charAt(0).toUpperCase()}
    </div>
  );
}
