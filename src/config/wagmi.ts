import { http, createConfig } from 'wagmi'
import { injected, metaMask } from 'wagmi/connectors'

export const somniaChain = {
  id: 50311,
  name: 'Somnia',
  nativeCurrency: {
    decimals: 18,
    name: 'STT',
    symbol: 'STT',
  },
  rpcUrls: {
    public: { http: ['https://dream.somnia.network'] },
    default: { http: ['https://dream.somnia.network'] },
  },
  blockExplorers: {
    default: { name: 'Somnia Explorer', url: 'https://explorer.somnia.network' },
  },
} as const

export const somniaTestnetChain = {
  id: 50311,
  name: 'Somnia Devnet',
  nativeCurrency: {
    decimals: 18,
    name: 'STT',
    symbol: 'STT',
  },
  rpcUrls: {
    public: { http: ['https://dream.somnia.network'] },
    default: { http: ['https://dream.somnia.network'] },
  },
  blockExplorers: {
    default: { name: 'Somnia Devnet Explorer', url: 'https://explorer.somnia.network' },
  },
} as const

export const config = createConfig({
  chains: [somniaChain, somniaTestnetChain],
  connectors: [
    injected(),
    metaMask(),
  ],
  transports: {
    [somniaChain.id]: http(),
    [somniaTestnetChain.id]: http(),
  },
})

declare module 'wagmi' {
  interface Register {
    config: typeof config
  }
}