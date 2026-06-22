export function WolfEyes({ size = 40 }: { size?: number }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 100 60"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
    >
      <ellipse cx="30" cy="30" rx="22" ry="18" fill="#111" />
      <ellipse cx="70" cy="30" rx="22" ry="18" fill="#111" />
      <circle cx="28" cy="28" r="6" fill="#ffcc00" />
      <circle cx="68" cy="28" r="6" fill="#ffcc00" />
      <circle cx="28" cy="28" r="3" fill="#111" />
      <circle cx="68" cy="28" r="3" fill="#111" />
      <path d="M45 20 L50 15 L55 20" stroke="#111" strokeWidth="3" fill="none" />
    </svg>
  )
}
