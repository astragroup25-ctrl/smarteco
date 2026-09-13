import type { NextConfig } from 'next'

const nextConfig: NextConfig = {
  // Autorise next/image à optimiser le logo distant utilisé dans la Navbar.
  // (Cette configuration existait dans le commit initial ; elle avait été
  // perdue lors de l'ajout de serverExternalPackages, ce qui faisait échouer
  // toutes les pages en 500 : « Invalid src prop ... hostname i.ibb.co is not
  // configured under images ».)
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'i.ibb.co',
      },
    ],
  },
  // firebase-admin doit rester externe au bundle serveur.
  serverExternalPackages: ['firebase-admin'],
}

export default nextConfig