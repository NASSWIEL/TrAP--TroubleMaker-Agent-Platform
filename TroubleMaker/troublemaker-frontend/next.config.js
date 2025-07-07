/** @type {import('next').NextConfig} */
// const API_BASE_URL = "https://8000-cs-338772889965-default.cs-europe-west1-onse.cloudshell.dev";
const API_BASE_URL = "http://localhost:8000";


const nextConfig = {
  async rewrites() {
    return [
      {
        source: "/api/:path*",
        destination: `${API_BASE_URL}/api/:path*`,
      },
    ];
  },
  /* other config options can go here */
};

module.exports = nextConfig;
