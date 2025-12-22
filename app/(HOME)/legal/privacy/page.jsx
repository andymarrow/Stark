import LegalViewer from "../_components/LegalViewer";

export default function PrivacyPage() {
  return (
    <LegalViewer title="PRIVACY_POLICY" date="Nov 02, 2024">
      <p className="text-xs mb-4 text-zinc-500">// We treat your data as read-only, encrypted variables.</p>
      
      <pre className="bg-transparent p-0 text-sm overflow-x-auto">
{`{
  "data_collection": {
    "identity": ["username", "email_hash", "avatar_url"],
    "telemetry": ["usage_logs", "device_fingerprint"],
    "cookies": true
  },
  "usage_protocol": [
    "To authenticate your session token",
    "To render your personalized dashboard",
    "To prevent botnet attacks via Rate Limiting"
  ],
  "third_party_sharing": {
    "analytics": "Google (Anonymized)",
    "hosting": "Vercel Edge Network",
    "payment": "Stripe"
  },
  "user_rights": {
    "export_data": "Available via API",
    "delete_account": "Instant via Settings"
  }
}`}
      </pre>

      <div className="mt-6 border-l-2 border-accent pl-4 py-1">
        <h4 className="text-foreground font-bold text-xs uppercase mb-1">Security Note</h4>
        <p className="text-xs">
            All database connections are encrypted via TLS 1.3. We salt and hash passwords using bcrypt before they touch our disk.
        </p>
      </div>
    </LegalViewer>
  );
}