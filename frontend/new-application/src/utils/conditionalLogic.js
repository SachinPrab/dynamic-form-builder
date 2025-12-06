// utils/conditionalLogic.js

// Helper function to normalize any value to a comparable, lowercase string
const normalizeValue = (val) => {
    if (val === null || val === undefined) return "";
    // Ensure booleans and numbers are converted to string for comparison
    if (typeof val === 'boolean') return val.toString();
    return String(val).toLowerCase().trim();
};

export const OPERATORS = {
  // Normalize both sides before comparison
  equals: (a, b) => normalizeValue(a) === normalizeValue(b),
  notEquals: (a, b) => normalizeValue(a) !== normalizeValue(b),
  
  contains: (a, b) => {
    const normalizedA = normalizeValue(a);
    const normalizedB = normalizeValue(b);

    // If 'a' is an array (e.g., collaborator list), check if any element equals the target.
    if (Array.isArray(a)) {
        return a.some(item => normalizeValue(item) === normalizedB);
    }
    
    // For string inputs, check if the normalized answer contains the normalized target value.
    if (typeof a === "string" || normalizedA) {
        return normalizedA.includes(normalizedB);
    }
    
    return false;
  },
};

/**
 * Determine whether a question should be shown based on conditional rules
 * @param {ConditionalRules | null} rules
 * @param {Record<string, any>} answersSoFar
 * @returns {boolean}
 */
export function shouldShowQuestion(rules, answersSoFar) {
  if (!rules) return true; // no rules => always show

  const { logic, conditions } = rules;

  if (!conditions || conditions.length === 0) return true;

  const results = conditions.map((cond) => {
    const answer = answersSoFar[cond.questionKey];

    // If the answer is missing/null, the condition fails (returns false)
    if (answer === undefined || answer === null) return false;

    const operatorFn = OPERATORS[cond.operator];
    if (!operatorFn) return false;

    return operatorFn(answer, cond.value);
  });

  // Combine results based on logic operator
  if (logic === "AND") {
    return results.every(Boolean);
  } else if (logic === "OR") {
    return results.some(Boolean);
  }

  return true; // fallback
}