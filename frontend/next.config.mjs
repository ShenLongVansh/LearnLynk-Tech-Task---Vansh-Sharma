// /** @type {import('next').NextConfig} */
// const nextConfig = {
//   reactStrictMode: true
// };

// export default nextConfig;

/** @type {import('next').NextConfig} */
const nextConfig = {
  async redirects() {
    return [
      {
        source: "/",
        destination: "/dashboard/today",
        permanent: false,
      },
    ];
  },
};

export default nextConfig;