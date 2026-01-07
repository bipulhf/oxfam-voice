import namesData from "./names.json";
import unionNamesData from "./union_names.json";

type NamesData = Record<string, string[]>;
type UnionNamesData = Record<string, string[]>;

const names: NamesData = namesData as NamesData;
const unionNames: UnionNamesData = unionNamesData as UnionNamesData;

// Get all district names
const districts = Object.keys(names);

// Create a flat list of all upazilas with their district
const upazilaMap = new Map<string, string>();
for (const [district, upazilas] of Object.entries(names)) {
  for (const upazila of upazilas) {
    upazilaMap.set(upazila, district);
  }
}

// Get all upazila names
const allUpazilas = Array.from(upazilaMap.keys());

// Create a flat list of all unions with their upazila
const unionMap = new Map<string, string>();
for (const [upazila, unions] of Object.entries(unionNames)) {
  for (const union of unions) {
    unionMap.set(union, upazila);
  }
}

// Get all union names
const allUnions = Array.from(unionMap.keys());

/**
 * Calculate Levenshtein distance between two strings
 */
function levenshteinDistance(str1: string, str2: string): number {
  const m = str1.length;
  const n = str2.length;

  // Create a 2D array to store distances
  const dp: number[][] = Array(m + 1)
    .fill(null)
    .map(() => Array(n + 1).fill(0));

  // Initialize first column
  for (let i = 0; i <= m; i++) {
    dp[i][0] = i;
  }

  // Initialize first row
  for (let j = 0; j <= n; j++) {
    dp[0][j] = j;
  }

  // Fill in the rest of the matrix
  for (let i = 1; i <= m; i++) {
    for (let j = 1; j <= n; j++) {
      if (str1[i - 1] === str2[j - 1]) {
        dp[i][j] = dp[i - 1][j - 1];
      } else {
        dp[i][j] = 1 + Math.min(dp[i - 1][j], dp[i][j - 1], dp[i - 1][j - 1]);
      }
    }
  }

  return dp[m][n];
}

/**
 * Calculate similarity score between two strings (0 to 1, where 1 is exact match)
 */
function similarityScore(str1: string, str2: string): number {
  const maxLen = Math.max(str1.length, str2.length);
  if (maxLen === 0) return 1;
  const distance = levenshteinDistance(str1, str2);
  return 1 - distance / maxLen;
}

/**
 * Normalize Bengali text for better matching
 * Removes common suffixes and normalizes variations
 */
function normalizeBengali(text: string): string {
  if (!text) return "";

  let normalized = text.trim();

  // Remove common suffixes/prefixes that might vary
  const suffixesToRemove = [
    " জেলা",
    " উপজেলা",
    " থানা",
    " সদর",
    " ইউনিয়ন",
    "জেলা ",
    "উপজেলা ",
    "থানা ",
    "ইউনিয়ন ",
  ];

  for (const suffix of suffixesToRemove) {
    if (normalized.includes(suffix)) {
      normalized = normalized.replace(suffix, " ");
    }
  }

  // Remove extra whitespace
  normalized = normalized.replace(/\s+/g, " ").trim();

  return normalized;
}

/**
 * Find the best matching district name
 */
export function matchDistrict(input: string): {
  matched: string;
  score: number;
  original: string;
} {
  if (!input || typeof input !== "string") {
    return { matched: "", score: 0, original: input || "" };
  }

  const normalizedInput = normalizeBengali(input);

  // First, check for exact match
  if (districts.includes(input)) {
    return { matched: input, score: 1, original: input };
  }

  // Check if normalized input matches exactly
  const exactMatch = districts.find(
    (d) => normalizeBengali(d) === normalizedInput
  );
  if (exactMatch) {
    return { matched: exactMatch, score: 1, original: input };
  }

  // Find the best fuzzy match
  let bestMatch = "";
  let bestScore = 0;

  for (const district of districts) {
    const normalizedDistrict = normalizeBengali(district);
    const score = similarityScore(normalizedInput, normalizedDistrict);

    if (score > bestScore) {
      bestScore = score;
      bestMatch = district;
    }
  }

  // Only return match if score is above threshold (0.5 = 50% similarity)
  const THRESHOLD = 0.5;
  if (bestScore >= THRESHOLD) {
    return { matched: bestMatch, score: bestScore, original: input };
  }

  // Return original if no good match found
  return { matched: input, score: 0, original: input };
}

/**
 * Find the best matching upazila name
 * Optionally constrained to a specific district
 */
export function matchUpazila(
  input: string,
  district?: string
): { matched: string; score: number; original: string } {
  if (!input || typeof input !== "string") {
    return { matched: "", score: 0, original: input || "" };
  }

  const normalizedInput = normalizeBengali(input);

  // Determine which upazilas to search
  let searchUpazilas: string[];
  if (district && names[district]) {
    searchUpazilas = names[district];
  } else {
    searchUpazilas = allUpazilas;
  }

  // First, check for exact match
  if (searchUpazilas.includes(input)) {
    return { matched: input, score: 1, original: input };
  }

  // Check if normalized input matches exactly
  const exactMatch = searchUpazilas.find(
    (u) => normalizeBengali(u) === normalizedInput
  );
  if (exactMatch) {
    return { matched: exactMatch, score: 1, original: input };
  }

  // Find the best fuzzy match
  let bestMatch = "";
  let bestScore = 0;

  for (const upazila of searchUpazilas) {
    const normalizedUpazila = normalizeBengali(upazila);
    const score = similarityScore(normalizedInput, normalizedUpazila);

    if (score > bestScore) {
      bestScore = score;
      bestMatch = upazila;
    }
  }

  // Only return match if score is above threshold (0.5 = 50% similarity)
  const THRESHOLD = 0.5;
  if (bestScore >= THRESHOLD) {
    return { matched: bestMatch, score: bestScore, original: input };
  }

  // Return original if no good match found
  return { matched: input, score: 0, original: input };
}

/**
 * Find the best matching union name
 * Optionally constrained to a specific upazila
 */
export function matchUnion(
  input: string,
  upazila?: string
): { matched: string; score: number; original: string } {
  if (!input || typeof input !== "string") {
    return { matched: "", score: 0, original: input || "" };
  }

  const normalizedInput = normalizeBengali(input);

  // Determine which unions to search
  let searchUnions: string[];
  if (upazila && unionNames[upazila]) {
    searchUnions = unionNames[upazila];
  } else {
    searchUnions = allUnions;
  }

  // First, check for exact match
  if (searchUnions.includes(input)) {
    return { matched: input, score: 1, original: input };
  }

  // Check if normalized input matches exactly
  const exactMatch = searchUnions.find(
    (u) => normalizeBengali(u) === normalizedInput
  );
  if (exactMatch) {
    return { matched: exactMatch, score: 1, original: input };
  }

  // Find the best fuzzy match
  let bestMatch = "";
  let bestScore = 0;

  for (const union of searchUnions) {
    const normalizedUnion = normalizeBengali(union);
    const score = similarityScore(normalizedInput, normalizedUnion);

    if (score > bestScore) {
      bestScore = score;
      bestMatch = union;
    }
  }

  // Only return match if score is above threshold (0.5 = 50% similarity)
  const THRESHOLD = 0.5;
  if (bestScore >= THRESHOLD) {
    return { matched: bestMatch, score: bestScore, original: input };
  }

  // Return original if no good match found
  return { matched: input, score: 0, original: input };
}

/**
 * Match district, upazila, and union, using context for better matching
 * If union is matched but upazila is not provided, extract upazila from matched union
 * If upazila is matched but district is not provided, extract district from matched upazila
 */
export function matchLocation(
  district?: string,
  upazila?: string,
  union?: string
): { district?: string; upazila?: string; union?: string } {
  const result: { district?: string; upazila?: string; union?: string } = {};

  // Match district first if provided
  if (district) {
    const districtMatch = matchDistrict(district);
    result.district = districtMatch.matched || district;
  }

  // Match upazila with district context if available
  if (upazila) {
    const matchedDistrict = result.district || district;
    const upazilaMatch = matchUpazila(upazila, matchedDistrict);
    result.upazila = upazilaMatch.matched || upazila;

    // If upazila is matched but district is not provided, extract district from upazila
    if (!result.district && upazilaMatch.score > 0) {
      const inferredDistrict = upazilaMap.get(upazilaMatch.matched);
      if (inferredDistrict) {
        result.district = inferredDistrict;
      }
    }
  }

  // Match union with upazila context if available
  if (union) {
    const matchedUpazila = result.upazila || upazila;
    const unionMatch = matchUnion(union, matchedUpazila);
    result.union = unionMatch.matched || union;

    // If union is matched but upazila is not provided, extract upazila from union
    if (!result.upazila && unionMatch.score > 0) {
      const inferredUpazila = unionMap.get(unionMatch.matched);
      if (inferredUpazila) {
        result.upazila = inferredUpazila;
        // Also try to extract district from the inferred upazila
        if (!result.district) {
          const inferredDistrict = upazilaMap.get(inferredUpazila);
          if (inferredDistrict) {
            result.district = inferredDistrict;
          }
        }
      }
    }
  }

  return result;
}

/**
 * Get all upazilas for a given district
 */
export function getUpazilasForDistrict(district: string): string[] {
  return names[district] || [];
}

/**
 * Get all districts
 */
export function getAllDistricts(): string[] {
  return districts;
}

/**
 * Check if a district exists in the data
 */
export function isValidDistrict(district: string): boolean {
  return districts.includes(district);
}

/**
 * Check if an upazila exists for a given district
 */
export function isValidUpazila(upazila: string, district?: string): boolean {
  if (district) {
    return names[district]?.includes(upazila) || false;
  }
  return upazilaMap.has(upazila);
}

/**
 * Get all unions for a given upazila
 */
export function getUnionsForUpazila(upazila: string): string[] {
  return unionNames[upazila] || [];
}

/**
 * Check if a union exists for a given upazila
 */
export function isValidUnion(union: string, upazila?: string): boolean {
  if (upazila) {
    return unionNames[upazila]?.includes(union) || false;
  }
  return unionMap.has(union);
}
