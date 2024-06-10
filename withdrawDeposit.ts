import * as fs from 'fs';
import {morph} from "../chain/morphChain"
import {account, moprhPublicClient, morphWalletClient} from "../help";
import {supplyAbi} from "../Abi/supplyUsdtAbi";
import {morphaAbi} from "../Abi/seaportAbi";
import {parseEther, toHex} from "viem";
import axios from 'axios';

interface Token {
    address: string;
    name: string;
    symbol: string;
    decimals: number;
}

interface Item {
    guid: string;
    from: string;
    to: string;
    l1Token: string;
    l2Token: Token;
    amount: string;
    data: string;
    logIndex: number;
    blockNumber: number;
    blockTimestamp: number;
    transactionHash: string;
    withdrawalNonce: number;
    readyForStateRoot: boolean;
    readyForProveAndClaim: boolean;
    timeLeft: any;
    withdrawalRoot: string;
    bedrockWithdrawalHash: string;
    bedrockFinalizedTxHash: any;
    bedrockFinalizedLogIndex: any;
    bedrockFinalizedSuccess: any;
}

interface Data {
    pagination: {
        limit: number;
        offset: number;
        total: number;
    };
    items: Item[];
}

interface Log {
    address: string;
    topics: string[];
    data: string;
    blockNumber: string;
    transactionHash: string;
    transactionIndex: string;
    blockHash: string;
    logIndex: string;
    removed: boolean;
}

interface TransactionReceipt {
    blockHash: string;
    blockNumber: string;
    contractAddress: string | null;
    cumulativeGasUsed: string;
    effectiveGasPrice: string;
    from: string;
    gasUsed: string;
    l1Fee: string;
    logs: Log[];
    logsBloom: string;
    status: string;
    to: string;
    transactionHash: string;
    transactionIndex: string;
    type: string;
}

function getFirstTransactionHash(data: Data): string | null {
    if (data.items.length > 0) {
        return data.items[0].transactionHash;
    }
    return null;
}

// Function to fetch data from the API and return the data field of the second log entry
async function fetchAndPostData(): Promise<string[] | null> {
    const getApiUrl = 'https://indexer-holesky.morphl2.io/v1/withdrawals/0xD09e83f426edfCA98cf640eBa94380A57b19aD16?limit=10&offset=0';
    const postApiUrl = 'https://rpc-holesky.morphl2.io/';

    try {
        const response = await axios.get<Data>(getApiUrl);
        const data = response.data;

        const firstTransactionHash = getFirstTransactionHash(data);
        console.log('First transaction hash:', firstTransactionHash);

        if (firstTransactionHash) {
            const postPayload = {
                method: "eth_getTransactionReceipt",
                params: [firstTransactionHash],
                id: 46,
                jsonrpc: "2.0"
            };

            const headers = {
                'Accept': '*/*',
                'Accept-Encoding': 'gzip, deflate, br, zstd',
                'Accept-Language': 'en,ru;q=0.9,en-GB;q=0.8,en-US;q=0.7',
                'Cache-Control': 'max-age=0',
                'Content-Type': 'application/json',
                'Origin': 'https://bridge-holesky.morphl2.io',
                'Priority': 'u=1, i',
                'Referer': 'https://bridge-holesky.morphl2.io/',
                'Sec-Ch-Ua': '"Microsoft Edge";v="125", "Chromium";v="125", "Not.A/Brand";v="24"',
                'Sec-Ch-Ua-Mobile': '?0',
                'Sec-Ch-Ua-Platform': '"Windows"',
                'Sec-Fetch-Dest': 'empty',
                'Sec-Fetch-Mode': 'cors',
                'Sec-Fetch-Site': 'same-site',
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/125.0.0.0 Safari/537.36 Edg/125.0.0.0'
            };

            const postResponse = await axios.post(postApiUrl, postPayload, { headers });
            const receipt: TransactionReceipt = postResponse.data.result;

            if (receipt.logs.length > 1) {
                const secondLogData = receipt.logs[1].data;
                console.log('Second log entry data:', secondLogData);
                return parseHexData(secondLogData);
            } else {
                console.log('Second log entry does not exist');
                return null;
            }
        } else {
            return null;
        }
    } catch (error) {
        console.error('Error:', error);
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
    const parsedData = await fetchAndPostData();

    if (!parsedData) {
        console.log('No data to parse.');
        return '';
    }

    const fixedPrefix = "0x2fcc29fa";
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


async function withdrawMorph() {
    const gas = await moprhPublicClient.estimateGas({
        data: toHex(await extractAndParseData('d09e83f426edfca98cf640eba94380a57b19ad16', 0.05)),
        account,
        to: '0x5300000000000000000000000000000000000002',
        value: parseEther('0.01')
    });
    const hash = await morphWalletClient.sendTransaction({
        account,
        chain: morph,
        to: "0x5300000000000000000000000000000000000002",
        value: parseEther("0.01"),
        data: toHex(await extractAndParseData('d09e83f426edfca98cf640eba94380a57b19ad16', 0.05)),
        gas: gas
    });
    console.log(hash)
}
