import * as fs from 'fs';
import {account, moprhPublicClient, morphWalletClient} from "../help";
import {supplyAbi} from "../Abi/supplyUsdtAbi";
import {morphaAbi} from "../Abi/seaportAbi";
import {parseEther} from "viem";

const data = fs.readFileSync('test.json', 'utf8');
const parsedData = JSON.parse(data);

const orders = parsedData.data.inputDataShopCar.orders;
const offerFulfillments = parsedData.data.inputDataShopCar.offerFulfillments;
const considerationFulfillments = parsedData.data.inputDataShopCar.considerationFulfillments;
const fulfillerConduitKey = parsedData.data.inputDataShopCar.fulfillerConduitKey;
const maximumFulfilled = parsedData.data.inputDataShopCar.maximumFulfilled;


const newConsiderationFulfillments = considerationFulfillments.map((order: {
    orderIndex: { toString: () => any; };
    itemIndex: { toString: () => any; };
}[]) => {
    return order.map((item: { orderIndex: { toString: () => any; }; itemIndex: { toString: () => any; }; }) => {
        return [item.orderIndex.toString(), item.itemIndex.toString()];
    });
});

const newOfferFulfillments = offerFulfillments.map((order: any[]) => {
    return order.map((item) => {
        return [item.orderIndex.toString(), item.itemIndex.toString()];
    });
});

function parseOrders(): any[] {
    return orders.map((order: any) => {
        const [maker, makerToken, makerAmount, taker, takerToken, takerAmount] =
            order.parameters.consideration.map((item: any) => [
                item.recipient,
                item.token,
                item.endAmount,
            ]);

        const offers = order.parameters.offer.map((item: any) => [
            item.itemType,
            item.token,
            item.identifierOrCriteria,
            item.startAmount,
            item.endAmount,
        ]);

        return [
            [
                maker,
                makerToken,
                offers,
                [
                    ...order.parameters.consideration.map((item: any) => [
                        item.itemType,
                        item.token,
                        item.identifierOrCriteria,
                        item.startAmount,
                        item.endAmount,
                        taker,
                    ]),
                ],
                order.parameters.orderType,
                order.parameters.startTime,
                order.parameters.endTime,
                order.parameters.zone,
                order.parameters.salt,
                order.parameters.offerer,
                order.parameters.totalOriginalConsiderationItems,
            ],
            order.signature,
        ];
    });
}

const price = "price" //get price from website (в abi данной информации нет)


const writeArgs = [
    parseOrders,
    newOfferFulfillments,
    newConsiderationFulfillments,
    fulfillerConduitKey,
    maximumFulfilled,
]


async function supplyUsdt() {
    try {
        const {request} = await moprhPublicClient.simulateContract({
            abi: morphaAbi,
            address: '0x9ac4D9EE5c30339A24e1b784842E58f363F58458',
            functionName: 'fulfillAvailableOrders',
            args: writeArgs,
            account: account,
            value: parseEther(price),
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
