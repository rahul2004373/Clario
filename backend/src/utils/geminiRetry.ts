/**
 * geminiRetry.ts
 * Utility wrapper to execute Gemini API queries with exponential backoff and jitter,
 * handling 429 (Rate Limit) and 503 (Service Unavailable) errors gracefully, and
 * returning user-friendly messages if they fail after maximum retries.
 */

export async function withGeminiRetry<T>(
    fn: () => Promise<T>,
    maxRetries = 6,
    initialDelayMs = 1500
): Promise<T> {
    let attempt = 0;
    while (true) {
        try {
            return await fn();
        } catch (err: any) {
            attempt++;
            
            const errorMessage = String(err.message || '').toLowerCase();
            const statusCode = Number(err.status || err.statusCode || 0);

            const isRateLimitOrHighDemand = 
                statusCode === 429 || 
                statusCode === 503 ||
                errorMessage.includes('429') ||
                errorMessage.includes('503') ||
                errorMessage.includes('too many requests') ||
                errorMessage.includes('service unavailable') ||
                errorMessage.includes('quota') ||
                errorMessage.includes('limit') ||
                errorMessage.includes('resource exhausted') ||
                errorMessage.includes('demand');

            if (!isRateLimitOrHighDemand || attempt >= maxRetries) {
                if (isRateLimitOrHighDemand) {
                    console.error(`[GeminiRetry] Maximum retries reached. Failing gracefully with user-friendly error.`);
                    throw new Error(
                        'The AI engine is currently experiencing extremely high demand. Please wait a few seconds and try again.'
                    );
                }
                throw err;
            }

            // Exponential Backoff with Jitter: initialDelayMs * 2^(attempt-1) + random_jitter
            const delay = initialDelayMs * Math.pow(2, attempt - 1) + Math.floor(Math.random() * 800);
            console.warn(
                `[GeminiRetry] Rate limit / High demand hit on attempt ${attempt}/${maxRetries}. Retrying in ${Math.round(delay)}ms... Error: ${err.message}`
            );
            await new Promise(resolve => setTimeout(resolve, delay));
        }
    }
}
