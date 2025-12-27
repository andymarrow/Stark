/**
 * parses "github.com/owner/repo" or "https://github.com/owner/repo.git"
 * -> { owner, repo }
 */
const parseGitHubUrl = (input) => {
    try {
      let urlStr = input.trim();
      
      if (!urlStr.startsWith("http")) {
        urlStr = `https://${urlStr}`;
      }
  
      const urlObj = new URL(urlStr);
      if (!urlObj.hostname.includes("github.com")) return null;
  
      const parts = urlObj.pathname.replace(/^\/|\/$/g, "").split("/");
      if (parts.length < 2) return null;
      
      const owner = parts[0];
      let repo = parts[1];
  
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
        return { error: "INVALID_GIT_URL" };
    }
  
    // Prepare Headers - Use GITHUB_TOKEN if available in .env.local
    const headers = {
        "Accept": "application/vnd.github.v3+json",
    };

    if (process.env.GITHUB_TOKEN) {
        headers["Authorization"] = `token ${process.env.GITHUB_TOKEN}`;
    }
  
    try {
      // 1. Fetch Repo Metadata
      const repoRes = await fetch(`https://api.github.com/repos/${coords.owner}/${coords.repo}`, { headers });
      
      if (!repoRes.ok) {
        if (repoRes.status === 404) return { error: "REPO_NOT_FOUND" };
        if (repoRes.status === 403) return { error: "API_RATE_LIMIT_EXCEEDED" };
        return { error: `GITHUB_ERROR_${repoRes.status}` };
      }
      
      const repoData = await repoRes.json();
  
      // 2. Fetch Readme
      const readmeRes = await fetch(`https://api.github.com/repos/${coords.owner}/${coords.repo}/readme`, { headers });
      let readmeContent = "";
      
      if (readmeRes.ok) {
        const readmeJson = await readmeRes.json();
        // Decoding base64 safely on server-side
        readmeContent = Buffer.from(readmeJson.content, 'base64').toString('utf-8');
      }
  
      return {
        success: true,
        data: {
          title: repoData.name,
          description: repoData.description,
          tags: repoData.topics || [],
          homepage: repoData.homepage, 
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