import { Link } from "wouter";

const APP_NAME = "ADHD Focus Space";
const APP_URL = "https://adhdfocus.space";
const CONTACT_EMAIL = "yiweicheng465@gmail.com";
const EFFECTIVE_DATE = "April 20, 2026";

export default function PrivacyPolicy() {
  return (
    <div
      style={{
        minHeight: "100vh",
        background: "oklch(0.97 0.012 355)",
        fontFamily: "'Space Mono', 'Courier New', monospace",
        color: "oklch(0.25 0.04 340)",
        padding: "0 0 80px",
      }}
    >
      {/* Header */}
      <div
        style={{
          background: "oklch(0.93 0.045 355)",
          borderBottom: "1.5px solid oklch(0.82 0.08 340)",
          padding: "20px 32px",
          display: "flex",
          alignItems: "center",
          gap: 16,
        }}
      >
        <Link href="/">
          <span
            style={{
              fontSize: "0.75rem",
              color: "oklch(0.55 0.12 340)",
              cursor: "pointer",
              textDecoration: "underline",
              letterSpacing: "0.05em",
            }}
          >
            ← BACK TO APP
          </span>
        </Link>
        <span style={{ color: "oklch(0.75 0.08 340)", fontSize: "0.75rem" }}>|</span>
        <span
          style={{
            fontSize: "0.85rem",
            fontWeight: 700,
            letterSpacing: "0.08em",
            color: "oklch(0.35 0.1 340)",
          }}
        >
          {APP_NAME.toUpperCase()} — PRIVACY POLICY
        </span>
      </div>

      {/* Content */}
      <div style={{ maxWidth: 760, margin: "0 auto", padding: "48px 32px" }}>
        <h1
          style={{
            fontSize: "1.6rem",
            fontWeight: 700,
            letterSpacing: "0.06em",
            marginBottom: 8,
            color: "oklch(0.3 0.1 340)",
          }}
        >
          Privacy Policy
        </h1>
        <p style={{ fontSize: "0.75rem", color: "oklch(0.55 0.08 340)", marginBottom: 40 }}>
          Effective Date: {EFFECTIVE_DATE} &nbsp;·&nbsp; App: {APP_NAME} &nbsp;·&nbsp;{" "}
          <a href={APP_URL} style={{ color: "oklch(0.5 0.12 340)" }}>
            {APP_URL}
          </a>
        </p>

        <Section title="1. Overview">
          <p>
            {APP_NAME} ("the App", "we", "us") is a productivity and focus tool designed for
            individuals with ADHD. This Privacy Policy explains what information we collect, how we
            use it, and your rights regarding your data. By using the App, you agree to the
            practices described in this policy.
          </p>
        </Section>

        <Section title="2. Information We Collect">
          <p>
            <strong>Google Account Information.</strong> When you sign in with Google, we receive
            your Google account ID, display name, and email address via Google's OAuth 2.0
            sign-in service. We use this information solely to identify your account and
            personalize your experience within the App.
          </p>
          <p style={{ marginTop: 12 }}>
            <strong>App Data You Create.</strong> All tasks, goals, routines, focus sessions,
            timer settings, and other content you create within the App are stored locally in
            your browser's localStorage and, optionally, in our server-side database tied to
            your account. This data is used exclusively to provide the App's core functionality.
          </p>
          <p style={{ marginTop: 12 }}>
            <strong>Usage Data.</strong> We do not collect analytics, tracking pixels, or
            behavioral data. We do not use third-party advertising or analytics SDKs.
          </p>
        </Section>

        <Section title="3. How We Use Your Information">
          <p>We use the information we collect for the following purposes only:</p>
          <ul style={{ paddingLeft: 20, marginTop: 8, lineHeight: 2 }}>
            <li>To authenticate you and maintain your session</li>
            <li>To store and sync your tasks, goals, and focus data across devices</li>
            <li>To display your name within the App interface</li>
            <li>To respond to support requests you initiate</li>
          </ul>
          <p style={{ marginTop: 12 }}>
            We do <strong>not</strong> use your data for advertising, profiling, or AI model
            training. We do not sell or share your data with third parties.
          </p>
        </Section>

        <Section title="4. Google API Services — Limited Use Disclosure">
          <p>
            {APP_NAME}'s use of information received from Google APIs adheres to the{" "}
            <a
              href="https://developers.google.com/terms/api-services-user-data-policy"
              target="_blank"
              rel="noopener noreferrer"
              style={{ color: "oklch(0.5 0.12 340)" }}
            >
              Google API Services User Data Policy
            </a>
            , including the Limited Use requirements.
          </p>
          <p style={{ marginTop: 12 }}>
            Specifically, data obtained through Google APIs is:
          </p>
          <ul style={{ paddingLeft: 20, marginTop: 8, lineHeight: 2 }}>
            <li>
              Used only to provide and improve user-facing features within {APP_NAME}
            </li>
            <li>Not transferred to third parties except as necessary to provide the service</li>
            <li>Not used for advertising purposes</li>
            <li>Not used to determine creditworthiness or for lending</li>
            <li>Not read by humans except as required for security or legal compliance</li>
          </ul>
          <p style={{ marginTop: 12 }}>
            The App requests only the minimum Google OAuth scopes necessary:{" "}
            <code
              style={{
                background: "oklch(0.88 0.03 340)",
                padding: "2px 6px",
                borderRadius: 3,
                fontSize: "0.8rem",
              }}
            >
              openid
            </code>
            ,{" "}
            <code
              style={{
                background: "oklch(0.88 0.03 340)",
                padding: "2px 6px",
                borderRadius: 3,
                fontSize: "0.8rem",
              }}
            >
              profile
            </code>
            , and{" "}
            <code
              style={{
                background: "oklch(0.88 0.03 340)",
                padding: "2px 6px",
                borderRadius: 3,
                fontSize: "0.8rem",
              }}
            >
              email
            </code>
            . We do not access Gmail, Google Calendar, Google Drive, or any other Google
            product data.
          </p>
        </Section>

        <Section title="5. Data Storage and Security">
          <p>
            Your app data is stored in your browser's localStorage and, when signed in, in a
            server-side database. We take reasonable technical measures to protect your data.
            However, no method of transmission over the internet is 100% secure.
          </p>
          <p style={{ marginTop: 12 }}>
            You can export all your data at any time using the built-in backup feature, and
            delete your account data by contacting us.
          </p>
        </Section>

        <Section title="6. Data Retention and Deletion">
          <p>
            We retain your account and app data for as long as your account is active. You may
            request deletion of your data at any time by contacting us at{" "}
            <a href={`mailto:${CONTACT_EMAIL}`} style={{ color: "oklch(0.5 0.12 340)" }}>
              {CONTACT_EMAIL}
            </a>
            . We will delete your data within 30 days of a verified request.
          </p>
        </Section>

        <Section title="7. Children's Privacy">
          <p>
            The App is not directed to children under 13. We do not knowingly collect personal
            information from children under 13. If you believe we have inadvertently collected
            such information, please contact us immediately.
          </p>
        </Section>

        <Section title="8. Changes to This Policy">
          <p>
            We may update this Privacy Policy from time to time. We will notify users of
            significant changes by updating the effective date at the top of this page. Continued
            use of the App after changes constitutes acceptance of the updated policy.
          </p>
        </Section>

        <Section title="9. Contact">
          <p>
            If you have any questions about this Privacy Policy or how we handle your data,
            please contact us at:{" "}
            <a href={`mailto:${CONTACT_EMAIL}`} style={{ color: "oklch(0.5 0.12 340)" }}>
              {CONTACT_EMAIL}
            </a>
          </p>
        </Section>

        <div
          style={{
            marginTop: 48,
            paddingTop: 24,
            borderTop: "1px solid oklch(0.85 0.05 340)",
            fontSize: "0.7rem",
            color: "oklch(0.6 0.06 340)",
            textAlign: "center",
          }}
        >
          © {new Date().getFullYear()} {APP_NAME} · All rights reserved ·{" "}
          <a href={APP_URL} style={{ color: "oklch(0.5 0.1 340)" }}>
            {APP_URL}
          </a>
        </div>
      </div>
    </div>
  );
}

function Section({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <div style={{ marginBottom: 36 }}>
      <h2
        style={{
          fontSize: "0.85rem",
          fontWeight: 700,
          letterSpacing: "0.06em",
          color: "oklch(0.35 0.1 340)",
          marginBottom: 12,
          textTransform: "uppercase",
        }}
      >
        {title}
      </h2>
      <div
        style={{
          fontSize: "0.82rem",
          lineHeight: 1.8,
          color: "oklch(0.3 0.05 340)",
        }}
      >
        {children}
      </div>
    </div>
  );
}
