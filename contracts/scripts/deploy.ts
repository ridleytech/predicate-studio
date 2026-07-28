import fs from "node:fs";
import path from "node:path";
import solc from "solc";
import { ethers } from "ethers";

function mustEnv(name: string): string {
  const v = process.env[name];
  if (!v) throw new Error(`${name} is required`);
  return v;
}

function trim0x(s: string): string {
  return s.startsWith("0x") || s.startsWith("0X") ? s.slice(2) : s;
}

async function main() {
  const rpcUrl = process.env.GANACHE_RPC_URL ?? "http://127.0.0.1:8545";
  const deployerKey = mustEnv("DEPLOYER_PRIVATE_KEY");
  const authSigner = mustEnv("AUTH_SIGNER_ADDRESS");

  const sourcePath = path.join(
    process.cwd(),
    "src",
    "PredicateProtectedAction.sol",
  );
  const source = fs.readFileSync(sourcePath, "utf8");

  const input = {
    language: "Solidity",
    sources: {
      "PredicateProtectedAction.sol": { content: source },
    },
    settings: {
      evmVersion: "paris",
      outputSelection: {
        "*": {
          "*": ["abi", "evm.bytecode.object"],
        },
      },
    },
  };

  const output = JSON.parse(solc.compile(JSON.stringify(input)));
  const errors = output.errors ?? [];
  const fatal = errors.filter((e: any) => e.severity === "error");
  if (fatal.length) {
    throw new Error(
      `solc compile failed: ${fatal.map((e: any) => e.formattedMessage).join("\n")}`,
    );
  }

  const contractOut =
    output.contracts["PredicateProtectedAction.sol"].PredicateProtectedAction;
  const abi = contractOut.abi;
  const bytecode = "0x" + contractOut.evm.bytecode.object;

  const provider = new ethers.JsonRpcProvider(rpcUrl);
  const wallet = new ethers.Wallet(trim0x(deployerKey), provider);

  const factory = new ethers.ContractFactory(abi, bytecode, wallet);
  const contract = await factory.deploy(authSigner);
  await contract.waitForDeployment();

  const addr = await contract.getAddress();
  console.log(JSON.stringify({ contractAddress: addr, authSigner }, null, 2));
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
