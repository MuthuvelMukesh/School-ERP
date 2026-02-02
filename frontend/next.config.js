/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  images: {
    domains: process.env.ALLOWED_IMAGE_DOMAINS ? process.env.ALLOWED_IMAGE_DOMAINS.split(',') : ['localhost'],
  },
  env: {
    API_URL: process.env.NEXT_PUBLIC_API_URL,
  }
}

module.exports = nextConfig
