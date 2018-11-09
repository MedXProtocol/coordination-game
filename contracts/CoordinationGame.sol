pragma solidity ^0.4.24;

import "openzeppelin-solidity/contracts/ownership/Ownable.sol";
import "tcr/Parameterizer.sol";
import "./EtherPriceFeed.sol";
import "./Work.sol";
import "./TILRegistry.sol";

/**
@title CoordinationGame
@author Brendan Asselstine, Chuck Bergeron
@notice This contract stores work tokens in a pool which are applicantTokenDeposits
        as well as Ether balances in applicationBalancesInWei
**/
contract CoordinationGame is Ownable {
  using SafeMath for uint256;

  EtherPriceFeed etherPriceFeed;
  Work work;
  TILRegistry tilRegistry;

  uint256 public secondsInADay;
  uint256 public verifierTimeoutInDays;
  uint256 public applicantRevealTimeoutInDays;

  uint256 public applicationStakeAmount;
  uint256 public baseApplicationFeeUsdWei;

  uint256 public applicationCount;


  mapping (address => uint256[]) public applicantsApplicationIndices;
  mapping (address => uint256[]) public verifiersApplicationIndices;

  mapping (uint256 => uint256) public applicationBalancesInWei;
  mapping (uint256 => uint256) public applicantTokenDeposits;

  mapping (uint256 => address) public applicants;
  mapping (uint256 => bytes32) public secretAndRandomHashes;
  mapping (uint256 => bytes32) public randomHashes;
  mapping (uint256 => bytes) public hints;
  mapping (uint256 => address) public verifiers;
  mapping (uint256 => bytes32) public verifierSecrets;
  mapping (uint256 => bytes32) public applicantSecrets;

  /// Stores the block number whose hash is to be used for randomness
  mapping (uint256 => uint256) public randomBlockNumbers;

  mapping (uint256 => uint256) public createdAt;
  mapping (uint256 => uint256) public updatedAt;

  mapping (uint256 => uint256) public verifierSelectedAt;
  mapping (uint256 => uint256) public verifierSubmittedAt;
  mapping (uint256 => uint256) public verifierChallengedAt;

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

  /// Emitted when a Verifier is replaced by another after timing out.
  event VerifierSubmissionTimedOut(
    uint256 indexed applicationId,
    address indexed verifier
  );

  /// Emitted when a verifier submits their secret
  event VerifierSecretSubmitted(
    uint256 indexed applicationId,
    address verifier,
    bytes32 secret
  );

  event VerifierChallenged(
    uint256 indexed applicationId,
    address verifier
  );

  event ApplicantWon(
    uint256 indexed applicationId
  );

  event ApplicantLost(
    uint256 indexed applicationId
  );

  event SettingsUpdated(
    uint256 applicationStakeAmount,
    uint256 baseApplicationFeeUsdWei
  );

  modifier onlyApplicant(uint256 _applicationId) {
    require(applicants[_applicationId] == msg.sender, 'sender must be applicant');
    _;
  }

  modifier onlyVerifier(uint256 _applicationId) {
    require(verifiers[_applicationId] == msg.sender, 'sender must be verifier');
    _;
  }

  modifier randomBlockWasMined(uint256 _applicationId) {
    require(block.number >= randomBlockNumbers[_applicationId], 'enough blocks have been mined');
    _;
  }

  /**
  @notice Creates a new CoordinationGame
  @param _work the Work contract to select verifiers
  @param _tilRegistry the Trustless Incentivized List Registry (TCR) contract
         to add applicants to
  @param _applicationStakeAmount how much an applicant has to stake when applying
  */
  constructor (
    EtherPriceFeed _etherPriceFeed,
    Work _work,
    TILRegistry _tilRegistry,
    uint256 _applicationStakeAmount,
    uint256 _baseApplicationFeeUsdWei
  ) public {
    etherPriceFeed = _etherPriceFeed;
    work = _work;
    tilRegistry = _tilRegistry;
    applicationStakeAmount = _applicationStakeAmount;
    baseApplicationFeeUsdWei = _baseApplicationFeeUsdWei;

    secondsInADay = 86400;
    verifierTimeoutInDays = 4;
    applicantRevealTimeoutInDays = 3;
  }

  function setApplicationStakeAmount(uint256 _applicationStakeAmount)
    public
    onlyOwner
  {
    require(_applicationStakeAmount > 0, 'applicationStakeAmount is greater then zero');

    applicationStakeAmount = _applicationStakeAmount;
  }

  /**
  @notice Creates an application on behalf of the message sender, this kicks off
          the game for the applicant.
  @param _keccakOfSecretAndRandom The hash of the secret and salt
  @param _keccakOfRandom The hash of the salt
  @param _hint The hint for the verifier to determine the secret
  */
  function start(bytes32 _keccakOfSecretAndRandom, bytes32 _keccakOfRandom, bytes _hint)
    external
    payable
  {
    // make this configurable if we want to lock down 1 application per Eth address
    // require(applicantsApplicationIndices[msg.sender] == 0, 'the applicant has not yet applied');

    uint256 depositWei = weiPerApplication();
    require(msg.value >= depositWei, 'not enough ether');

    applicationCount += 1;
    uint256 applicationId = applicationCount;

    applicationBalancesInWei[applicationId] = msg.value;

    applicantsApplicationIndices[msg.sender].push(applicationId);
    applicants[applicationId] = msg.sender;
    secretAndRandomHashes[applicationId] = _keccakOfSecretAndRandom;
    randomHashes[applicationId] = _keccakOfRandom;
    hints[applicationId] = _hint;

    /// Make sure the next block is used for randomness
    randomBlockNumbers[applicationId] = block.number + 1;
    applicantTokenDeposits[applicationId] = minDeposit();

    createdAt[applicationId] = block.timestamp;
    updatedAt[applicationId] = block.timestamp;

    // Transfer a deposit of work tokens from the Applicant to this contract
    require(
      tilRegistry.token().transferFrom(msg.sender, address(this), applicantTokenDeposits[applicationId]),
      '2nd token transfer succeeded'
    );

    emit NewApplication(
      applicationId,
      msg.sender,
      _keccakOfSecretAndRandom,
      _keccakOfRandom,
      _hint
    );
  }

  function applicantRandomlySelectVerifier(uint256 _applicationId)
    external
    onlyApplicant(_applicationId)
    randomBlockWasMined(_applicationId)
  {
    // change from minDeposit to jobStake
    require(work.jobStake() == minDeposit(), 'job stake is the same size as the minDeposit');
    require(!verifierSubmittedSecret(_applicationId), "verifier has not submitted their secret");

    address previousVerifier = verifiers[_applicationId];

    // TODO: How are we converting the blockhash to a random number?
    uint256 randomNum = uint256(blockhash(randomBlockNumbers[_applicationId]));

    address selectedVerifier = selectVerifier(msg.sender, randomNum);

    if (previousVerifier != address(0)) {
      require(
        verifierSubmissionTimedOut(_applicationId),
        'verifier had their chance to submit their secret'
      );

      require(
        work.token().transfer(applicants[_applicationId], applicantTokenDeposits[_applicationId]),
        'transferred old verifiers deposit to applicant'
      );

      VerifierSubmissionTimedOut(_applicationId, previousVerifier);

      // If we chose this verifier last time let's choose a different one
      if (selectedVerifier == previousVerifier) {
        selectedVerifier = selectVerifier(msg.sender, randomNum + 1);
      }

      require(selectedVerifier != previousVerifier, 'new verifier is not the same as the previous one');
    }

    require(selectedVerifier != msg.sender, 'verifier is not the applicant');

    require(selectedVerifier != address(0), 'verifier is not 0');
    verifiers[_applicationId] = selectedVerifier;
    verifierSelectedAt[_applicationId] = block.timestamp;

    /// Update random block to be the next one
    randomBlockNumbers[_applicationId] = block.number + 1;

    verifiersApplicationIndices[selectedVerifier].push(_applicationId);
    updatedAt[_applicationId] = block.timestamp;

    // transfer tokens from verifier's stake in Work contract to here
    require(work.withdrawJobStake(selectedVerifier), 'transferred verifier tokens');

    emit VerifierSelected(
      _applicationId,
      msg.sender,
      selectedVerifier
    );
  }

  function selectVerifier(address applicant, uint256 randomNum) public view returns (address) {
    address selectedVerifier = work.selectWorker(randomNum);
    uint256 workerOffset = 0;
    while (selectedVerifier == applicant) {
      workerOffset += 1;
      selectedVerifier = work.selectWorker(randomNum + workerOffset);
    }
    return selectedVerifier;
  }

  /**
  @notice Allows the verifier to submit their secret
  @param _applicationId The application that the verifier is submitting for
  @param _secret The secret that the verifier is guessing
  */
  function verifierSubmitSecret(uint256 _applicationId, bytes32 _secret) public onlyVerifier(_applicationId) {
    require(applicationCount >= _applicationId, 'application has been initialized');
    require(verifierSecrets[_applicationId] == bytes32(0), 'verify has not already been called');
    require(_secret.length > 0, 'secret is not empty');

    // DISCUSS: do we actually want to do this? We could let them move
    // the application forward at anytime, but also allow the applicant
    // to reject this verifier and choose a new one after the expiry date
    require(
      !verifierSubmissionTimedOut(_applicationId),
      'verifier can still submit their secret'
    );

    verifierSecrets[_applicationId] = _secret;
    verifierSubmittedAt[_applicationId] = block.timestamp;

    updatedAt[_applicationId] = block.timestamp;

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
  ) public onlyApplicant(_applicationId) {
    require(!applicantRevealExpired(_applicationId), 'applicant can still reveal their secret');
    require(verifierSecrets[_applicationId] != bytes32(0), 'verifier has submitted their secret');

    bytes32 srHash = keccak256(abi.encodePacked(_secret, _randomNumber));
    bytes32 rHash = keccak256(abi.encodePacked(_randomNumber));
    require(srHash == secretAndRandomHashes[_applicationId], 'secret and random hash matches');
    require(rHash == randomHashes[_applicationId], 'random hash matches');

    applicantSecrets[_applicationId] = _secret;

    applyToRegistry(_applicationId);

    updatedAt[_applicationId] = block.timestamp;

    if (_secret != verifierSecrets[_applicationId]) {
      applicantLost(_applicationId);
    } else {
      applicantWon(_applicationId);
    }
  }

  /**
  @notice Allows the verifier to challenge when the applicant reveal timeframe has passed
  @param _applicationId The application that the verifier is challenging
  */
  function verifierChallenge(uint256 _applicationId) public onlyVerifier(_applicationId) {
    require(
      applicantRevealExpired(_applicationId),
      'applicant reveal period has expired'
    );
    verifierChallengedAt[_applicationId] = block.timestamp;

    /// Transfer the verifier's deposit back to them
    work.token().approve(address(work), applicantTokenDeposits[_applicationId]);
    work.depositJobStake(verifiers[_applicationId]);

    /// Transfer applicant's deposit back to them
    tilRegistry.token().transfer(
      applicants[_applicationId],
      applicantTokenDeposits[_applicationId]
    );

    updatedAt[_applicationId] = block.timestamp;

    emit VerifierChallenged(_applicationId, msg.sender);
  }

  function applicantWon(uint256 _applicationId) internal {
    wins[msg.sender] += 1;
    tilRegistry.updateStatus(bytes32(_applicationId));

    tilRegistry.token().approve(address(work), applicantTokenDeposits[_applicationId]);
    work.depositJobStake(verifiers[_applicationId]);

    emit ApplicantWon(_applicationId);
  }

  function applicantLost(uint256 _applicationId) internal {
    losses[msg.sender] += 1;

    autoChallenge(_applicationId);

    emit ApplicantLost(_applicationId);
  }

  /**
  @notice Converts an application id into a listing hash key
  @param _applicationId the application id
  */
  function getListingHash(uint256 _applicationId) public view returns (bytes32) {
    return bytes32(_applicationId);
  }

  function getApplicantsApplicationCount() external view returns (uint256) {
    return applicantsApplicationIndices[msg.sender].length;
  }

  function getApplicantsLastApplicationID() external view returns (uint256) {
    if (applicantsApplicationIndices[msg.sender].length > 0) {
      uint256 index = applicantsApplicationIndices[msg.sender].length.sub(1);
      return applicantsApplicationIndices[msg.sender][index];
    } else {
      return 0;
    }
  }

  function getVerifiersApplicationCount() external view returns (uint256 verifiersApplicationCount) {
    return verifiersApplicationIndices[msg.sender].length;
  }

  function getVerifiersLastApplicationID() external view returns (uint256 applicationId) {
    if (verifiersApplicationIndices[msg.sender].length > 0) {
      uint256 index = verifiersApplicationIndices[msg.sender].length.sub(1);
      return verifiersApplicationIndices[msg.sender][index];
    } else {
      return 0;
    }
  }

  function verifierSubmissionTimedOut(uint256 _applicationId) internal view returns (bool) {
    return (block.timestamp - verifierSelectedAt[_applicationId])
      > (verifierTimeoutInDays * secondsInADay);
  }

  function applicantRevealExpired(uint256 _applicationId) internal view returns (bool) {
    return (block.timestamp - verifierSubmittedAt[_applicationId])
      > (applicantRevealTimeoutInDays * secondsInADay);
  }

  function applyToRegistry(uint256 _applicationId) internal {
    tilRegistry.token().approve(address(tilRegistry), applicantTokenDeposits[_applicationId]);
    tilRegistry.apply(applicants[_applicationId], bytes32(_applicationId), applicantTokenDeposits[_applicationId], "");
  }

  function autoChallenge(uint256 _applicationId) internal {
    require(
      tilRegistry.token().balanceOf(address(this)) >= applicantTokenDeposits[_applicationId],
      'we have enough deposit'
    );
    tilRegistry.token().approve(address(tilRegistry), applicantTokenDeposits[_applicationId]);
    tilRegistry.challenge(bytes32(_applicationId), "");
  }

  function verifierSubmittedSecret(uint256 _applicationId) internal returns (bool) {
    return verifierSecrets[_applicationId] != 0;
  }

  // the 3rd-party TCR Registry contract uses this var:
  function minDeposit() public view returns (uint256) {
    return tilRegistry.parameterizer().get("minDeposit");
  }

  function updateSettings(
    uint256 _applicationStakeAmount,
    uint256 _baseApplicationFeeUsdWei
  ) public onlyOwner {
    setApplicationStakeAmount(_applicationStakeAmount);
    setBaseApplicationFeeUsdWei(_baseApplicationFeeUsdWei);

    emit SettingsUpdated(applicationStakeAmount, baseApplicationFeeUsdWei);
  }

  function setSecondsInADay(uint256 _secondsInADay) public onlyOwner {
    secondsInADay = _secondsInADay;
  }

  function setApplicantRevealTimeoutInDays(uint256 _applicantRevealTimeoutInDays) public onlyOwner {
    applicantRevealTimeoutInDays = _applicantRevealTimeoutInDays;
  }

  function setVerifierTimeoutInDays(uint256 _verifierTimeoutInDays) public onlyOwner {
    verifierTimeoutInDays = _verifierTimeoutInDays;
  }

  function setBaseApplicationFeeUsdWei(uint256 _baseApplicationFeeUsdWei) public onlyOwner {
    require(_baseApplicationFeeUsdWei > 0);

    baseApplicationFeeUsdWei = _baseApplicationFeeUsdWei;
  }

  function weiPerApplication() public view returns (uint256) {
    uint256 usdPerKwei = usdWeiPerEther().div(1000000000000000);
    uint256 kweiPerApplication = baseApplicationFeeUsdWei.div(usdPerKwei);

    return kweiPerApplication.mul(1000);
  }

  function usdWeiPerEther() public view returns (uint256) {
    return uint256(etherPriceFeed.read());
  }

}
