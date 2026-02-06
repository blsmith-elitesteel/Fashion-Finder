/**
 * Price Utilities
 * 
 * Handles parsing, normalizing, and comparing prices from various formats.
 * Prices from scrapers may be strings like "$29.99", "29.99", "$29 - $49", etc.
 * 
 * DESIGN DECISIONS:
 * - Unparseable prices return null, not 0 (to distinguish "free" from "unknown")
 * - Products with null prices are INCLUDED in filtered results (fail-open)
 * - Products with null prices sort to END when sorting by price
 * - Price ranges use the FIRST (typically lowest) price
 */

/**
 * Parse a price string and extract the numeric value.
 * Returns null if price cannot be parsed.
 * 
 * Examples:
 *   "$29.99" -> 29.99
 *   "29.99" -> 29.99
 *   "$29 - $49" -> 29 (takes first price)
 *   "From $25" -> 25
 *   "See price" -> null
 *   "" -> null
 *   "$0" -> 0 (valid - could be free item)
 *   "$0.00" -> 0
 */
export function parsePrice(priceStr: string | null | undefined): number | null {
  // Guard: reject null, undefined, non-strings
  if (priceStr === null || priceStr === undefined) {
    return null;
  }
  if (typeof priceStr !== 'string') {
    return null;
  }

  // Clean up the string
  let cleaned = priceStr.trim().toLowerCase();
  
  // Empty string is unparseable
  if (cleaned.length === 0) {
    return null;
  }

  // Handle common "no price" indicators
  // These are explicit signals that no price is available
  const noPricePatterns = ['see price', 'price varies', 'unavailable', 'sold out', 'coming soon'];
  if (noPricePatterns.some(pattern => cleaned.includes(pattern))) {
    return null;
  }

  // Handle price ranges - take the first (lowest) price
  // e.g., "$29 - $49" or "$29-$49" -> use $29
  // This is a tradeoff: we could average, but lowest is more useful for filtering
  if (cleaned.includes('-') && !cleaned.startsWith('-')) {
    cleaned = cleaned.split('-')[0].trim();
  }

  // Handle "from $X" patterns
  cleaned = cleaned.replace(/from\s*/gi, '');

  // Extract numeric value with optional decimal
  // Handles: $29.99, £29.99, €29.99, 29.99, $1,299.99
  const match = cleaned.match(/[\d,]+\.?\d*/);
  
  if (match && match[0].length > 0) {
    // Remove commas and parse
    const numStr = match[0].replace(/,/g, '');
    const num = parseFloat(numStr);
    
    // Sanity check - prices should be non-negative and reasonable
    // Allow 0 (could be free/clearance item)
    // Cap at 100k to reject obviously bad data
    if (!isNaN(num) && num >= 0 && num < 100000) {
      return num;
    }
  }

  return null;
}

/**
 * Compare two products by price for sorting.
 * 
 * BEHAVIOR:
 * - Products with valid prices sort normally
 * - Products with unparseable prices (null) sort to the END
 * - This keeps "See price" items visible but out of the way
 */
export function comparePrices(
  priceA: string | null | undefined,
  priceB: string | null | undefined,
  ascending: boolean = true
): number {
  const numA = parsePrice(priceA);
  const numB = parsePrice(priceB);

  // Both unparseable - they're equivalent for sorting
  if (numA === null && numB === null) return 0;
  
  // One unparseable - push it to end regardless of sort direction
  // This keeps "See price" items at the bottom of both asc and desc sorts
  if (numA === null) return 1;  // A goes after B
  if (numB === null) return -1; // B goes after A

  // Normal numeric comparison
  const diff = numA - numB;
  return ascending ? diff : -diff;
}

/**
 * Check if a price is within a given range.
 * 
 * BEHAVIOR:
 * - Empty/null min means no lower bound
 * - Empty/null max means no upper bound
 * - If BOTH are null, all products pass (no filter active)
 * - Products with unparseable prices PASS the filter (fail-open)
 *   Rationale: Don't hide products due to scraper data quality issues.
 *   Users can still see them and check the actual store price.
 * 
 * @param priceStr - The price string from the product
 * @param minPrice - Minimum price (inclusive), or null for no minimum
 * @param maxPrice - Maximum price (inclusive), or null for no maximum
 */
export function isPriceInRange(
  priceStr: string | null | undefined,
  minPrice: number | null,
  maxPrice: number | null
): boolean {
  // No filter active - everything passes
  if (minPrice === null && maxPrice === null) {
    return true;
  }

  const price = parsePrice(priceStr);

  // DESIGN DECISION: Fail-open for unparseable prices
  // If we can't determine the price, include the product rather than hide it.
  // This prevents data quality issues from making products disappear.
  if (price === null) {
    return true;
  }

  // Check lower bound (inclusive)
  if (minPrice !== null && price < minPrice) {
    return false;
  }
  
  // Check upper bound (inclusive)
  if (maxPrice !== null && price > maxPrice) {
    return false;
  }

  return true;
}

/**
 * Format a number as a price string (USD)
 */
export function formatPrice(value: number): string {
  return `$${value.toFixed(2)}`;
}

/**
 * Detect if a price string indicates a sale/discount.
 * 
 * Common patterns:
 * - "$29.99 $49.99" (sale price followed by original)
 * - "$29.99 Was $49.99"
 * - "Sale $29.99"
 * - Price string contains crossed-out or "was" indicator
 * 
 * Returns: { isSale: boolean, salePrice?: number, originalPrice?: number, discount?: number }
 */
export function detectSalePrice(priceStr: string | null | undefined): {
  isSale: boolean;
  salePrice: number | null;
  originalPrice: number | null;
  discountPercent: number | null;
} {
  const result = {
    isSale: false,
    salePrice: null as number | null,
    originalPrice: null as number | null,
    discountPercent: null as number | null
  };
  
  if (!priceStr || typeof priceStr !== 'string') {
    return result;
  }
  
  const cleaned = priceStr.toLowerCase();
  
  // Check for sale indicators
  // Note: 'from' is excluded — "From $25" is a price range indicator, not a sale
  const saleIndicators = ['was', 'sale', 'now', 'reg', 'original', 'clearance', 'reduced'];
  const hasSaleIndicator = saleIndicators.some(ind => cleaned.includes(ind));
  
  // Find all price values in the string
  const priceMatches = priceStr.match(/\$?\d+\.?\d*/g) || [];
  const prices = priceMatches
    .map(p => parseFloat(p.replace('$', '')))
    .filter(p => !isNaN(p) && p > 0);
  
  if (prices.length >= 2) {
    // Multiple prices found - likely a sale
    // Sort to find lowest (sale) and highest (original)
    const sortedPrices = [...prices].sort((a, b) => a - b);
    const lowestPrice = sortedPrices[0];
    const highestPrice = sortedPrices[sortedPrices.length - 1];
    
    // Only consider it a sale if there's a meaningful difference
    if (highestPrice > lowestPrice * 1.1) { // At least 10% difference
      result.isSale = true;
      result.salePrice = lowestPrice;
      result.originalPrice = highestPrice;
      result.discountPercent = Math.round((1 - lowestPrice / highestPrice) * 100);
    }
  }
  // Single price with sale indicator — only mark as sale if we have enough
  // context to render it properly (i.e., don't set isSale without originalPrice
  // since the UI would render "$null" for the original price)
  // We just skip this case — a single price with "sale" text isn't enough info
  
  return result;
}

/**
 * Validate and parse a price filter input string.
 * Returns null if the input is empty or invalid.
 * This is used for user-entered min/max values.
 */
export function parseFilterInput(input: string): number | null {
  if (!input || typeof input !== 'string') {
    return null;
  }
  
  const trimmed = input.trim();
  if (trimmed === '') {
    return null;
  }
  
  // Remove $ if user typed it
  const cleaned = trimmed.replace(/^\$/, '');
  const num = parseFloat(cleaned);
  
  // Must be a valid non-negative number
  if (isNaN(num) || num < 0) {
    return null;
  }
  
  return num;
}
