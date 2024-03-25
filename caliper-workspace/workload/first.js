'use strict';

const { WorkloadModuleBase } = require('@hyperledger/caliper-core');

class MyWorkload extends WorkloadModuleBase {
    constructor() {
        super();
        this.txIndex = 0;
    }

    async initializeWorkloadModule(workerIndex, totalWorkers, roundIndex, roundArguments, sutAdapter, sutContext) {
        await super.initializeWorkloadModule(workerIndex, totalWorkers, roundIndex, roundArguments, sutAdapter, sutContext);

        
    }

    /**
     * Assemble TXs for the round.
     * @return {Promise<TxStatus[]>}
     */
    async submitTransaction() {
        this.txIndex++;

        let args = {
            contractId: 'erc1155',
            contractVersion: '1',
            contractFunction: 'Mint',
            contractArguments: ['admin@admin.com', this.txIndex.toString(), 1, `{"status":"Ativo"}`],
            timeout: 300
        };

        await this.sutAdapter.sendRequests(args);
    }

}

function createWorkloadModule() {
    return new MyWorkload();
}

module.exports.createWorkloadModule = createWorkloadModule;