// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

contract OncePolicy {

    struct Policy {
        address insured;
        address beneficiary;
        uint256 sumAssured;
        uint256 premium;
        uint8 age;
        uint8 gender;
        string region;
        uint256 startDate;
        uint256 endDate;
        bool active;
        string insuredName;
    }

    event PolicyCreated(
        uint256 indexed policyId,
        address indexed insured,
        address indexed beneficiary,
        string insuredName,
        uint8 age,
        uint8 gender,
        string region,
        uint256 sumAssured,
        uint256 premium
    );

    mapping(uint256 => Policy) public policies;
    uint256 public nextPolicyId;
    uint256 public duration;
    address public owner;

    modifier onlyOwner() {
        require(msg.sender == owner, "Not owner");
        _;
    }

    constructor(uint256 _duration) {
        owner = msg.sender;
        duration = _duration;
    }

    function createPolicy(
        address insured,
        address beneficiary,
        string memory insuredName,
        uint8 age,
        uint8 gender,
        string memory region,
        uint256 sumAssured,
        uint256 premium
    ) external onlyOwner {
        uint256 policyId = nextPolicyId++;
        policies[policyId] = Policy({
            insured: insured,
            beneficiary: beneficiary,
            sumAssured: sumAssured,
            premium: premium,
            age: age,
            gender: gender,
            region: region,
            startDate: block.timestamp,
            endDate: block.timestamp + duration,
            active: true,
            insuredName: insuredName
        });
        emit PolicyCreated(
            policyId,
            insured,
            beneficiary,
            insuredName,
            age,
            gender,
            region,
            sumAssured,
            premium
        );
    }
}
