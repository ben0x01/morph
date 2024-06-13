import axios from 'axios';
import { ethers } from 'ethers';
import { parseEther, toHex } from 'viem';
import { claimEthAbi } from "./Abi/claimABI";
import { holeskyWalletClient, holeskyPublicClient, account } from "./help";

interface ProofResponse {
    index: number;
    leaf: string;
    proof: string[];
    root: string;
}

function toBytes32(input: string): string {
    if (!ethers.utils.isHexString(input)) {
        throw new Error("Invalid hex string");
    }

    // Remove 0x prefix if it exists
    input = input.replace(/^0x/, '');

    if (input.length > 64) {
        throw new Error("Input exceeds 32 bytes");
    }

    // Pad the input to 32 bytes (64 hex characters)
    return input.padStart(64, '0');
}

function convertToBytes32Array(inputArray: string[]): string[] {
    return inputArray.map(toBytes32);
}

async function fetchProof(nonce: string, amount: string): Promise<(string | bigint | `0x${string}` | string[] | any)[]> {
    const url = `https://indexer-holesky.morphl2.io/getProof?nonce=${nonce}`;

    const headers = {
        'Accept': 'application/json, text/plain, */*',
        'Accept-Encoding': 'gzip, deflate, br, zstd',
        'Accept-Language': 'en,ru;q=0.9,en-GB;q=0.8,en-US;q=0.7',
        'If-Modified-Since': 'Sun, 09 Jun 2024 12:08:08 GMT',
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

    try {
        const response = await axios.get<ProofResponse>(url, { headers });
        const data = response.data;

        // Convert proof array to bytes32[32] format
        const bytes32Proof = convertToBytes32Array(data.proof);

        // Extract and log the response data
        return [
            '0000000000000000000000005300000000000000000000000000000000000006',
            '000000000000000000000000cc3d455481967dc97346ef1771a112d7a14c8f12',
            amount,
            toHex(nonce, { size: 32 }).replace(/^0x/, ''),
            '00000000000000000000000000000000000000000000000000000000000004c0',
            bytes32Proof,
            data.root
        ];
    } catch (error) {
        console.error('Error fetching proof:', error);
        throw new Error('Failed to fetch proof data');
    }
}

async function getWithdrawals(address: string) {
    const url = `https://indexer-holesky.morphl2.io/v1/withdrawals/${address}`;
    const params = {
        limit: 10,
        offset: 0
    };

    const headers = {
        'Accept': 'application/json, text/plain, */*',
        'Accept-Encoding': 'gzip, deflate, br, zstd',
        'Accept-Language': 'en,ru;q=0.9,en-GB;q=0.8,en-US;q=0.7',
        'If-Modified-Since': 'Thu, 13 Jun 2024 06:17:40 GMT',
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

    try {
        const response = await axios.get(url, {
            params,
            headers
        });

        const data = response.data;

        if (data.items && data.items.length > 0) {
            data.items.forEach((item: any) => {
                console.log('withdrawalNonce:', item.withdrawalNonce);
                console.log('amount:', item.amount);
            });

            // Use the first item for demonstration purposes
            const firstItem = data.items[0];
            return { nonce: firstItem.withdrawalNonce.toString(), amount: ethers.utils.formatEther(firstItem.amount) };
        } else {
            console.log('No items found in the response.');
            return null;
        }
    } catch (error) {
        console.error('Error making the request:', error);
        return null;
    }
}

async function claimETH() {
    try {
        const withdrawalData = await getWithdrawals("0xD09e83f426edfCA98cf640eBa94380A57b19aD16");
        if (!withdrawalData) throw new Error('No withdrawal data found');

        const { nonce, amount } = withdrawalData;

        const { request } = await holeskyPublicClient.simulateContract({
            abi: claimEthAbi,
            address: '0xECc966AB425F3F5Bd58085ce4eBDBf81D829126F',
            functionName: 'proveAndRelayMessage',
            args: await fetchProof(nonce, amount),
            account: account,
            value: BigInt(amount),
        }).catch((error: any) => {
            console.error("Simulation error:", error);
            throw error;
        });
        const hash = await holeskyWalletClient.writeContract(request);
        console.log(hash);
    } catch (error) {
        console.error("Error in claimETH function:", error);
    }
}

claimETH();
