import LegalViewer from "../_components/LegalViewer";

export default function GuidelinesPage() {
  return (
    <LegalViewer title="CONTRIBUTING.md" date="Jan 15, 2026">
      <p>
        The Stark Network thrives on open collaboration. By submitting a project, you agree to adhere to the following protocol.
      </p>

      <h3>1. OPEN SOURCE PROMISE</h3>
      <p>
        Projects listed as <code>"CODE"</code> must provide access to a public repository (GitHub/GitLab). 
        Do not submit closed-source binaries or obfuscated code unless explicitly categorized as a "Showcase" without source.
      </p>

      <h3>2. QUALITY STANDARDS</h3>
      <p>
        We index functionality, not just aesthetics.
      </p>
      <ul>
        <li><strong>Deployments:</strong> A live demo URL is mandatory for web projects.</li>
        <li><strong>Documentation:</strong> A <code>README.md</code> explains "How to Run" is required for high ranking.</li>
        <li><strong>Originality:</strong> Clones are allowed for learning, but must credit the original author.</li>
      </ul>

      <h3>3. ASSET USAGE</h3>
      <p>
        By uploading images or video, you grant Stark a non-exclusive license to display these assets on the network for promotional and indexing purposes. 
        You retain full ownership of your IP.
      </p>

      <h3>4. FORBIDDEN CONTENT</h3>
      <div className="bg-red-500/10 border-l-2 border-red-500 p-3 my-4">
        <p className="text-red-400 font-bold text-xs uppercase mb-1">Strict Prohibition</p>
        <p className="text-xs text-zinc-400 m-0">
          Malware, phishing kits, hate speech, or illegal content will result in an immediate 
          <span className="text-white font-mono ml-1">IP_BAN</span> and report to relevant authorities.
        </p>
      </div>

      <h3>5. COLLABORATION</h3>
      <p>
        If you fork a project found on Stark, please link back to the original entry. We encourage "Remix Culture" but demand attribution.
      </p>
    </LegalViewer>
  );
}