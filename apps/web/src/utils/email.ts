export const extractSenderName = (emailAddress: string): string => {
  // If the email contains a display name (e.g., "John Doe <john@example.com>")
  const displayNameMatch = emailAddress.match(/^"?([^"<]+)"?\s*<?[^>]*>?$/);
  if (displayNameMatch) {
    return displayNameMatch[1].trim();
  }

  // If it's just an email address, take the part before @ and format it
  const emailOnlyMatch = emailAddress.match(/^([^@]+)@/);
  if (emailOnlyMatch) {
    // Convert dots and underscores to spaces, capitalize words
    return emailOnlyMatch[1]
      .replace(/[._]/g, ' ')
      .split(' ')
      .map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
      .join(' ')
      .trim();
  }

  // Fallback to the original string
  return emailAddress;
}; 