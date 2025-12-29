// The Nature Image (Unsplash)
export const DEFAULT_AVATAR = "https://images.unsplash.com/photo-1470071459604-3b5ec3a7fe05?q=80&w=400&auto=format&fit=crop";

/**
 * Universal helper to get the correct avatar.
 * Priority: 
 * 1. Direct avatar_url (Database profile)
 * 2. Metadata avatar_url (Google/GitHub Auth)
 * 3. Default Nature Image
 */
export const getAvatar = (user) => {
  if (!user) return DEFAULT_AVATAR;
  
  return (
    user.avatar_url || 
    user.avatar || 
    user.user_metadata?.avatar_url || 
    DEFAULT_AVATAR
  );
};