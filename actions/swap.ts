import axios from "axios";
import * as readline from 'readline';
import {decodeFunctionData, parseEther} from 'viem';
import {abi} from "../Abi/test_abi";
import {account, moprhPublicClient, morphWalletClient} from '../help';


const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout
});

const headers = {
    "Accept": "application/json, text/plain, */*",
    "Accept-Encoding": "gzip, deflate, br, zstd",
    "Accept-Language": "en,ru;q=0.9,en-GB;q=0.8,en-US;q=0.7",
    "Apikey": "JWL73SF2K899AMPFRHZV",
    "Origin": "http://testnet.bulbaswap.io",
    "Priority": "u=1, i",
    "Referer": "http://testnet.bulbaswap.io/",
    "Sec-Ch-Ua": '"Microsoft Edge";v="125", "Chromium";v="125", "Not.A/Brand";v="24"',
    "Sec-Ch-Ua-Mobile": "?0",
    "Sec-Ch-Ua-Platform": '"Windows"',
    "Sec-Fetch-Dest": "empty",
    "Sec-Fetch-Mode": "cors",
    "Sec-Fetch-Site": "cross-site",
    "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/125.0.0.0 Safari/537.36 Edg/125.0.0.0",
};

export const getCallData = async (address: string, amount: string, fromToken: string, toToken: string) => {
    try {
        const url = `https://newapi.native.org/v1/firm-quote?src_chain=morph_holesky_testnet&dst_chain=morph_holesky_testnet&token_in=${fromToken}&token_out=${toToken}&amount=${amount}6&address=${address}&slippage=0.5`;
        const response = await axios.get(url, {headers});
        console.log("API URL:", url);
        return response.data["txRequest"]["calldata"];
    } catch (error) {
        console.error("Error fetching call data:", error);
        throw error;
    }
};

async function test() {
    try {
        const callData = await getCallData("0xD09e83f426edfCA98cf640eBa94380A57b19aD16", "0.005", "0x340Bad9627Cb72d1c4cC92c7F53c4995454130Ae", "0x5300000000000000000000000000000000000011");
        console.log("Call Data - ", callData)
        const gas = await moprhPublicClient.estimateGas({
            data: callData,
            account,
            to: '0x9f6E8e1C33FC2AA6ff29B747922E3f8e32911B9D',
            value: parseEther('0.005')
        })
        console.log(gas)
        const {functionName, args} = decodeFunctionData({
            abi: abi,
            data: callData
        });
        console.log("Function Name:", functionName);
        console.log("Arguments:", args);


        const {request} = await moprhPublicClient.simulateContract({
            abi: abi,
            address: '0x9f6E8e1C33FC2AA6ff29B747922E3f8e32911B9D',
            functionName: functionName,
            args: args,
            gas: gas,
            account: account,
            value: parseEther('0.005')
        }).catch((error) => {
            console.error("Simulation error:", error);
            throw error;
        });

        const hash = await morphWalletClient.writeContract(request).catch((error) => {
            console.error("Transaction error:", error);
            throw error;
        });

        console.log("Transaction hash:", hash);
    } catch (error) {
        console.error("Error in test function:", error);
    }
}
