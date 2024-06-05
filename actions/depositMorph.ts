import {abiToDeposit} from "../Abi/mainAbi";
import {parseEther,} from 'viem';
import {account, holeskyPublicClient, holeskyWalletClient} from "../help";
import {Web3} from "web3";


const web3 = new Web3('https://1rpc.io/holesky');
const l2Fee = '330000';
const amountToDeposit = web3.utils.toWei('0.01', 'ether');
const value = (BigInt(amountToDeposit) + BigInt(web3.utils.toWei(l2Fee, 'gwei')));


const writeArgs = [
    '0xbb4877bc243cE5A399e8Ad372FFDDfA4aDA37F9E',
    parseEther('0.01'),
    330000
]

async function deposit() {
    try {
        const {request} = await holeskyPublicClient.simulateContract({
            abi: abiToDeposit,
            address: '0xEA593b730d745FB5fE01B6d20e6603915252c6BF',
            functionName: 'depositETH',
            args: writeArgs,
            account: account,
            value: value
        }).catch((error) => {
            console.error("Simulation error:", error);
            throw error;
        });

        const hash = await holeskyWalletClient.writeContract(request).catch((error) => {
            console.error("Transaction error:", error);
            throw error;
        });
        console.log("Transaction hash:", hash);
    } catch (error) {
        console.error("Error in test function:", error);
    }
}




