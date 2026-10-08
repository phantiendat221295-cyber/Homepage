import React from 'react';

interface FptPolySchoolLogoProps {
  className?: string;
  variant?: 'full' | 'compact' | 'horizontal';
  subText?: string;
}

export const FptPolySchoolLogo: React.FC<FptPolySchoolLogoProps> = ({
  className = 'h-10',
  variant = 'horizontal',
  subText
}) => {
  if (variant === 'full') {
    // Stacked full logo (matching Logo_FPTPolySchool.png directly)
    return (
      <div className={`flex flex-col items-center justify-center select-none ${className}`}>
        <svg
          viewBox="0 0 500 240"
          className="w-full h-auto max-w-[240px]"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
        >
          {/* FPT 3 Petals Emblem */}
          <g transform="translate(110, 10)">
            {/* Blue Petal F */}
            <path
              d="M32 95 C14 95 0 80 8 50 L22 15 C26 3 38 0 48 0 L72 0 C64 26 50 70 46 84 C43 92 38 95 32 95 Z"
              fill="#0066B3"
            />
            {/* White F */}
            <text
              x="36"
              y="62"
              fill="#FFFFFF"
              fontFamily="'Be Vietnam Pro', -apple-system, sans-serif"
              fontWeight="900"
              fontStyle="italic"
              fontSize="48"
              transform="skewX(-14)"
            >
              F
            </text>

            {/* Orange Petal P */}
            <path
              d="M92 108 C76 108 64 96 70 70 L86 20 C90 6 102 0 114 0 L140 0 C130 32 114 82 108 98 C104 105 98 108 92 108 Z"
              fill="#F26F21"
            />
            {/* White P */}
            <text
              x="103"
              y="66"
              fill="#FFFFFF"
              fontFamily="'Be Vietnam Pro', -apple-system, sans-serif"
              fontWeight="900"
              fontStyle="italic"
              fontSize="48"
              transform="skewX(-14)"
            >
              P
            </text>

            {/* Green Petal T */}
            <path
              d="M158 95 C142 95 132 82 138 56 L150 16 C154 4 164 0 176 0 L204 0 C194 30 180 72 174 86 C170 92 164 95 158 95 Z"
              fill="#00A850"
            />
            {/* White T */}
            <text
              x="166"
              y="60"
              fill="#FFFFFF"
              fontFamily="'Be Vietnam Pro', -apple-system, sans-serif"
              fontWeight="900"
              fontStyle="italic"
              fontSize="46"
              transform="skewX(-14)"
            >
              T
            </text>

            {/* Registered Trademark symbol ® */}
            <circle cx="218" cy="80" r="8" stroke="#0066B3" strokeWidth="1.8" fill="none" />
            <text
              x="215"
              y="84"
              fill="#0066B3"
              fontFamily="sans-serif"
              fontWeight="bold"
              fontSize="10"
            >
              R
            </text>
          </g>

          {/* FPT POLYSCHOOL Slab-Serif text in bold orange */}
          <text
            x="250"
            y="190"
            textAnchor="middle"
            fill="#F26F21"
            fontFamily="'Rockwell', 'Roboto Slab', 'Georgia', serif"
            fontWeight="900"
            fontSize="46"
            letterSpacing="2"
          >
            FPT POLYSCHOOL
          </text>

          {subText && (
            <text
              x="250"
              y="225"
              textAnchor="middle"
              fill="#64748B"
              fontFamily="'Be Vietnam Pro', sans-serif"
              fontWeight="800"
              fontSize="20"
              letterSpacing="6"
            >
              {subText}
            </text>
          )}
        </svg>
      </div>
    );
  }

  // Horizontal navbar variant: crisp, modern, perfectly balanced for the top header
  return (
    <div className={`flex items-center gap-3 select-none ${className}`}>
      {/* 3 Petals SVG Emblem */}
      <svg
        viewBox="0 0 235 110"
        className="h-9 w-auto shrink-0 drop-shadow-2xs"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
      >
        {/* Blue Petal F */}
        <path
          d="M32 98 C14 98 0 82 8 52 L22 15 C26 3 38 0 48 0 L72 0 C64 26 50 72 46 86 C43 94 38 98 32 98 Z"
          fill="#0066B3"
        />
        <text
          x="35"
          y="65"
          fill="#FFFFFF"
          fontFamily="'Be Vietnam Pro', sans-serif"
          fontWeight="900"
          fontStyle="italic"
          fontSize="48"
          transform="skewX(-14)"
        >
          F
        </text>

        {/* Orange Petal P */}
        <path
          d="M92 110 C76 110 64 96 70 70 L86 20 C90 6 102 0 114 0 L140 0 C130 32 114 82 108 98 C104 106 98 110 92 110 Z"
          fill="#F26F21"
        />
        <text
          x="102"
          y="69"
          fill="#FFFFFF"
          fontFamily="'Be Vietnam Pro', sans-serif"
          fontWeight="900"
          fontStyle="italic"
          fontSize="48"
          transform="skewX(-14)"
        >
          P
        </text>

        {/* Green Petal T */}
        <path
          d="M158 98 C142 98 132 84 138 58 L150 16 C154 4 164 0 176 0 L204 0 C194 30 180 72 174 88 C170 94 164 98 158 98 Z"
          fill="#00A850"
        />
        <text
          x="165"
          y="63"
          fill="#FFFFFF"
          fontFamily="'Be Vietnam Pro', sans-serif"
          fontWeight="900"
          fontStyle="italic"
          fontSize="46"
          transform="skewX(-14)"
        >
          T
        </text>

        {/* ® */}
        <circle cx="218" cy="80" r="7.5" stroke="#0066B3" strokeWidth="1.6" fill="none" />
        <text
          x="215"
          y="84"
          fill="#0066B3"
          fontFamily="sans-serif"
          fontWeight="bold"
          fontSize="9.5"
        >
          R
        </text>
      </svg>

      {/* Brand Text */}
      <div className="flex flex-col justify-center">
        <span
          className="font-black text-[#F26F21] text-base sm:text-[17px] tracking-wider leading-tight"
          style={{ fontFamily: "'Rockwell', 'Roboto Slab', 'Georgia', serif" }}
        >
          FPT POLYSCHOOL
        </span>
        <span className="font-extrabold text-slate-500 text-[10.5px] tracking-widest uppercase leading-none mt-0.5">
          {subText || 'ĐỒNG NAI'}
        </span>
      </div>
    </div>
  );
};
