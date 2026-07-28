// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

contract PredicateProtectedAction {
    event ProtectedActionExecuted(address indexed subject, uint256 amountWei, bytes32 nonce);
    event AuthorizationUsed(bytes32 indexed nonce);

    address public immutable authSigner;

    mapping(bytes32 => bool) public usedNonces;

    uint256 public counter;

    struct Authorization {
        uint256 schemaVersion;
        address subject;
        uint256 amountWei;
        bytes32 nonce;
        uint64 expiresAt;
        bytes32 policyIdHash;
        bytes32 evaluationIdHash;
        address contractAddress;
        uint256 chainId;
    }

    constructor(address _authSigner) {
        require(_authSigner != address(0), "authSigner required");
        authSigner = _authSigner;
    }

    function execute(Authorization calldata auth, bytes calldata signature) external {
        require(auth.schemaVersion == 1, "bad schema");
        require(auth.contractAddress == address(this), "bad contract");
        require(auth.chainId == block.chainid, "bad chain");
        require(auth.expiresAt >= block.timestamp, "expired");
        require(!usedNonces[auth.nonce], "replay");

        bytes32 messageHash = _messageHash(auth);
        address recovered = _recoverSigner(messageHash, signature);
        require(recovered == authSigner, "bad signature");

        usedNonces[auth.nonce] = true;
        emit AuthorizationUsed(auth.nonce);

        counter += 1;
        emit ProtectedActionExecuted(auth.subject, auth.amountWei, auth.nonce);
    }

    function _messageHash(Authorization calldata auth) internal view returns (bytes32) {
        return keccak256(
            abi.encodePacked(
                "PREDICATE_AUTH_V1",
                address(this),
                uint256(block.chainid),
                auth.subject,
                auth.amountWei,
                auth.nonce,
                auth.expiresAt,
                auth.policyIdHash,
                auth.evaluationIdHash
            )
        );
    }

    function _recoverSigner(bytes32 messageHash, bytes calldata signature) internal pure returns (address) {
        bytes32 ethSigned = keccak256(abi.encodePacked("\x19Ethereum Signed Message:\n32", messageHash));
        (bytes32 r, bytes32 s, uint8 v) = _splitSig(signature);
        return ecrecover(ethSigned, v, r, s);
    }

    function _splitSig(bytes calldata sig) internal pure returns (bytes32 r, bytes32 s, uint8 v) {
        require(sig.length == 65, "bad sig len");
        assembly {
            r := calldataload(sig.offset)
            s := calldataload(add(sig.offset, 32))
            v := byte(0, calldataload(add(sig.offset, 64)))
        }
        if (v < 27) v += 27;
        require(v == 27 || v == 28, "bad v");
    }
}
