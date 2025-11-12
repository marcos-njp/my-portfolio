/**
 * Query Preprocessing - Handle typos, spelling errors, and text normalization
 */

// Common typo mappings for interview/professional terms
const TYPO_CORRECTIONS: Record<string, string> = {
  // Common misspellings
  'wat': 'what',
  'wut': 'what',
  'wht': 'what',
  'waht': 'what',
  'cna': 'can',
  'cann': 'can',
  'offre': 'offer',
  'skilss': 'skills',
  'skils': 'skills',
  'experiance': 'experience',
  'experince': 'experience',
  'expereince': 'experience',
  'projets': 'projects',
  'projetcs': 'projects',
  'educaton': 'education',
  'educaiton': 'education',
  'tecnical': 'technical',
  'techincal': 'technical',
  'technincal': 'technical',
  'programing': 'programming',
  'programmin': 'programming',
  'progamming': 'programming',
  'developement': 'development',
  'devlopment': 'development',
  'compnay': 'company',
  'comapny': 'company',
  'companey': 'company',
  'achivements': 'achievements',
  'achievments': 'achievements',
  'bacground': 'background',
  'backgorund': 'background',
  'interivew': 'interview',
  'interveiw': 'interview',
  'descripe': 'describe',
  'discribe': 'describe',
  'desribe': 'describe',
  'explane': 'explain',
  'explian': 'explain',
  'expain': 'explain',
  'tel': 'tell',
  'tlel': 'tell',
  'abotu': 'about',
  'abot': 'about',
  'abuot': 'about',
  'youself': 'yourself',
  'urself': 'yourself',
  'yur': 'your',
  'yor': 'your',
  'yuor': 'your',
  'thier': 'their',
  'teh': 'the',
  'hte': 'the',
  'taht': 'that',
  'wich': 'which',
  'whcih': 'which',
  'langauges': 'languages',
  'languges': 'languages',
  'framworks': 'frameworks',
  'framewroks': 'frameworks',
  'databse': 'database',
  'databses': 'databases',
  'porjects': 'projects',
  'achivment': 'achievement',
  'certifcate': 'certificate',
  'certficate': 'certificate',
  'unversity': 'university',
  'universtiy': 'university',
  'gradute': 'graduate',
  'graduete': 'graduate',
  'strenth': 'strength',
  'stregth': 'strength',
  'weekness': 'weakness',
  'weaknes': 'weakness',
  'challange': 'challenge',
  'chalenge': 'challenge',
  'responsibilty': 'responsibility',
  'responsibilites': 'responsibilities',
};

// Common phrase corrections
const PHRASE_CORRECTIONS: Record<string, string> = {
  'tell me abot': 'tell me about',
  'wat can you': 'what can you',
  'wat do you': 'what do you',
  'wat are you': 'what are you',
  'can u': 'can you',
  'cna you': 'can you',
  'wats your': "what's your",
  'whats ur': "what's your",
  'tel me': 'tell me',
  'discribe urself': 'describe yourself',
  'descibe yourself': 'describe yourself',
  'ur skills': 'your skills',
  'ur experience': 'your experience',
  'ur background': 'your background',
  'do u have': 'do you have',
  'have u': 'have you',
  'are u': 'are you',
  'were u': 'were you',
  'did u': 'did you',
  'wut is': 'what is',
  'wut are': 'what are',
  'hw many': 'how many',
  'hw much': 'how much',
};

/**
 * Fix common typos in a query
 */
export function fixTypos(query: string): string {
  let corrected = query.toLowerCase();
  
  // First, fix common phrases
  for (const [typo, correction] of Object.entries(PHRASE_CORRECTIONS)) {
    const regex = new RegExp(`\\b${typo}\\b`, 'gi');
    corrected = corrected.replace(regex, correction);
  }
  
  // Then, fix individual words
  const words = corrected.split(/\s+/);
  const fixedWords = words.map(word => {
    // Remove punctuation for matching
    const cleanWord = word.replace(/[.,!?;:]$/, '');
    const punctuation = word.slice(cleanWord.length);
    
    if (TYPO_CORRECTIONS[cleanWord]) {
      return TYPO_CORRECTIONS[cleanWord] + punctuation;
    }
    return word;
  });
  
  return fixedWords.join(' ');
}

/**
 * Calculate similarity between two strings (Levenshtein distance)
 */
function levenshteinDistance(str1: string, str2: string): number {
  const m = str1.length;
  const n = str2.length;
  const dp: number[][] = Array(m + 1).fill(null).map(() => Array(n + 1).fill(0));

  for (let i = 0; i <= m; i++) dp[i][0] = i;
  for (let j = 0; j <= n; j++) dp[0][j] = j;

  for (let i = 1; i <= m; i++) {
    for (let j = 1; j <= n; j++) {
      if (str1[i - 1] === str2[j - 1]) {
        dp[i][j] = dp[i - 1][j - 1];
      } else {
        dp[i][j] = Math.min(
          dp[i - 1][j] + 1,    // deletion
          dp[i][j - 1] + 1,    // insertion
          dp[i - 1][j - 1] + 1 // substitution
        );
      }
    }
  }

  return dp[m][n];
}

/**
 * Fuzzy match against common professional keywords
 * Returns corrected word if within similarity threshold
 */
export function fuzzyCorrectProfessionalTerms(query: string): string {
  const professionalTerms = [
    'programming', 'developer', 'software', 'engineer', 'frontend', 'backend',
    'fullstack', 'database', 'framework', 'experience', 'projects', 'skills',
    'education', 'university', 'graduate', 'achievements', 'technical',
    'javascript', 'typescript', 'python', 'react', 'nextjs', 'portfolio',
    'interview', 'company', 'salary', 'remote', 'internship', 'position',
  ];
  
  const words = query.toLowerCase().split(/\s+/);
  const correctedWords = words.map(word => {
    const cleanWord = word.replace(/[.,!?;:]$/, '');
    const punctuation = word.slice(cleanWord.length);
    
    // Skip short words
    if (cleanWord.length < 4) return word;
    
    // Find closest professional term
    let bestMatch = cleanWord;
    let minDistance = Infinity;
    
    for (const term of professionalTerms) {
      const distance = levenshteinDistance(cleanWord, term);
      const threshold = Math.max(2, Math.floor(term.length * 0.3)); // 30% difference allowed
      
      if (distance < minDistance && distance <= threshold) {
        minDistance = distance;
        bestMatch = term;
      }
    }
    
    return bestMatch + punctuation;
  });
  
  return correctedWords.join(' ');
}

/**
 * Normalize query text
 */
export function normalizeQuery(query: string): string {
  let normalized = query.trim();
  
  // Remove extra spaces
  normalized = normalized.replace(/\s+/g, ' ');
  
  // Fix common punctuation issues
  normalized = normalized.replace(/\s+([.,!?])/g, '$1'); // Remove space before punctuation
  normalized = normalized.replace(/([.,!?])([a-zA-Z])/g, '$1 $2'); // Add space after punctuation
  
  return normalized;
}

/**
 * Full preprocessing pipeline
 */
export function preprocessQuery(query: string): { original: string; corrected: string; changes: string[] } {
  const original = query;
  const changes: string[] = [];
  
  // Step 1: Normalize
  let processed = normalizeQuery(query);
  
  // Step 2: Fix known typos
  const afterTypoFix = fixTypos(processed);
  if (afterTypoFix !== processed) {
    changes.push('Fixed common typos');
    processed = afterTypoFix;
  }
  
  // Step 3: Fuzzy correct professional terms
  const afterFuzzyFix = fuzzyCorrectProfessionalTerms(processed);
  if (afterFuzzyFix !== processed) {
    changes.push('Corrected professional terminology');
    processed = afterFuzzyFix;
  }
  
  return {
    original,
    corrected: processed,
    changes,
  };
}
