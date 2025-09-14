import { http, createConfig } from 'wagmi'
import { injected, metaMask } from 'wagmi/connectors'

export const somniaMainnetChain = {
  id: 5031,
  name: 'Somnia',
  nativeCurrency: {
    decimals: 18,
    name: 'SOMI',
    symbol: 'SOMI',
  },
  rpcUrls: {
    public: { http: ['https://api.infra.mainnet.somnia.network/'] },
    default: { http: ['https://api.infra.mainnet.somnia.network/'] },
  },
  blockExplorers: {
    default: { name: 'Somnia Explorer', url: 'https://explorer.somnia.network' },
  },
} as const

export const somniaTestnetChain = {
  id: 50312,
  name: 'Somnia Testnet',
  nativeCurrency: {
    decimals: 18,
    name: 'STT',
    symbol: 'STT',
  },
  rpcUrls: {
    public: { http: ['https://dream-rpc.somnia.network/'] },
    default: { http: ['https://dream-rpc.somnia.network/'] },
  },
  blockExplorers: {
    default: { name: 'Somnia Shannon Explorer', url: 'https://shannon-explorer.somnia.network/' },
  },
} as const

export const config = createConfig({
  chains: [somniaMainnetChain, somniaTestnetChain],
  connectors: [
    injected(),
    metaMask(),
  ],
  transports: {
    [somniaMainnetChain.id]: http(),
    [somniaTestnetChain.id]: http(),
  },
})

declare module 'wagmi' {
  interface Register {
    config: typeof config
  }
}