import {createPublicClient, createWalletClient, http} from 'viem';
import {holesky} from 'viem/chains';
import {morph} from "./chain/morphChain";
import {privateKeyToAccount} from "viem/accounts";


export const account = privateKeyToAccount('0xprivate');

export const holeskyPublicClient = createPublicClient({
    chain: holesky,
    transport: http(),
});

export const moprhPublicClient = createPublicClient({
    chain: morph,
    transport: http(),
});

export const holeskyWalletClient = createWalletClient({
    chain: holesky,
    account: privateKeyToAccount('0xprivate'),
    transport: http(""),
})

export const morphWalletClient = createWalletClient({
    chain: morph,
    account: privateKeyToAccount('0xprivate'),
    transport: http(""),
})

