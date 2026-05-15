import { useId } from "react";

interface Props {
  size?: number;
  accent?: string;
  deep?: string;
  book?: string;
}

export default function OwlMascot({
  size = 520,
  accent = "#E5733B",
  deep = "#C4541F",
  book = "#C8341F",
}: Props) {
  const uid = useId().replace(/:/g, "");

  return (
    <svg
      viewBox="0 0 520 620"
      width={size}
      height={size * (620 / 520)}
      role="img"
      aria-label="LearnNest owl mascot reading a book"
      style={{ display: "block", overflow: "visible" }}
    >
      <defs>
        <radialGradient id={`belly-${uid}`} cx="50%" cy="40%" r="65%">
          <stop offset="0%" stopColor="#FFF1DC" />
          <stop offset="100%" stopColor="#F4D9A8" />
        </radialGradient>
        <radialGradient id={`body-${uid}`} cx="50%" cy="35%" r="80%">
          <stop offset="0%" stopColor={accent} />
          <stop offset="100%" stopColor={deep} />
        </radialGradient>
        <radialGradient id={`eye-${uid}`} cx="40%" cy="35%" r="70%">
          <stop offset="0%" stopColor="#3a2418" />
          <stop offset="100%" stopColor="#1a0f08" />
        </radialGradient>
        <linearGradient id={`book-${uid}`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={book} />
          <stop offset="100%" stopColor="#9a2b1f" />
        </linearGradient>
        <filter id={`soft-${uid}`} x="-20%" y="-20%" width="140%" height="140%">
          <feGaussianBlur stdDeviation="6" />
        </filter>
      </defs>

      <ellipse cx="260" cy="585" rx="180" ry="18" fill="#000" opacity="0.12" filter={`url(#soft-${uid})`} />

      <path d="M 380 470 Q 440 460 460 410 Q 470 460 440 500 Q 420 530 380 525 Z" fill={deep} />
      <path d="M 140 470 Q 80 460 60 410 Q 50 460 80 500 Q 100 530 140 525 Z" fill={deep} />

      <path
        d="M 260 80 C 380 80 440 180 440 320 C 440 470 370 560 260 560 C 150 560 80 470 80 320 C 80 180 140 80 260 80 Z"
        fill={`url(#body-${uid})`}
      />

      <path d="M 95 320 Q 60 360 80 440 Q 110 470 140 440 Q 130 380 130 330 Z" fill={deep} />
      <path d="M 425 320 Q 460 360 440 440 Q 410 470 380 440 Q 390 380 390 330 Z" fill={deep} />

      <ellipse cx="260" cy="380" rx="135" ry="160" fill={`url(#belly-${uid})`} />

      <circle cx="155" cy="200" r="8" fill="#fff" opacity="0.5" />
      <circle cx="380" cy="180" r="6" fill="#fff" opacity="0.5" />
      <circle cx="400" cy="260" r="5" fill="#fff" opacity="0.4" />
      <circle cx="125" cy="270" r="6" fill="#fff" opacity="0.4" />

      <path d="M 145 110 Q 140 70 165 60 Q 185 80 175 120 Z" fill={deep} />
      <path d="M 375 110 Q 380 70 355 60 Q 335 80 345 120 Z" fill={deep} />

      <g>
        <rect x="240" y="225" width="40" height="10" rx="5" fill="#5b3a1f" />
        <circle cx="190" cy="230" r="62" fill="#fff" stroke="#5b3a1f" strokeWidth="9" />
        <circle cx="330" cy="230" r="62" fill="#fff" stroke="#5b3a1f" strokeWidth="9" />
        <path d="M 128 230 Q 105 235 95 250" stroke="#5b3a1f" strokeWidth="7" fill="none" strokeLinecap="round" />
        <path d="M 392 230 Q 415 235 425 250" stroke="#5b3a1f" strokeWidth="7" fill="none" strokeLinecap="round" />
      </g>

      <circle cx="190" cy="232" r="34" fill={`url(#eye-${uid})`} />
      <circle cx="330" cy="232" r="34" fill={`url(#eye-${uid})`} />
      <circle cx="180" cy="222" r="10" fill="#fff" />
      <circle cx="200" cy="240" r="5" fill="#fff" opacity="0.7" />
      <circle cx="320" cy="222" r="10" fill="#fff" />
      <circle cx="340" cy="240" r="5" fill="#fff" opacity="0.7" />

      <path
        d="M 260 275 Q 240 300 250 320 Q 260 328 270 320 Q 280 300 260 275 Z"
        fill="#d97a3a"
        stroke="#a85220"
        strokeWidth="2"
      />

      <ellipse cx="155" cy="310" rx="22" ry="12" fill="#ff9a8a" opacity="0.5" />
      <ellipse cx="365" cy="310" rx="22" ry="12" fill="#ff9a8a" opacity="0.5" />

      <path d="M 245 340 Q 260 352 275 340" stroke="#5b3a1f" strokeWidth="3" fill="none" strokeLinecap="round" />

      <path
        d="M 130 380 Q 100 420 130 470 Q 175 495 220 480 L 220 410 Q 180 395 150 380 Z"
        fill={deep}
      />

      <g>
        <rect x="195" y="395" width="155" height="115" rx="6" fill="#7a1f15" />
        <rect x="200" y="400" width="150" height="110" rx="6" fill={`url(#book-${uid})`} />
        <rect x="200" y="400" width="6" height="110" rx="3" fill="#fff" opacity="0.15" />
        <rect x="220" y="425" width="110" height="4" rx="2" fill="#fff" opacity="0.7" />
        <rect x="220" y="438" width="80" height="4" rx="2" fill="#fff" opacity="0.5" />
        <path
          d="M 275 470 l 6 12 13 2 -9.5 9 2.5 13 -12 -6.5 -12 6.5 2.5 -13 -9.5 -9 13 -2 z"
          fill="#fff"
          opacity="0.85"
        />
      </g>

      <path
        d="M 390 380 Q 420 420 390 470 Q 360 495 325 485 L 325 410 Q 360 395 380 380 Z"
        fill={deep}
      />

      <ellipse cx="215" cy="555" rx="28" ry="12" fill="#d97a3a" />
      <ellipse cx="305" cy="555" rx="28" ry="12" fill="#d97a3a" />
      <path d="M 200 558 L 195 568 M 215 562 L 215 572 M 230 558 L 235 568" stroke="#a85220" strokeWidth="3" strokeLinecap="round" />
      <path d="M 290 558 L 285 568 M 305 562 L 305 572 M 320 558 L 325 568" stroke="#a85220" strokeWidth="3" strokeLinecap="round" />
    </svg>
  );
}
