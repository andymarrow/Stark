export const isVideoUrl = (url) => {
  if (!url) return false;
  return url.includes("youtube.com") || url.includes("youtu.be");
};

export const getSmartThumbnail = (url) => {
  if (!url) return "/placeholder.jpg"; // Fallback

  if (isVideoUrl(url)) {
    let videoId = "";
    try {
      if (url.includes("youtu.be/")) {
        videoId = url.split("youtu.be/")[1];
      } else if (url.includes("v=")) {
        videoId = url.split("v=")[1].split("&")[0];
      } else if (url.includes("embed/")) {
        videoId = url.split("embed/")[1];
      }

      // CRITICAL FIX: Strip query parameters (like ?si=...) and trailing slashes
      if (videoId) {
        videoId = videoId.split("?")[0].split("/")[0];
        return `https://img.youtube.com/vi/${videoId}/hqdefault.jpg`;
      }
    } catch (e) {
      console.error("Thumbnail extraction failed:", e);
    }
  }
  
  // If it's not a video, or extraction failed, return the original URL (assuming it's an image)
  return url;
};