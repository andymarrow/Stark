"use client";
import LegalViewer from "@/app/(HOME)/legal/_components/LegalViewer";

export default function TermsView() {
  return (
    <div className="animate-in fade-in slide-in-from-right-4 duration-500 border border-border bg-background h-[600px]">
        <LegalViewer title="PROTOCOL_TERMS_V1.0" date="Dec 30, 2025">
            <p>
                Access to the Stark Network (<code>"The Grid"</code>) is a privilege, not a right. 
                By initializing a session, you agree to the following operational parameters.
            </p>

            <h3>1. THE HYPE ENGINE & RANKING</h3>
            <p>
                Stark utilizes an automated <strong>Quality Score Algorithm</strong>.
            </p>
            <ul>
                <li><strong>Manipulation:</strong> Any attempt to artificially inflate Views, Likes, or Hype Scores via botnets or scripts will result in an immediate <code>shadowban</code>.</li>
                <li><strong>Volatility:</strong> Scores are dynamic. We reserve the right to adjust weighting logic (e.g., valuing GitHub stars over Views) without prior notice to maintain ecosystem health.</li>
            </ul>

            <h3>2. CODE INTEGRITY & ASSETS</h3>
            <p>
                You retain full ownership of your code. However, by deploying to Stark:
            </p>
            <ul>
                <li>You grant us a license to index, display, and analyze your repository metadata.</li>
                <li>You warrant that your code does not contain malicious payloads, miners, or obfuscated scripts intended to harm visitors.</li>
            </ul>

            <h3>3. INCIDENT REPORTING & MODERATION</h3>
            <p>
                The community acts as the first line of defense.
            </p>
            <ul>
                <li><strong>Flagging:</strong> Any user may flag a Project, Comment, or Profile.</li>
                <li><strong>Review Process:</strong> Flags are processed by the Admin Console. </li>
                <li><strong>Zero Tolerance:</strong> Hate speech, harassment, or "spam" deployments result in a permanent <code>SIGKILL</code> (Account Termination).</li>
            </ul>

            <h3>4. LIABILITY</h3>
            <p>
                Stark provides code "AS IS". We are not responsible if a copied snippet breaks your production environment. 
                <span className="text-red-500"> Always audit code before deployment.</span>
            </p>
        </LegalViewer>
    </div>
  );
}