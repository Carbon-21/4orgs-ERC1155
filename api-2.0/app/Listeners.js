const logger = require("../util/logger");

function showTransactionData(transactionData) {
  logger.trace(JSON.stringify(transactionData));
  const creator = transactionData.actions[0].header.creator;
  logger.trace(`    - submitted by: ${creator.mspid}-${creator.id_bytes.toString("hex")}`);
  for (const endorsement of transactionData.actions[0].payload.action.endorsements) {
    logger.trace(
      `    - endorsed by: ${endorsement.endorser.mspid}-${endorsement.endorser.id_bytes.toString(
        "hex"
      )}`
    );
  }
  const chaincode =
    transactionData.actions[0].payload.chaincode_proposal_payload.input.chaincode_spec;
  logger.trace(`    - chaincode:${chaincode.chaincode_id.name}`);
  logger.trace(`    - function:${chaincode.input.args[0].toString()}`);
  for (let x = 1; x < chaincode.input.args.length; x++) {
    logger.trace(`    - arg:${chaincode.input.args[x].toString()}`);
  }
}

contractListener = async (event) => {
  logger.trace("==========================================");
  logger.trace(event);
  // The payload of the chaincode event is the value place there by the
  // chaincode. Notice it is a byte data and the application will have
  // to know how to deserialize.
  // In this case we know that the chaincode will always place the asset
  // being worked with as the payload for all events produced.
  const asset = JSON.parse(event.payload.toString());
  logger.trace(`<-- Contract Event Received: ${event.eventName} - ${JSON.stringify(asset)}`);
  // show the information available with the event
  logger.trace(`*** Event: ${event.eventName}:${asset.ID}`);
  // notice how we have access to the transaction information that produced this chaincode event
  const eventTransaction = event.getTransactionEvent();
  logger.trace(
    `*** transaction: ${eventTransaction.transactionId} status:${eventTransaction.status}`
  );
  showTransactionData(eventTransaction.transactionData);
  // notice how we have access to the full block that contains this transaction
  const eventBlock = eventTransaction.getBlockEvent();
  logger.trace(`*** block: ${eventBlock.blockNumber.toString()}`);
};

blockListener = async (event) => {
  logger.trace("--------------------------------------------------------------");
  logger.trace(`<-- Block Event Received - block number: ${event.blockNumber.toString()}`);

  const transEvents = event.getTransactionEvents();
  for (const transEvent of transEvents) {
    logger.trace(`*** transaction event: ${transEvent.transactionId}`);
    // if (transEvent.privateData) {
    //     for (const namespace of transEvent.privateData.ns_pvt_rwset) {
    //         logger.trace(`    - private data: ${namespace.namespace}`);
    //         for (const collection of namespace.collection_pvt_rwset) {
    //             logger.trace(`     - collection: ${collection.collection_name}`);
    //             if (collection.rwset.reads) {
    //                 for (const read of collection.rwset.reads) {
    //                     logger.trace(`       - read set - ${BLUE}key:${RESET} ${read.key}  ${BLUE}value:${read.value.toString()}`);
    //                 }
    //             }
    //             if (collection.rwset.writes) {
    //                 for (const write of collection.rwset.writes) {
    //                     logger.trace(`      - write set - ${BLUE}key:${RESET}${write.key} ${BLUE}is_delete:${RESET}${write.is_delete} ${BLUE}value:${RESET}${write.value.toString()}`);
    //                 }
    //             }
    //         }
    //     }
    // }
    if (transEvent.transactionData) {
      showTransactionData(transEvent.transactionData);
    }
  }
};

module.exports = {
  contractListener,
  blockListener,
};
