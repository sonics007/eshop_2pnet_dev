const nextConfig = {
  // Turbopack konfigurácia pre Next.js 16+
  turbopack: {
    // Polling pre vzdialený vývoj (macOS -> Linux)
    watch: {
      poll: 1000,
      aggregateTimeout: 300,
    },
  },

  experimental: {
    webpackBuildWorker: false,
  },

  webpack: (config, { dev, isServer }) => {
    // Polling pre webpack (vzdialený vývoj)
    if (dev) {
      config.watchOptions = {
        poll: 1000,
        aggregateTimeout: 300,
        ignored: /node_modules/,
      };
    }

    config.cache = dev ? false : {
      type: 'filesystem',
      maxMemoryGenerations: 1,
      compression: false,
    };

    if (dev) {
      config.optimization = {
        ...config.optimization,
        moduleIds: 'named',
        chunkIds: 'named',
        minimize: false,
      };
    }

    return config;
  },
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'images.unsplash.com',
      },
      {
        protocol: 'https',
        hostname: 'plus.unsplash.com',
      },
      {
        protocol: 'https',
        hostname: 'api.qrserver.com',
      }
    ]
  },
  async rewrites() {
    return [
      // Hlavná stránka
      {
        source: '/index.html',
        destination: '/',
      },
      // Admin sekcia
      {
        source: '/admin.html',
        destination: '/admin',
      },
      {
        source: '/admin/orders.html',
        destination: '/admin/orders',
      },
      {
        source: '/admin/products.html',
        destination: '/admin/products',
      },
      {
        source: '/admin/invoices.html',
        destination: '/admin/invoices',
      },
      {
        source: '/admin/invoices/template.html',
        destination: '/admin/invoices/template',
      },
      {
        source: '/admin/settings/flexibee.html',
        destination: '/admin/settings/flexibee',
      },
      // Verejné stránky
      {
        source: '/produkty.html',
        destination: '/produkty',
      },
      {
        source: '/kontakt.html',
        destination: '/kontakt',
      },
      {
        source: '/cart.html',
        destination: '/cart',
      },
      {
        source: '/checkout.html',
        destination: '/checkout',
      },
      {
        source: '/account.html',
        destination: '/account',
      },
      // Dynamické stránky - produkty
      {
        source: '/produkty/:slug.html',
        destination: '/produkty/:slug',
      },
      {
        source: '/products/:slug.html',
        destination: '/products/:slug',
      },
    ];
  },
};

export default nextConfig;
