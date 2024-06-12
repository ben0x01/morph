import {morphWalletClient, account} from "./help";
import {morph} from "./chain/morphChain";
import {parseEther, toHex} from "viem";


//usdt address - 0x9E12AD42c4E4d2acFBADE01a96446e48e6764B98
//uni address - 0x340Bad9627Cb72d1c4cC92c7F53c4995454130Ae
//weth address - 0x5300000000000000000000000000000000000011


async function withdrawMorph(address: string) {
    const hash = await morphWalletClient.sendTransaction({
        account,
        chain: morph,
        to: `f{address}`, //changes address for token
        value: BigInt('0'),
        data: toHex('0x095ea7b300000000000000000000000051be46170069a77050be5273d34e6155fdb7e031ffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffff'),  //change address
    });
    console.log(hash)
}
