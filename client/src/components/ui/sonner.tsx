import { useTheme } from "next-themes";
import { Toaster as Sonner, type ToasterProps } from "sonner";

const Toaster = ({ ...props }: ToasterProps) => {
  const { theme = "system" } = useTheme();

  return (
    <>
      <style>{`
        /* ── Retro Lo-Fi Toast Styling ── */
        [data-sonner-toaster] {
          font-family: 'Space Mono', monospace !important;
        }
        [data-sonner-toast] {
          background: oklch(0.975 0.018 355) !important;
          border: 2px solid oklch(0.58 0.12 340) !important;
          box-shadow: 3px 3px 0px oklch(0.30 0.030 320) !important;
          border-radius: 4px !important;
          color: oklch(0.30 0.030 320) !important;
          font-family: 'Space Mono', monospace !important;
          font-size: 11px !important;
          letter-spacing: 0.04em !important;
          padding: 10px 14px !important;
        }
        /* Success — pink (was green hue 168) */
        [data-sonner-toast][data-type="success"] {
          background: oklch(0.97 0.022 355) !important;
          border-color: oklch(0.58 0.14 340) !important;
          box-shadow: 3px 3px 0px oklch(0.30 0.060 340) !important;
          color: oklch(0.28 0.080 340) !important;
        }
        /* Hide the default green checkmark icon — text already has ✓ */
        [data-sonner-toast][data-type="success"] [data-icon] {
          display: none !important;
        }
        [data-sonner-toast][data-type="error"] {
          background: oklch(0.97 0.022 10) !important;
          border-color: oklch(0.58 0.13 10) !important;
          box-shadow: 3px 3px 0px oklch(0.30 0.060 10) !important;
          color: oklch(0.28 0.060 10) !important;
        }
        [data-sonner-toast][data-type="warning"] {
          background: oklch(0.97 0.025 60) !important;
          border-color: oklch(0.65 0.12 60) !important;
          box-shadow: 3px 3px 0px oklch(0.35 0.060 60) !important;
          color: oklch(0.30 0.060 60) !important;
        }
        [data-sonner-toast][data-type="info"] {
          background: oklch(0.96 0.020 220) !important;
          border-color: oklch(0.58 0.10 220) !important;
          box-shadow: 3px 3px 0px oklch(0.30 0.050 220) !important;
          color: oklch(0.28 0.050 220) !important;
        }
        /* Toast title */
        [data-sonner-toast] [data-title] {
          font-family: 'Space Mono', monospace !important;
          font-size: 11px !important;
          font-weight: 700 !important;
          letter-spacing: 0.06em !important;
          text-transform: uppercase !important;
        }
        /* Toast description */
        [data-sonner-toast] [data-description] {
          font-family: 'Space Mono', monospace !important;
          font-size: 10px !important;
          letter-spacing: 0.03em !important;
          opacity: 0.8 !important;
        }
        /* Close button */
        [data-sonner-toast] [data-close-button] {
          background: oklch(0.86 0.030 340) !important;
          border: 1.5px solid oklch(0.58 0.12 340) !important;
          border-radius: 2px !important;
          color: oklch(0.30 0.030 320) !important;
        }
        /* Action button (e.g. "Undo", "Backup now") */
        [data-sonner-toast] [data-button] {
          background: oklch(0.58 0.18 340) !important;
          border: 2px solid oklch(0.30 0.030 320) !important;
          box-shadow: 2px 2px 0px oklch(0.30 0.030 320) !important;
          border-radius: 3px !important;
          color: #FAF6F1 !important;
          font-family: 'Space Mono', monospace !important;
          font-size: 9px !important;
          font-weight: 700 !important;
          letter-spacing: 0.10em !important;
          text-transform: uppercase !important;
          padding: 4px 10px !important;
          cursor: pointer !important;
          transition: background 0.15s !important;
        }
        [data-sonner-toast] [data-button]:hover {
          background: oklch(0.50 0.18 340) !important;
        }
        /* Cancel button in toasts */
        [data-sonner-toast] [data-cancel] {
          background: transparent !important;
          border: 1.5px solid oklch(0.72 0.060 340) !important;
          border-radius: 3px !important;
          color: oklch(0.55 0.06 340) !important;
          font-family: 'Space Mono', monospace !important;
          font-size: 9px !important;
          letter-spacing: 0.08em !important;
          text-transform: uppercase !important;
          padding: 4px 10px !important;
          cursor: pointer !important;
        }
        /* Icon */
        [data-sonner-toast] [data-icon] {
          font-size: 13px !important;
        }
      `}</style>
      <Sonner
        theme={theme as ToasterProps["theme"]}
        className="toaster group"
        toastOptions={{
          style: {
            fontFamily: "'Space Mono', monospace",
          },
        }}
        style={
          {
            "--normal-bg": "oklch(0.975 0.018 355)",
            "--normal-text": "oklch(0.30 0.030 320)",
            "--normal-border": "oklch(0.58 0.12 340)",
            "--success-bg": "oklch(0.97 0.022 355)",
            "--success-text": "oklch(0.28 0.080 340)",
            "--success-border": "oklch(0.58 0.14 340)",
            "--error-bg": "oklch(0.97 0.022 10)",
            "--error-text": "oklch(0.28 0.060 10)",
            "--error-border": "oklch(0.58 0.13 10)",
          } as React.CSSProperties
        }
        {...props}
      />
    </>
  );
};

export { Toaster };
