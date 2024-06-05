import {supplyAbi} from "../Abi/supplyUsdtAbi";
import {parseEther,} from 'viem';
import {account, moprhPublicClient, morphWalletClient} from "../help";

const writeArgs = [
    parseEther('0.01'),
]

async function supplyUsdt() {
    try {
        const {request} = await moprhPublicClient.simulateContract({
            abi: supplyAbi,
            address: '0x37088Ecc92Aa376F1535BD42186Efc3a92b39e65',
            functionName: 'mint',
            args: writeArgs,
            account: account,
            value: BigInt('0'),
        }).catch((error) => {
            console.error("Simulation error:", error);
            throw error;
        });
        const hash = await morphWalletClient.writeContract(request);
        console.log(hash)
    } catch (error) {
        console.error("Error in test function:", error);
    }
}

supplyUsdt()