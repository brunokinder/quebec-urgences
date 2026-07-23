// The MSSS source feed provides hospital names in ALL CAPS. This converts
// them to a more readable French title case for display, while preserving
// known institutional acronyms (CHU, CLSC, etc.) and French elisions/particles.

const ACRONYMS = new Set([
  "CHU", "CHUL", "CHUQ", "CHUM", "CHUS", "CHRTR", "CLSC", "CSSS",
  "CISSS", "CIUSSS", "IUCPQ", "IUSMM", "ICM", "HGJ", "HMR", "HSCM", "UMF", "CH",
]);

const LOWERCASE_WORDS = new Set([
  "de", "du", "des", "la", "le", "les", "et", "à", "en", "sur", "au", "aux", "sous", "dans", "avec",
]);

function capitalizeSegment(segment: string): string {
  const match = segment.match(/^([^A-Za-zÀ-ÿ]*)([A-Za-zÀ-ÿ])(.*)$/);
  if (!match) return segment.toLowerCase();
  const [, prefix, first, rest] = match;
  return prefix + first.toUpperCase() + rest.toLowerCase();
}

function formatWord(word: string, isFirstWord: boolean): string {
  if (!word) return word;
  const upper = word.toUpperCase();
  if (ACRONYMS.has(upper)) return upper;

  const elisionMatch = word.match(/^([A-Za-zÀ-ÿ])(['’])(.+)$/);
  if (elisionMatch) {
    const [, article, apostrophe, rest] = elisionMatch;
    const formattedArticle = isFirstWord ? article.toUpperCase() : article.toLowerCase();
    return `${formattedArticle}${apostrophe}${formatWord(rest, false)}`;
  }

  if (word.includes("-")) {
    return word
      .split("-")
      .map((part, i) => formatWord(part, isFirstWord && i === 0))
      .join("-");
  }

  const lower = word.toLowerCase();
  if (!isFirstWord && LOWERCASE_WORDS.has(lower)) return lower;

  return capitalizeSegment(word);
}

/** Format an ALL CAPS MSSS hospital name into readable French title case. */
export function formatHospitalName(name: string): string {
  if (!name) return name;
  let wordIndex = 0;
  return name
    .split(/(\s+)/)
    .map((token) => {
      if (/^\s+$/.test(token) || token === "") return token;
      const formatted = formatWord(token, wordIndex === 0);
      wordIndex++;
      return formatted;
    })
    .join("");
}
