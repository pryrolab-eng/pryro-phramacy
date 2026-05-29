/** @type {import('next').NextConfig} */

const isDev = process.env.NODE_ENV === 'development';

const supabaseHost = (() => {
    try {
        return process.env.NEXT_PUBLIC_SUPABASE_URL
            ? new URL(process.env.NEXT_PUBLIC_SUPABASE_URL).hostname
            : null;
    } catch {
        return null;
    }
})();

const nextConfig = {
    reactStrictMode: false,
    images: {
        unoptimized: isDev,
        remotePatterns: [
            {
                protocol: 'https',
                hostname: 'images.unsplash.com',
            },
            {
                protocol: 'https',
                hostname: 'ik.imagekit.io',
            },
            {
                protocol: 'https',
                hostname: 'html.tailus.io',
            },
            ...(supabaseHost
                ? [{ protocol: 'https', hostname: supabaseHost }]
                : []),
        ],
    }
};

module.exports = nextConfig;