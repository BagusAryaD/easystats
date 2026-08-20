/** @type {import('next').NextConfig} */
const useProxy = process.env.LOCAL_PROXY === "1";

const nextConfig = {
  async rewrites() {
    if (!useProxy) return [];
    // Hanya untuk dev lokal: proxy /api/* ke server Python (uvicorn).
    // Di Vercel, fungsi Python otomatis tersedia di /api/*.
    return [{ source: "/api/:path*", destination: "http://127.0.0.1:8000/api/:path*" }];
  },
};

export default nextConfig;
