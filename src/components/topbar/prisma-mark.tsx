"use client";

// Marca gráfica da Prisma — prisma geométrico minimalista
export function PrismaMark({ className = "w-5 h-5" }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
    >
      <defs>
        <linearGradient id="prismaGradient" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="var(--primary)" />
          <stop offset="100%" stopColor="var(--secondary-fixed-dim)" />
        </linearGradient>
      </defs>
      <path
        d="M12 3L20.5 18.5H3.5L12 3Z"
        stroke="url(#prismaGradient)"
        strokeWidth="1.75"
        strokeLinejoin="round"
        fill="url(#prismaGradient)"
        fillOpacity="0.12"
      />
      <path
        d="M12 3L12 18.5"
        stroke="url(#prismaGradient)"
        strokeWidth="1.25"
        strokeLinecap="round"
        opacity="0.6"
      />
    </svg>
  );
}
