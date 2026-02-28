import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

/** @type {import('next').NextConfig} */
const nextConfig = {
  allowedDevOrigins: ["https://dev.cjaayy.dev", "dev.cjaayy.dev"],
  webpack(config) {
    // Resolve @db/* imports to the src/db/ folder
    config.resolve.alias["@db"] = path.resolve(__dirname, "src/db");
    return config;
  },
};

export default nextConfig;
