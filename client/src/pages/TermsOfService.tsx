import { Link } from "wouter";

const APP_NAME = "ADHD Focus Space";
const APP_URL = "https://adhdfocus.space";
const CONTACT_EMAIL = "yiweicheng465@gmail.com";
const EFFECTIVE_DATE = "April 20, 2026";

export default function TermsOfService() {
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
          <span style={{ fontSize: "1.4rem", cursor: "pointer" }}>🧠</span>
        </Link>
        <div>
          <div style={{ fontWeight: 700, fontSize: "1.1rem", letterSpacing: "0.04em" }}>
            {APP_NAME}
          </div>
          <div style={{ fontSize: "0.75rem", opacity: 0.6 }}>Terms of Service</div>
        </div>
      </div>

      {/* Content */}
      <div style={{ maxWidth: 760, margin: "0 auto", padding: "40px 32px" }}>
        <h1 style={{ fontSize: "1.5rem", fontWeight: 700, marginBottom: 4 }}>
          Terms of Service
        </h1>
        <p style={{ fontSize: "0.8rem", opacity: 0.55, marginBottom: 36 }}>
          Effective Date: {EFFECTIVE_DATE}
        </p>

        <Section title="1. Acceptance of Terms">
          <p>
            By accessing or using {APP_NAME} at{" "}
            <a href={APP_URL} style={linkStyle}>{APP_URL}</a>, you agree to be
            bound by these Terms of Service. If you do not agree, please do not
            use the application.
          </p>
        </Section>

        <Section title="2. Description of Service">
          <p>
            {APP_NAME} is a productivity and focus tool designed to help
            individuals — particularly those with ADHD — manage tasks, track
            habits, and maintain focus through timers, routines, and an AI
            assistant. The service is provided as-is for personal, non-commercial
            use.
          </p>
        </Section>

        <Section title="3. User Accounts">
          <p>
            You may sign in using your Google account. By doing so, you authorize
            us to access your basic profile information (name and email address)
            solely for the purpose of identifying your account. We do not access
            your Gmail, Google Drive, Google Calendar, or any other Google
            services.
          </p>
          <p style={{ marginTop: 10 }}>
            You are responsible for maintaining the security of your account and
            for all activity that occurs under it.
          </p>
        </Section>

        <Section title="4. User Data">
          <p>
            All task data, goals, routines, and settings are stored locally in
            your browser (localStorage). We do not store your personal task data
            on our servers. Your OpenAI API key, if provided, is stored encrypted
            in your browser only.
          </p>
          <p style={{ marginTop: 10 }}>
            You may export and delete your data at any time using the backup
            feature within the application.
          </p>
        </Section>

        <Section title="5. Acceptable Use">
          <p>You agree not to:</p>
          <ul style={{ paddingLeft: 20, lineHeight: 2 }}>
            <li>Use the service for any unlawful purpose</li>
            <li>Attempt to reverse-engineer, hack, or disrupt the service</li>
            <li>Use the service to harm, harass, or deceive others</li>
            <li>Violate any applicable laws or regulations</li>
          </ul>
        </Section>

        <Section title="6. Third-Party Services">
          <p>
            The application integrates with third-party services including Google
            Sign-In and OpenAI. Your use of these services is subject to their
            respective terms of service and privacy policies. We are not
            responsible for the practices of these third parties.
          </p>
        </Section>

        <Section title="7. Disclaimer of Warranties">
          <p>
            {APP_NAME} is provided "as is" without warranties of any kind,
            express or implied. We do not guarantee that the service will be
            uninterrupted, error-free, or meet your specific requirements. Use of
            the service is at your own risk.
          </p>
        </Section>

        <Section title="8. Limitation of Liability">
          <p>
            To the fullest extent permitted by law, {APP_NAME} and its creators
            shall not be liable for any indirect, incidental, special,
            consequential, or punitive damages arising from your use of or
            inability to use the service.
          </p>
        </Section>

        <Section title="9. Changes to Terms">
          <p>
            We may update these Terms of Service from time to time. Changes will
            be posted at this URL with an updated effective date. Continued use
            of the service after changes constitutes acceptance of the revised
            terms.
          </p>
        </Section>

        <Section title="10. Contact">
          <p>
            If you have any questions about these Terms of Service, please contact
            us at:{" "}
            <a href={`mailto:${CONTACT_EMAIL}`} style={linkStyle}>
              {CONTACT_EMAIL}
            </a>
          </p>
        </Section>

        <div style={{ marginTop: 48, paddingTop: 24, borderTop: "1px solid oklch(0.85 0.04 340)", fontSize: "0.75rem", opacity: 0.5 }}>
          <Link href="/privacy" style={linkStyle}>Privacy Policy</Link>
          {" · "}
          <Link href="/" style={linkStyle}>Back to App</Link>
        </div>
      </div>
    </div>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div style={{ marginBottom: 32 }}>
      <h2 style={{ fontSize: "0.95rem", fontWeight: 700, marginBottom: 10, letterSpacing: "0.02em" }}>
        {title}
      </h2>
      <div style={{ fontSize: "0.82rem", lineHeight: 1.8, opacity: 0.85 }}>
        {children}
      </div>
    </div>
  );
}

const linkStyle: React.CSSProperties = {
  color: "oklch(0.52 0.10 340)",
  textDecoration: "underline",
};
