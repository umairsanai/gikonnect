import "dotenv/config";
import { Pool } from "pg";
import { getPositiveInteger } from "./helpers.js";

const pool = new Pool({
    user: process.env.DATABASE_USERNAME!,
    password: process.env.DATABASE_PASSWORD!,
    host: process.env.DATABASE_HOST!,
    port: getPositiveInteger(process.env.DATABASE_PORT, 5432),
    database: process.env.DATABASE_NAME!,

    // Keep the API pool below the database's connection ceiling. Supabase and
    // its own services also need connections, so this must remain configurable.
    max: getPositiveInteger(process.env.DATABASE_POOL_MAX, 10),
    connectionTimeoutMillis: getPositiveInteger(process.env.DATABASE_CONNECTION_TIMEOUT_MS, 10000),
    idleTimeoutMillis: getPositiveInteger(process.env.DATABASE_IDLE_TIMEOUT_MS, 30000),
    statement_timeout: getPositiveInteger(process.env.DATABASE_STATEMENT_TIMEOUT_MS, 15000),
    query_timeout: getPositiveInteger(process.env.DATABASE_QUERY_TIMEOUT_MS, 20000),
    keepAlive: true,
    application_name: "gikonnect-api"
});

// node-postgres emits an `error` event when an idle connection is interrupted.
// Without a listener, Node treats it as an uncaught error and can terminate the
// API process
pool.on("error", (error: Error) => {
    console.error("Unexpected error on an idle database client", {
        name: error.name,
        message: error.message
    });
});

export default pool;
