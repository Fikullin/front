import Image from 'next/image';

interface AISLogoProps {
  width?: number;
  height?: number;
  className?: string;
}

export default function AISLogo({ width = 40, height = 40, className = '' }: AISLogoProps) {
  return (
    <Image 
      src="/aislogo.png" 
      alt="AIS Logo" 
      width={width} 
      height={height} 
      className={className}
    />
  );
}