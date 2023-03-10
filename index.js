/** A simple script to find the total number of tokens which is mistakenly directly transferred to the stash ids of nomination pools */

import { bnToU8a, stringToU8a, u8aConcat } from '@polkadot/util';
import { ApiPromise, WsProvider } from '@polkadot/api';
import { BN_ZERO } from '@polkadot/util';

const EMPTY_H256 = new Uint8Array(32);
const MOD_PREFIX = stringToU8a('modl');

async function getStuckBalance(api, endpoint) {
    const lastPoolId = await api.query.nominationPools.lastPoolId()
    console.log('#Total pool numbers:', lastPoolId.toNumber());
    let total = BN_ZERO;

    for (let poolId = 1; poolId <= lastPoolId; poolId++) {
        const stashId = createPoolStashId(api, poolId);
        const bal = await api.derive.balances?.all(stashId);
        total = total.add(bal.availableBalance);
        !bal.availableBalance.isZero()&& console.log(`pool id: ${poolId} stuck balance: ${api.createType('Balance', bal.availableBalance).toHuman()}`);
    }
    return total;
}

export function createPoolStashId(api, poolId) {
    return api.registry.createType(
        'AccountId32',
        u8aConcat(
            MOD_PREFIX,
            api.consts.nominationPools.palletId.toU8a(),
            new Uint8Array([0]),
            bnToU8a(poolId, { bitLength: 32 }),
            EMPTY_H256
        )
    ).toString();
}

async function main() {
    console.log('------------------Polkadot Pools----------------------');
    const polkadotEndpoint = 'wss://polkadot-rpc.dwellir.com';
    const wsProviderForPolkadot = new WsProvider(polkadotEndpoint);
    const apiToPolkadot = await ApiPromise.create({ provider: wsProviderForPolkadot });

    const totalDOTstuck = await getStuckBalance(apiToPolkadot, polkadotEndpoint);

    console.log('------------------Kusama Pools------------------------');
    const kusamaEndpoint = 'wss://kusama-rpc.dwellir.com';
    const wsProviderForKusama = new WsProvider(kusamaEndpoint);
    const apiToKusama = await ApiPromise.create({ provider: wsProviderForKusama });

    const totalKSMstuck = await getStuckBalance(apiToKusama, kusamaEndpoint);

    console.log('==================Final Results=======================');
    console.log(`Total DOT stuck is ${apiToPolkadot.createType('Balance', totalDOTstuck).toHuman()}`);
    console.log(`Total KSM stuck is ${apiToKusama.createType('Balance', totalKSMstuck).toHuman()}`);

}
main();