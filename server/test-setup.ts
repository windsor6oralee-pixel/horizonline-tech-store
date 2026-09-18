// Tests read admin credentials from the environment; provide deterministic values
// so the suite passes without a local .env file.
import "dotenv/config";

process.env.ADMIN_USERNAME ||= "test-admin";
process.env.ADMIN_PASSWORD ||= "test-password";
process.env.JWT_SECRET ||= "test-jwt-secret";
