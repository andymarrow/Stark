export const isVideoUrl = (url) => {
  if (!url) return false;
  return url.includes("youtube.com") || url.includes("youtu.be");
};

export const getSmartThumbnail = (url) => {
  if (!url) return "/placeholder.jpg"; // Fallback

  if (isVideoUrl(url)) {
    let videoId = "";
    try {
      if (url.includes("youtu.be")) {
        videoId = url.split("/").pop();
      } else if (url.includes("v=")) {
        videoId = url.split("v=")[1].split("&")[0];
      }
      if (videoId) {
        return `https://img.youtube.com/vi/${videoId}/hqdefault.jpg`;
      }
    } catch (e) {
      console.error("Thumbnail extraction failed:", e);
    }
  }
  
  // If it's not a video, or extraction failed, return the original URL (assuming it's an image)
  return url;
};