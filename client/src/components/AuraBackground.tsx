/* ============================================================
   ADHD FOCUS SPACE — AuraBackground
   Design: Soft blurry aura orbs in warm rose, cream, dusty gold
   Inspired by the reference images — dreamy, painterly, still
   Fixed position, z-index 0, pointer-events none
   ============================================================ */

export default function AuraBackground() {
  return (
    <div
      aria-hidden="true"
      style={{
        position: "fixed",
        inset: 0,
        zIndex: 0,
        pointerEvents: "none",
        overflow: "hidden",
      }}
    >
      <svg
        width="100%"
        height="100%"
        viewBox="0 0 1440 900"
        preserveAspectRatio="xMidYMid slice"
        xmlns="http://www.w3.org/2000/svg"
        style={{ position: "absolute", inset: 0 }}
      >
        <defs>
          {/* Warm cream base */}
          <radialGradient id="aura-base" cx="50%" cy="50%" r="70%">
            <stop offset="0%" stopColor="#fdf6ee" />
            <stop offset="100%" stopColor="#f5ede2" />
          </radialGradient>

          {/* Rose-coral orb — top left */}
          <radialGradient id="aura-rose" cx="50%" cy="50%" r="50%">
            <stop offset="0%" stopColor="#e8a09a" stopOpacity="0.20" />
            <stop offset="60%" stopColor="#d4837a" stopOpacity="0.08" />
            <stop offset="100%" stopColor="#d4837a" stopOpacity="0" />
          </radialGradient>

          {/* Warm orange orb — top right */}
          <radialGradient id="aura-orange" cx="50%" cy="50%" r="50%">
            <stop offset="0%" stopColor="#e8935a" stopOpacity="0.18" />
            <stop offset="55%" stopColor="#e07840" stopOpacity="0.07" />
            <stop offset="100%" stopColor="#e07840" stopOpacity="0" />
          </radialGradient>

          {/* Dusty gold orb — bottom center */}
          <radialGradient id="aura-gold" cx="50%" cy="50%" r="50%">
            <stop offset="0%" stopColor="#d4a96a" stopOpacity="0.16" />
            <stop offset="55%" stopColor="#c49050" stopOpacity="0.06" />
            <stop offset="100%" stopColor="#c49050" stopOpacity="0" />
          </radialGradient>

          {/* Blush pink orb — bottom left */}
          <radialGradient id="aura-blush" cx="50%" cy="50%" r="50%">
            <stop offset="0%" stopColor="#e8b4b8" stopOpacity="0.14" />
            <stop offset="60%" stopColor="#dda0a4" stopOpacity="0.05" />
            <stop offset="100%" stopColor="#dda0a4" stopOpacity="0" />
          </radialGradient>

          {/* Sage green orb — mid right */}
          <radialGradient id="aura-sage" cx="50%" cy="50%" r="50%">
            <stop offset="0%" stopColor="#b8c9a8" stopOpacity="0.10" />
            <stop offset="60%" stopColor="#9ab88a" stopOpacity="0.04" />
            <stop offset="100%" stopColor="#9ab88a" stopOpacity="0" />
          </radialGradient>

          <filter id="aura-blur" x="-50%" y="-50%" width="200%" height="200%">
            <feGaussianBlur stdDeviation="80" />
          </filter>
        </defs>

        {/* Base is transparent — body CSS grid shows through */}

        {/* Orbs — blurred */}
        <g filter="url(#aura-blur)">
          {/* Rose — top left, large */}
          <ellipse cx="160" cy="130" rx="420" ry="380" fill="url(#aura-rose)">
            <animateTransform
              attributeName="transform"
              type="translate"
              values="0,0; 30,20; -15,35; 0,0"
              dur="18s"
              repeatCount="indefinite"
              calcMode="spline"
              keySplines="0.4 0 0.6 1; 0.4 0 0.6 1; 0.4 0 0.6 1"
            />
          </ellipse>

          {/* Orange — top right */}
          <ellipse cx="1200" cy="80" rx="360" ry="320" fill="url(#aura-orange)">
            <animateTransform
              attributeName="transform"
              type="translate"
              values="0,0; -25,30; 20,-15; 0,0"
              dur="22s"
              repeatCount="indefinite"
              calcMode="spline"
              keySplines="0.4 0 0.6 1; 0.4 0 0.6 1; 0.4 0 0.6 1"
            />
          </ellipse>

          {/* Gold — bottom center */}
          <ellipse cx="720" cy="820" rx="500" ry="300" fill="url(#aura-gold)">
            <animateTransform
              attributeName="transform"
              type="translate"
              values="0,0; 40,-20; -30,10; 0,0"
              dur="26s"
              repeatCount="indefinite"
              calcMode="spline"
              keySplines="0.4 0 0.6 1; 0.4 0 0.6 1; 0.4 0 0.6 1"
            />
          </ellipse>

          {/* Blush — bottom left */}
          <ellipse cx="200" cy="780" rx="380" ry="280" fill="url(#aura-blush)">
            <animateTransform
              attributeName="transform"
              type="translate"
              values="0,0; 20,-30; -10,20; 0,0"
              dur="20s"
              repeatCount="indefinite"
              calcMode="spline"
              keySplines="0.4 0 0.6 1; 0.4 0 0.6 1; 0.4 0 0.6 1"
            />
          </ellipse>

          {/* Sage — mid right */}
          <ellipse cx="1350" cy="500" rx="300" ry="340" fill="url(#aura-sage)">
            <animateTransform
              attributeName="transform"
              type="translate"
              values="0,0; -20,25; 15,-20; 0,0"
              dur="24s"
              repeatCount="indefinite"
              calcMode="spline"
              keySplines="0.4 0 0.6 1; 0.4 0 0.6 1; 0.4 0 0.6 1"
            />
          </ellipse>
        </g>

        {/* Very subtle noise grain overlay */}
        <filter id="grain">
          <feTurbulence type="fractalNoise" baseFrequency="0.65" numOctaves="3" stitchTiles="stitch" />
          <feColorMatrix type="saturate" values="0" />
          <feBlend in="SourceGraphic" mode="overlay" />
        </filter>
        <rect width="1440" height="900" fill="transparent" filter="url(#grain)" opacity="0.03" />
      </svg>
    </div>
  );
}
