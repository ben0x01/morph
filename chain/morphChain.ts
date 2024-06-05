import { defineChain } from 'viem'

export const morph = defineChain({
    id: 2810,
    name: 'Morph',
    nativeCurrency: { name: 'Morph Ether', symbol: 'ETH', decimals: 18 },
    rpcUrls: {
        default: {
            http: ['https://rpc-holesky.morphl2.io'],
        },
    },
    blockExplorers: {
        default: {
            name: 'Explorer',
            url: 'https://explorer-holesky.morphl2.io/',
        },
    },
    testnet: true,
})
