/**
 * parses "github.com/owner/repo" or "https://github.com/owner/repo.git"
 * -> { owner, repo }
 */
const parseGitHubUrl = (input) => {
    try {
      let urlStr = input.trim();
      
      // 1. Add protocol if missing
      if (!urlStr.startsWith("http")) {
        urlStr = `https://${urlStr}`;
      }
  
      const urlObj = new URL(urlStr);
      
      // 2. Verify Hostname
      if (!urlObj.hostname.includes("github.com")) return null;
  
      // 3. Clean Path
      // Remove leading/trailing slashes and split
      const parts = urlObj.pathname.replace(/^\/|\/$/g, "").split("/");
  
      // 4. Extract Owner/Repo
      if (parts.length < 2) return null;
      
      const owner = parts[0];
      let repo = parts[1];
  
      // 5. Remove .git extension if present
      if (repo.endsWith(".git")) {
        repo = repo.slice(0, -4);
      }
  
      return { owner, repo };
    } catch (e) {
      console.error("URL Parsing Error:", e);
      return null;
    }
  };
  
  export const fetchRepositoryData = async (url) => {
    const coords = parseGitHubUrl(url);
    
    if (!coords) {
        console.warn("Invalid GitHub URL format");
        return { error: "INVALID_GIT_URL" };
    }
  
    console.log(`Attempting to fetch: ${coords.owner}/${coords.repo}`);
  
    try {
      // 1. Fetch Repo Metadata
      const repoRes = await fetch(`https://api.github.com/repos/${coords.owner}/${coords.repo}`);
      
      if (!repoRes.ok) {
        console.error(`GitHub API Error: ${repoRes.status} ${repoRes.statusText}`);
        if (repoRes.status === 404) return { error: "REPO_NOT_FOUND" };
        if (repoRes.status === 403) return { error: "API_RATE_LIMIT_EXCEEDED" };
        return { error: `GITHUB_ERROR_${repoRes.status}` };
      }
      
      const repoData = await repoRes.json();
  
      // 2. Fetch Readme (Try multiple branches/filenames if specific one fails, but usually default works)
      // Note: We use the API endpoint which returns base64 encoded content to avoid CORS issues with raw.githubusercontent
      const readmeRes = await fetch(`https://api.github.com/repos/${coords.owner}/${coords.repo}/readme`);
      let readmeContent = "";
      
      if (readmeRes.ok) {
        const readmeJson = await readmeRes.json();
        // Decode Base64 to UTF-8 properly handling special characters
        try {
            readmeContent = decodeURIComponent(escape(window.atob(readmeJson.content)));
        } catch (e) {
            readmeContent = window.atob(readmeJson.content);
        }
      }
  
      return {
        success: true,
        data: {
          title: repoData.name,
          description: repoData.description,
          tags: repoData.topics || [],
          homepage: repoData.homepage, // <--- This is the LIVE DEMO link
          stars: repoData.stargazers_count,
          forks: repoData.forks_count,
          language: repoData.language,
          readme: readmeContent
        }
      };
  
    } catch (error) {
      console.error("Network/Fetch Error:", error);
      return { error: "NETWORK_ERROR" };
    }
  };