pragma solidity ^0.4.24;

import "openzeppelin-solidity/contracts/ownership/Ownable.sol";
import "tcr/Parameterizer.sol";
import "./Work.sol";
import "./TILRegistry.sol";

/**
@title CoordinationGame
@author Brendan Asselstine, Chuck Bergeron
@notice This contract stores work tokens in a pool which are applicant deposits
**/
contract CoordinationGame is Ownable {
  Work work;
  TILRegistry tilRegistry;

  uint256 public applicationCount;
  uint private secondsInDay;

  uint256 public constant verifierTimeout = 120;

  mapping (address => uint256[]) public applicantsApplicationIndices;
  mapping (uint256 => address) public applicants;
  mapping (uint256 => bytes32) public secretAndRandomHashes;
  mapping (uint256 => bytes32) public randomHashes;
  mapping (uint256 => bytes) public hints;
  mapping (uint256 => address) public verifiers;
  mapping (uint256 => bytes32) public verifierSecrets;
  mapping (uint256 => bytes32) public applicantSecrets;
  mapping (uint256 => uint256) public verifierSelectedAt;

  mapping (address => uint256) wins;
  mapping (address => uint256) losses;

  event NewApplication(
    uint256 indexed applicationId,
    address indexed applicant,
    bytes32 secretAndRandomHash,
    bytes32 randomHash,
    bytes hint
  );

  event VerifierSelected(
    uint256 indexed applicationId,
    address indexed applicant,
    address indexed verifier
  );

  event VerifierSecretSubmitted(
    uint256 indexed applicationId,
    address verifier,
    bytes32 secret
  );

  event ApplicantWon(
    uint256 indexed applicationId
  );

  event ApplicantLost(
    uint256 indexed applicationId
  );

  /**
  @notice Creates a new CoordinationGame
  @param _work the Work contract to select verifiers
  @param _tilRegistry the Trustless Incentivized List Registry (TCR) contract
         to add applicants to
  */
  function init(Work _work, TILRegistry _tilRegistry) public {
    secondsInDay = 86400;
    work = _work;
    tilRegistry = _tilRegistry;
  }

  /**
  @notice Creates an application on behalf of the message sender, this kicks off
          the game for the applicant
  @param _keccakOfSecretAndRandom The hash of the secret and salt
  @param _keccakOfRandom The hash of the salt
  @param _hint The hint for the verifier to determine the secret
  */
  function start(bytes32 _keccakOfSecretAndRandom, bytes32 _keccakOfRandom, bytes _hint)
    public
  {
    // make this configurable if we want to lock down 1 application per Eth address
    // require(applicantsApplicationIndices[msg.sender] == 0, 'the applicant has not yet applied');

    applicationCount += 1;
    applicantsApplicationIndices[msg.sender].push(applicationCount);
    applicants[applicationCount] = msg.sender;
    secretAndRandomHashes[applicationCount] = _keccakOfSecretAndRandom;
    randomHashes[applicationCount] = _keccakOfRandom;
    hints[applicationCount] = _hint;

    uint256 deposit = tilRegistry.parameterizer().get("minDeposit");

    // Transfer a desposit of work tokens from the Applicant to this contract
    require(
      tilRegistry.token().transferFrom(msg.sender, address(this), deposit),
      '2nd token transfer succeeded'
    );

    emit NewApplication(
      applicationCount,
      msg.sender,
      _keccakOfSecretAndRandom,
      _keccakOfRandom,
      _hint
    );
  }

  function applicantRandomlySelectVerifier(uint256 _applicationId) external {
    require(applicants[_applicationId] == msg.sender, 'sender owns this application');

    uint256 deposit = tilRegistry.parameterizer().get("minDeposit");
    address previousVerifier = verifiers[_applicationId];
    // why minus 1 ?
    uint256 randomNum = uint256(blockhash(block.number - 1));

    address v = work.selectWorker(randomNum);

    if (previousVerifier != address(0)) {
      require(
        verifierActionExpired(_applicationId),
        'verifier had their chance to submit their secret'
      );

      // If we chose this verifier last time let's choose a different one
      if (v == previousVerifier) {
        v = work.selectWorker(randomNum - 1);
      }

      require(v != previousVerifier, 'new verifier is not the same as the previous one');
      // TODO: reverse previousVerifier's stake
    }

    require(v != address(0), 'verifier is not 0');
    verifiers[_applicationId] = v;
    verifierSelectedAt[_applicationId] = block.timestamp;

    // transfer tokens from verifier's stake in Work contract to here
    // TODO: This seems wrong as there is nothing about a verifier address here ... :
    require(
      work.token().allowance(address(work), address(this)) > deposit,
      'we can transfer tokens'
    );
    require(
      work.token().balanceOf(address(work)) > deposit,
      'the work contract has enough tokens'
    );
    require(
      work.token().transferFrom(work, address(this), deposit),
      'token transfer succeeded'
    );

    emit VerifierSelected(
      _applicationId,
      msg.sender,
      v
    );
  }

  /**
  @notice Allows the verifier to submit their secret
  @param _applicationId The application that the verifier is submitting for
  @param _secret The secret that the verifier is guessing
  */
  function verifierSubmitSecret(uint256 _applicationId, bytes32 _secret) public {
    require(applicationCount >= _applicationId, 'application has been initialized');
    require(msg.sender == verifiers[_applicationId], 'sender is verifier');
    require(verifierSecrets[_applicationId] == bytes32(0), 'verify has not already been called');
    require(_secret.length > 0, 'secret is not empty');

    // DISCUSS: do we actually want to do this? We could let them move
    // the application forward at anytime, but also allow the applicant
    // to reject this verifier and choose a new one after the expiry date
    require(
      !verifierActionExpired(_applicationId),
      'verifier can still submit their secret'
    );

    verifierSecrets[_applicationId] = _secret;

    emit VerifierSecretSubmitted(_applicationId, msg.sender, _secret);
  }

  /**
  @notice Allows the applicant to reveal their secret
  @param _secret The applicant's secret
  @param _randomNumber The random number the applicant chose to obscure the secret
  */
  function applicantRevealSecret(
    uint256 _applicationId,
    bytes32 _secret,
    uint256 _randomNumber
  ) public {
    uint256 deposit = tilRegistry.parameterizer().get("minDeposit");
    require(applicants[_applicationId] == msg.sender, 'sender owns this application');

    require(verifierSecrets[_applicationId] != bytes32(0), 'verifier has submitted their secret');

    bytes32 srHash = keccak256(abi.encodePacked(_secret, _randomNumber));
    bytes32 rHash = keccak256(abi.encodePacked(_randomNumber));
    require(srHash == secretAndRandomHashes[_applicationId], 'secret and random hash matches');
    require(rHash == randomHashes[_applicationId], 'random hash matches');

    applicantSecrets[_applicationId] = _secret;

    tilRegistry.token().approve(address(tilRegistry), deposit);
    tilRegistry.apply(applicants[_applicationId], bytes32(_applicationId), deposit, "");

    if (_secret != verifierSecrets[_applicationId]) {
      applicantLost(_applicationId);
    } else {
      applicantWon(_applicationId);
    }
  }

  function applicantWon(uint256 _applicationId) internal {
    wins[msg.sender] += 1;
    tilRegistry.updateStatus(bytes32(_applicationId));

    emit ApplicantWon(_applicationId);
  }

  function applicantLost(uint256 _applicationId) internal {
    uint256 deposit = tilRegistry.parameterizer().get("minDeposit");

    losses[msg.sender] += 1;

    require(
      tilRegistry.token().balanceOf(address(this)) >= deposit,
      'we have enough deposit'
    );
    tilRegistry.token().approve(address(tilRegistry), deposit);
    tilRegistry.challenge(bytes32(_applicationId), "");

    emit ApplicantLost(_applicationId);
  }

  function secondsInADay() public view returns (uint) {
    return secondsInDay;
  }

  function setSecondsInADay(uint _secondsInDay) public onlyOwner {
    secondsInDay = _secondsInDay;
  }

  /**
  @notice Converts an application id into a listing hash key
  @param _applicationId the application id
  */
  function getListingHash(uint256 _applicationId) public view returns (bytes32) {
    return bytes32(_applicationId);
  }

  function getApplicantsLastApplicationID() external view returns (uint applicationId) {
    uint index = applicantsApplicationIndices[msg.sender].length - 1;
    return applicantsApplicationIndices[msg.sender][index];
  }

  function verifierActionExpired(uint256 _applicationId) internal view returns (bool) {
    // uint256 verifierTimeout = tilRegistry.parameterizer().get("verifierTimeout");
    require(verifierTimeout != 0, 'verifierTimeout equals 0');

    return (
      block.timestamp - verifierSelectedAt[_applicationId]
    ) > verifierTimeout;
  }

  // function verifierActionExpired(uint256 _applicationId) internal view returns (bool) {
  //   // uint256 verifierTimeout = tilRegistry.parameterizer().get("verifierTimeout");
  //   require(verifierTimeout != 0, 'verifierTimeout equals 0');
  //
  //   return (
  //     block.timestamp - verifierSelectedAt[_applicationId]
  //   ) > verifierTimeout;
  // }

}
