/** @type {import('next').NextConfig} */

const pharmacyRedirects = require('./src/lib/routes/pharmacy-paths.redirects.cjs');

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
    async redirects() {
        return [
            {
                source: '/dashboard/reset-password',
                destination: '/reset-password',
                permanent: true,
            },
            {
                source: '/dashboard',
                destination: '/app',
                permanent: true,
            },
            {
                source: '/payment-success',
                destination: '/payment/success',
                permanent: true,
            },
            ...pharmacyRedirects,
        ];
    },
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