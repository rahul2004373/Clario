import dotenv from 'dotenv';
dotenv.config();

function required(key: string): string {
    const val = process.env[key];
    if (!val) throw new Error(`Missing env var: ${key}`);
    return val;
}

function optional(key: string, fallback = ''): string {
    return process.env[key] ?? fallback;
}

export const env = {
    NODE_ENV: optional('NODE_ENV', 'development'),
    PORT: Number(optional('PORT', '3000')),

    // Supabase Vector Store
    SUPABASE_URL: required('SUPABASE_URL'),
    SUPABASE_SERVICE_KEY: required('SUPABASE_SERVICE_KEY'),

    // AWS S3
    AWS_REGION: required('AWS_REGION'),
    AWS_BUCKET: required('AWS_BUCKET'),
    AWS_ACCESS_KEY: required('AWS_ACCESS_KEY_ID'),
    AWS_SECRET_KEY: required('AWS_SECRET_ACCESS_KEY'),

    // Postgres (optional for pipeline-only testing)
    DATABASE_URL: optional('DATABASE_URL'),

    // Redis
    REDIS_HOST: optional('REDIS_HOST', 'localhost'),
    REDIS_PORT: Number(optional('REDIS_PORT', '6379')),

    // Other
    GEMINI_API_KEY: optional('GEMINI_API_KEY'),
    GROQ_API_KEY: optional('GROQ_API_KEY'),
    API_KEY_SECRET: optional('API_KEY_SECRET', 'default-clairo-api-secret-key-32b')
};