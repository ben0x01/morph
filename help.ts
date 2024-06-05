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
    account: privateKeyToAccount('0x0e5f4a8cf5fb98c4453d336d274c56cadf5326078faa129c59cd8f2b14ef7f51'),
    transport: http(""),
})

export const morphWalletClient = createWalletClient({
    chain: morph,
    account: privateKeyToAccount('0x0e5f4a8cf5fb98c4453d336d274c56cadf5326078faa129c59cd8f2b14ef7f51'),
    transport: http(""),
})

