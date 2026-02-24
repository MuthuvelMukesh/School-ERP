/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  output: 'standalone', // <--- ADD THIS LINE
  images: {
    domains: process.env.ALLOWED_IMAGE_DOMAINS ? process.env.ALLOWED_IMAGE_DOMAINS.split(',') : ['localhost'],
  }
}

module.exports = nextConfig