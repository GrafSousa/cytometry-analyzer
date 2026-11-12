import type { NextConfig } from 'next';

// Site 100% estático: `npm run build` gera a pasta out/, que pode ser publicada em qualquer
// hospedagem de arquivos (GitHub Pages, Cloudflare, Netlify, Vercel). Não há servidor.
const nextConfig: NextConfig = {
  output: 'export',
  // Para GitHub Pages em https://<usuario>.github.io/<repo>/, descomente e ajuste:
  // basePath: '/planilhas-anna',
};

export default nextConfig;
