/**
 * Truncates a string to a maximum number of words.
 * @param text - The string to truncate
 * @param maxWords - Maximum number of words to keep (default: 10)
 * @param suffix - String to append when truncated (default: '...')
 * @returns The truncated string
 */
export function truncateWords(
  text: string,
  maxWords: number = 10,
  suffix: string = '...',
): string {
  if (!text || typeof text !== 'string') return '';

  const words = text.trim().split(/\s+/).filter(Boolean);

  if (words.length <= maxWords) return text.trim();
  return words.slice(0, maxWords).join(' ') + suffix;
}
