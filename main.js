const SHA256 = require('crypto-js/sha256');
const shortid = require('shortid');

class Transaction {
	constructor(buyerId, sellerId, amount) {
		this.transactionId = shortid.generate();
		this.buyerId = buyerId;
		this.sellerId = sellerId;
		this.amount = amount;
	}
}

class Block {
	constructor(data = [], index = 0, previousHash = null) {
		this.index = index;
		this.data = data;
		this.previousHash = previousHash;
		this.hash = null;
	}

	calculateHash() {
		return SHA256(this.index + this.previousHash + JSON.stringify(this.data)).toString();
	}
}

class Blockchain {
	constructor(owner) {
		this.owner = owner;
		this.chain = [this.createGenesisBlock()];
		this.rootHash = this.getLatestBlock().hash;
	}

	createGenesisBlock() {
		return new Block("Genesis block");
	}

	getLatestBlock() {
		return this.chain[this.chain.length - 1];
	}

	addBlock(newBlock, transactions) {
		newBlock.index = this.chain.length;
		newBlock.previousHash = this.getLatestBlock().hash;
		newBlock.data = transactions;
		newBlock.hash, this.rootHash = newBlock.calculateHash(); // Anytime we change the property of a block, the hash must change
		this.chain.push(newBlock);
	}
}

class Consensus {
	constructor() {}

	getUniqueRootHashes(nodes) {
		const totalNodes = nodes.length;
		var uniqueRootHashes = {};
		// Build an object where each property represents a unique root hash (rootHashes[hash] = numOfNodesWithThisHash)
		for(var i = 0; i < totalNodes; i++) {
			const chainLength = nodes[i].chain.length;
			const rootHash = nodes[i].rootHash;
			// If the hash is already accounted for, iterate the counter
			if(uniqueRootHashes.hasOwnProperty(rootHash)) {
				uniqueRootHashes[rootHash]++;
			} else {
				// Otherwise, add it to the object and set the counter to 1
				uniqueRootHashes[rootHash] = 1;
			}
		}
		return {
			uniqueRootHashes: uniqueRootHashes,
			totalNodes: totalNodes
		}
	}

	isThereConsensus(uniqueRootHashes, totalNodes) {
		var suspectRootHashes = [];
		var consensus = false;
		// Loop through the uniqueRootHashes
		for(var rootHash in uniqueRootHashes) {
			// Prevalence: "Proportion of all nodes with this root hash"
			const prevalence = (uniqueRootHashes[rootHash] / totalNodes);
			// If an absolute majority of nodes have the same root hash, then we have consensus
			if(prevalence > 0.5) {
				consensus = true;
			} else {
				// If the prevalence of the root hash is below 0.5, it is considered a suspect
				suspectRootHashes.push({
					hash: rootHash,
					prevalence: prevalence
				});
			}
		}
		return {
			consensus: consensus,
			suspectRootHashes: suspectRootHashes
		}
	}

	identifySuspectNodes(nodes, suspectRootHashes) {
		// Compare the root hash of each node with each of the suspect hashes
		var suspectNodes = [];
		for(var i = 0; i < suspectRootHashes.length; i++) {
			const suspectHash = suspectRootHashes[i].hash;
		  for(var j = 0; j < nodes.length; j++) {
		  	const nodeHash = nodes[j].rootHash;
		  	// If a match is found, add the node owner to the suspectNodes array
		  	if(nodeHash == suspectHash) {
		  		suspectNodes.push(nodes[j].owner);
		  	}
		  }
		}
		return suspectNodes;
	}
}

const users = {
	carol: 'carol',
	thief: 'thief',
	dave: 'dave'
}

/**
	Node 1
**/

// Instantiate blockchain
const carolNode = new Blockchain(users.carol);

// Create transactions
const transactions = [
	new Transaction(users.thief, users.carol, 10),
	new Transaction(users.dave, users.thief, 5), 
	new Transaction(users.dave, users.carol, 1)
];

// Create new block and add transactions
carolNode.addBlock(new Block(), transactions);

/**
	Node 2
**/

const daveNode = new Blockchain(users.dave);
daveNode.addBlock(new Block(), transactions);

/**
	Simulate a user tampering with their node to make themselves rich
**/

const thiefNode = new Blockchain(users.thief);

// Create transactions
const transactionsTampered = [
	new Transaction(users.carol, users.thief, 1000000),
	new Transaction(users.dave, users.thief, 5), 
	new Transaction(users.dave, users.carol, 1)
];

// Create new block and add transactions
thiefNode.addBlock(new Block(), transactionsTampered);


/**
	Determine consensus
**/
const consensus = new Consensus();

if(consensus == false) {
	console.log('fork my life');
} else {
	// Identify the suspect nodes
	const nodes = [carolNode, thiefNode, daveNode];
	const uniqueRootHashes = consensus.getUniqueRootHashes(nodes).uniqueRootHashes;
	const totalNodes = consensus.getUniqueRootHashes(nodes).totalNodes;
	const suspectRootHashes = consensus.isThereConsensus(uniqueRootHashes, totalNodes).suspectRootHashes;

	console.log('Suspect nodes: '  + consensus.identifySuspectNodes(nodes, suspectRootHashes));
}
