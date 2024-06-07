import {abiToDeposit} from "../Abi/mainAbi";
import {decodeFunctionData, parseEther, toHex,} from 'viem';
import {account, holeskyPublicClient, holeskyWalletClient, moprhPublicClient, morphWalletClient} from "../help";
import axios from "axios/index";


const url = 'https://ethereum-holesky-rpc.publicnode.com/';
const payload = {
    method: 'eth_getTransactionReceipt',
    params: ['0xf3abf4025c88092ea03f48a5d49a4ffd7d16104df59bb1934298ce4d6bd5bbc8'],
    id: 46,
    jsonrpc: '2.0'
};

const headers = {
    'Accept': '*/*',
    'Accept-Encoding': 'gzip, deflate, br, zstd',
    'Accept-Language': 'en,ru;q=0.9,en-GB;q=0.8,en-US;q=0.7',
    'Cache-Control': 'max-age=0',
    'Content-Length': '142',
    'Content-Type': 'application/json',
    'Origin': 'https://bridge-holesky.morphl2.io',
    'Priority': 'u=1, i',
    'Referer': 'https://bridge-holesky.morphl2.io/',
    'Sec-Ch-Ua': '"Microsoft Edge";v="125", "Chromium";v="125", "Not.A/Brand";v="24"',
    'Sec-Ch-Ua-Mobile': '?0',
    'Sec-Ch-Ua-Platform': '"Windows"',
    'Sec-Fetch-Dest': 'empty',
    'Sec-Fetch-Mode': 'cors',
    'Sec-Fetch-Site': 'cross-site',
    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/125.0.0.0 Safari/537.36 Edg/125.0.0.0'
};

async function getSecondLogData(): Promise<string | null> {
    try {
        const response = await axios.post(url, payload, {headers});
        const data = response.data;

        if (data.result && data.result.logs && data.result.logs.length > 1) {
            const secondLog = data.result.logs[1];
            console.log('Second Log Object:', JSON.stringify(secondLog, null, 2));
            return secondLog.data;
        } else {
            console.log('No second log found in the response.');
            return null;
        }
    } catch (error) {
        console.error('Error making the request:', error);
        return null;
    }
}

function parseHexData(hexData: string): string[] {
    let sanitizedHexData = hexData.startsWith('0x') ? hexData.slice(2) : hexData;
    let chunks = [];
    for (let i = 0; i < sanitizedHexData.length; i += 64) {
        chunks.push(sanitizedHexData.slice(i, i + 64));
    }
    let nonZeroChunks = chunks.filter(chunk => parseInt(chunk, 16) !== 0);
    let substrings: string[] = [];
    nonZeroChunks.forEach(chunk => {
        for (let i = 0; i < chunk.length; i += 16) {
            substrings.push(chunk.slice(i, i + 16));
        }
    });
    let nonZeroSubstrings = substrings.filter(substring => parseInt(substring, 16) !== 0);
    return nonZeroSubstrings;
}

async function extractAndParseData(address: string, value: number): Promise<string> {
    const hexData = await getSecondLogData();

    if (!hexData) {
        console.log('No data to parse.');
        return '';
    }

    const parsedData = parseHexData(hexData);

    const fixedPrefix = "0xce0b63ce";
    const paddedAddress = address.replace(/^0x/, '').padStart(40, '0');
    const fullAddress = `000000000000000000000000${paddedAddress}`;

    const firstSubstring = parsedData.length > 0 ? parsedData[0] : "";
    const thirdSubstring = parsedData.length > 2 ? parsedData[2] : "";

    const firstSubstringPadded = firstSubstring.padStart(64, '0');
    const thirdSubstringPadded = thirdSubstring.padStart(64, '0');

    let finalData = '';
    if (value >= 0.01 && value <= 0.1) {
        finalData = `${fixedPrefix}${fullAddress}${firstSubstringPadded}${thirdSubstringPadded}`;
    } else if (value > 0.1) {
        finalData = `${fixedPrefix}${fullAddress}${firstSubstringPadded}${thirdSubstringPadded}`;
    } else {
        console.log('Value is out of the specified range.');
        return '';
    }

    return finalData;
}

// Example usage
const myAddress = "d09e83f426edfca98cf640eba94380a57b19ad16";
const transactionValue = 0.05;

async function test() {
    try {
        const callData = await extractAndParseData(myAddress, transactionValue);
        const gas = await moprhPublicClient.estimateGas({
            data: toHex(callData),
            account,
            to: '0x9f6E8e1C33FC2AA6ff29B747922E3f8e32911B9D',
            value: parseEther('0.005')
        });
        console.log(gas);

        const {functionName, args} = decodeFunctionData({
            abi: abiToDeposit,
            data: toHex(callData),
        });
        console.log("Function Name:", functionName);
        console.log("Arguments:", args);

        const {request} = await moprhPublicClient.simulateContract({
            abi: abiToDeposit,
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

// Call the test function to execute
test();
