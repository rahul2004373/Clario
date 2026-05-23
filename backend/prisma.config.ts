import { defineConfig } from 'prisma/config';
import pg from 'pg';

const pool = new pg.Pool({
  connectionString: process.env.DATABASE_URL,
});

export default defineConfig({
  earlyAccess: true,
  schema: 'src/db/schema.prisma',
});
