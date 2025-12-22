import LegalViewer from "../_components/LegalViewer";

export default function TermsPage() {
  return (
    <LegalViewer title="TERMS_OF_SERVICE" date="Oct 24, 2024">
      <p>
        By accessing the Stark Network (<code>"The Protocol"</code>), you agree to execute the following contract parameters.
      </p>

      <h3>1. DEFINITIONS</h3>
      <p>
        <strong>"User"</strong> refers to any entity executing read/write operations on the platform.<br/>
        <strong>"Assets"</strong> refers to code repositories, design tokens, and motion graphics uploaded to the index.
      </p>

      <h3>2. ACCEPTABLE USE</h3>
      <p>
        You agree not to inject malicious scripts, attempt DDoS attacks on the infrastructure, or scrape the database without API authorization. 
        Violations will result in an immediate <code>403_FORBIDDEN</code> ban.
      </p>

      <h3>3. INTELLECTUAL PROPERTY</h3>
      <p>
        Code uploaded to public repositories retains the license specified in the root <code>LICENSE</code> file. 
        Stark claims no ownership over your source code, only the right to display it within the UI.
      </p>

      <h3>4. TERMINATION</h3>
      <p>
        We reserve the right to <code>SIGKILL</code> your account at any time if you violate the Community Standards protocol.
      </p>
    </LegalViewer>
  );
}