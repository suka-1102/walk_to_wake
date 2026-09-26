import { useId } from "react";

/**
 * アプリのロゴ（夜の半月と朝日を左右に並べたアイコン）。
 * グラデーションの id が同じページ内で重ならないよう、`useId` で振る。
 */
export function BrandLogo({ size = 28 }: { size?: number }) {
  const id = useId().replace(/:/g, "");
  const night = `night-${id}`;
  const day = `day-${id}`;
  const clip = `clip-${id}`;

  return (
    <svg viewBox="0 0 100 100" width={size} height={size} aria-hidden="true">
      <defs>
        <linearGradient id={night} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#1b2942" />
          <stop offset="100%" stopColor="#0a111f" />
        </linearGradient>
        <linearGradient id={day} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#8fe3f7" />
          <stop offset="100%" stopColor="#2ea8e0" />
        </linearGradient>
        <clipPath id={clip}>
          <rect x="2" y="2" width="96" height="96" rx="26" ry="26" />
        </clipPath>
      </defs>
      <g clipPath={`url(#${clip})`}>
        <rect x="2" y="2" width="48" height="96" fill={`url(#${night})`} />
        <rect x="50" y="2" width="48" height="96" fill={`url(#${day})`} />
        <circle cx="28" cy="34" r="10" fill="#eef2f6" />
        <circle cx="32.5" cy="31" r="8.5" fill={`url(#${night})`} />
        <circle cx="72" cy="34" r="11" fill="#ffcb3d" />
      </g>
    </svg>
  );
}
