"use client";
import LegalViewer from "@/app/(HOME)/legal/_components/LegalViewer";

export default function PrivacyView() {
  return (
    <div className="animate-in fade-in slide-in-from-right-4 duration-500 border border-border bg-background h-[600px]">
        <LegalViewer title="DATA_PRIVACY_LOG" date="Dec 30, 2025">
            <p className="text-xs mb-4 text-zinc-500 font-mono">
                // SYSTEM_NOTE: User data is treated as read-only, encrypted variables.
            </p>
            
            <h3 className="text-sm font-bold text-foreground mt-6 mb-2">1. DATA_COLLECTION_MATRIX</h3>
            <pre className="bg-secondary/20 border border-border p-4 text-xs font-mono overflow-x-auto text-muted-foreground rounded-none">
{`{
  "identity": {
    "required": ["email", "username", "provider_token"],
    "optional": ["bio", "social_links", "location"]
  },
  "telemetry": {
    "collection": "automated",
    "points": [
      "profile_views (Node Reach)",
      "project_clicks",
      "search_queries"
    ]
  },
  "external_sync": {
    "github": "Read-only access to public repos",
    "google": "Auth token verification only"
  }
}`}
            </pre>

            <h3 className="text-sm font-bold text-foreground mt-6 mb-2">2. DATA_RETENTION_POLICY</h3>
            <p>
                <strong>Active Logs:</strong> Operational data is stored while your account status is <code>ACTIVE</code>.<br/>
                <strong>Deletion:</strong> Upon account termination, all personal identifiers are purged from the primary SQL database within 30 days. Analytical aggregates (e.g., "Total Platform Views") remain anonymized.
            </p>

            <h3 className="text-sm font-bold text-foreground mt-6 mb-2">3. COOKIE_PROTOCOL</h3>
            <p>
                We use localized storage tokens solely for session persistence and theme preference (Dark/Light mode). No third-party ad trackers are injected into the kernel.
            </p>
        </LegalViewer>
    </div>
  );
}