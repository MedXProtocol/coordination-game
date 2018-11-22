
pragma solidity ^0.4.24;

import "openzeppelin-eth/contracts/ownership/Ownable.sol";
import "./EtherPriceFeed.sol";
import "./Work.sol";
import "./TILRegistry.sol";
import "./IndexedBytes32Array.sol";

/**
@title CoordinationGame
@author Brendan Asselstine, Chuck Bergeron
@notice This contract stores work tokens in a pool which are applicantTokenDeposits
        as well as Ether balances in applicationBalancesInWei
**/
contract CoordinationGame is Ownable {
  using SafeMath for uint256;
  using IndexedBytes32Array for IndexedBytes32Array.Data;

  struct Game {
    bytes32 applicationId;
    address applicant;
    bytes32 secretAndRandomHash;
    bytes32 randomHash;
    bytes hint;
    uint256 createdAt;
    uint256 updatedAt;
    uint256 applicationFeeWei;
    uint256 applicantTokenDeposit;
    /// @notice the block number whose hash is to be used for randomness
    uint256 randomBlockNumber;
    bytes32 applicantSecret;
    address whistleblower;
  }

  struct Verification {
    /// @notice The time at which the verifier was selected
    uint256 verifierSelectedAt;
    /// @notice The address of the selected verifier
    address verifier;
    /// @notice The secret submitted by the verifier
    bytes32 verifierSecret;
    /// @notice The time at which the verifier submitted their secret
    uint256 verifierSubmittedAt;
    /// @notice The time at which the verifier challenged the game due to a reveal timeout
    uint256 verifierChallengedAt;
    uint256 verifierDepositWei;
  }

  EtherPriceFeed etherPriceFeed;
  Work work;
  TILRegistry tilRegistry;

  uint256 public verifierTimeoutInSeconds;
  uint256 public applicantRevealTimeoutInSeconds;

  uint256 public applicationStakeAmount;
  uint256 public baseApplicationFeeUsdWei;

  mapping (address => IndexedBytes32Array.Data) applicantsApplicationIndices;
  mapping (address => IndexedBytes32Array.Data) verifiersApplicationIndices;

  IndexedBytes32Array.Data gamesIterator;
  mapping (bytes32 => Game) public games;
  mapping (bytes32 => Verification) public verifications;

  event NewApplication(
    bytes32 indexed applicationId,
    address indexed applicant,
    bytes32 secretAndRandomHash,
    bytes32 randomHash,
    bytes hint
  );

  event VerifierSelected(
    bytes32 indexed applicationId,
    address indexed applicant,
    address indexed verifier
  );

  /// Emitted when a Verifier is replaced by another after timing out.
  event VerifierSubmissionTimedOut(
    bytes32 indexed applicationId,
    address indexed verifier
  );

  /// Emitted when a verifier submits their secret
  event VerifierSecretSubmitted(
    bytes32 indexed applicationId,
    address verifier,
    bytes32 secret
  );

  event VerifierChallenged(
    bytes32 indexed applicationId,
    address verifier
  );

  event ApplicantWon(
    bytes32 indexed applicationId
  );

  event ApplicantLost(
    bytes32 indexed applicationId
  );

  event SettingsUpdated(
    uint256 applicationStakeAmount,
    uint256 baseApplicationFeeUsdWei,
    uint256 verifierTimeoutInSeconds,
    uint256 applicantRevealTimeoutInSeconds
  );

  event Whistleblown(
    address whistleblower,
    bytes32 applicationId,
    uint256 randomNumber
  );

  modifier onlyApplicant(bytes32 _applicationId) {
    require(games[_applicationId].applicant == msg.sender, 'sender must be applicant');
    _;
  }

  modifier onlyVerifier(bytes32 _applicationId) {
    require(verifications[_applicationId].verifier == msg.sender, 'sender must be verifier');
    _;
  }

  modifier randomBlockWasMined(bytes32 _applicationId) {
    require(block.number >= games[_applicationId].randomBlockNumber, 'enough blocks have been mined');
    _;
  }

  modifier applicationStarted(bytes32 _applicationId) {
    require(games[_applicationId].secretAndRandomHash != bytes32(0), 'secretAndRandomHash is defined');
    _;
  }

  modifier onlyNewApplication(bytes32 _applicationId) {
    require(games[_applicationId].applicant == address(0), 'application has not been made before');
    _;
  }

  modifier secretNotRevealed(bytes32 _applicationId) {
    require(games[_applicationId].applicantSecret == bytes32(0), 'secret has not been revealed');
    _;
  }

  modifier notWhistleblown(bytes32 _applicationId) {
    require(games[_applicationId].whistleblower == address(0), 'no whistleblower');
    _;
  }

  /**
  @notice Creates a new CoordinationGame
  @param _work the Work contract to select verifiers
  @param _tilRegistry the Trustless Incentivized List Registry (TCR) contract
         to add applicants to
  @param _applicationStakeAmount how much an applicant has to stake when applying
  */
  function init (
    address _owner,
    EtherPriceFeed _etherPriceFeed,
    Work _work,
    TILRegistry _tilRegistry,
    uint256 _applicationStakeAmount,
    uint256 _baseApplicationFeeUsdWei
  ) public initializer {
    require(_tilRegistry != address(0));
    require(_work != address(0));
    Ownable.initialize(_owner);
    etherPriceFeed = _etherPriceFeed;
    work = _work;
    tilRegistry = _tilRegistry;
    applicationStakeAmount = _applicationStakeAmount;
    baseApplicationFeeUsdWei = _baseApplicationFeeUsdWei;

    verifierTimeoutInSeconds = 345600; // 4 * 86400
    applicantRevealTimeoutInSeconds = 259200; // 3 * 86400
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
  @param _hint The hint the Applicant provided for the Verifier
  */
  function start(
    bytes32 _applicationId,
    bytes32 _keccakOfSecretAndRandom,
    bytes32 _keccakOfRandom,
    bytes _hint
  )
    external
    payable
    onlyNewApplication(_applicationId)
  {
    // make this configurable if we want to lock down 1 application per Eth address
    // require(applicantsApplicationIndices[msg.sender] == 0, 'the applicant has not yet applied');

    uint256 depositWei = weiPerApplication();
    require(msg.value >= depositWei, 'not enough ether');

    games[_applicationId] = Game(
      _applicationId,
      msg.sender, // applicant
      _keccakOfSecretAndRandom, // secretAndRandomHashes
      _keccakOfRandom, // randomHashes
      _hint, // hints
      block.timestamp, // createdAt
      block.timestamp, // updatedAt
      msg.value, // applicationBalancesInWei
      applicationStakeAmount, // applicantTokenDeposits
      block.number + 1, // randomBlockNumbers
      0, // applicantSecret
      0 // whistleblower
    );
    verifications[_applicationId] = Verification(
      0, // verifier
      0, // verifierSecret
      0, // verifierSelectedAt
      0, // verifierSubmittedAt
      0, // verifierChallengedAt
      0 // verifierDepositWei
    );
    gamesIterator.pushValue(_applicationId);
    applicantsApplicationIndices[msg.sender].pushValue(_applicationId);

    // Transfer a deposit of work tokens from the Applicant to this contract
    require(
      tilRegistry.token().transferFrom(msg.sender, address(this), games[_applicationId].applicantTokenDeposit),
      '2nd token transfer succeeded'
    );

    emit NewApplication(
      _applicationId,
      msg.sender,
      _keccakOfSecretAndRandom,
      _keccakOfRandom,
      _hint
    );
  }

  function applicantRandomlySelectVerifier(bytes32 _applicationId)
    external
    onlyApplicant(_applicationId)
    randomBlockWasMined(_applicationId)
    notWhistleblown(_applicationId)
  {
    require(!verifierSubmittedSecret(_applicationId), "verifier has not submitted their secret");

    Game storage game = games[_applicationId];
    Verification storage verification = verifications[_applicationId];

    address previousVerifier = verification.verifier;
    uint256 randomNum = uint256(blockhash(game.randomBlockNumber));
    address selectedVerifier = selectVerifier(msg.sender, randomNum);

    if (previousVerifier != address(0)) {
      require(
        verifierSubmissionTimedOut(_applicationId),
        'verifier had their chance to submit their secret'
      );

      require(
        work.token().transfer(game.applicant, game.applicantTokenDeposit),
        'transferred old verifiers deposit to applicant'
      );

      emit VerifierSubmissionTimedOut(_applicationId, previousVerifier);

      verifiersApplicationIndices[previousVerifier].removeValue(_applicationId);

      // If we chose this verifier last time let's choose a different one
      if (selectedVerifier == previousVerifier) {
        selectedVerifier = selectVerifier(msg.sender, randomNum + 1);
      }

      require(selectedVerifier != previousVerifier, 'new verifier is not the same as the previous one');
    }

    require(selectedVerifier != msg.sender, 'verifier is not the applicant');
    require(selectedVerifier != address(0), 'verifier is not 0');

    verification.verifier = selectedVerifier;
    verification.verifierSelectedAt = block.timestamp;

    /// Update random block to be the next one
    game.randomBlockNumber = block.number + 1;
    game.updatedAt = block.timestamp;

    verifiersApplicationIndices[selectedVerifier].pushValue(_applicationId);

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
  function verifierSubmitSecret(bytes32 _applicationId, bytes32 _secret)
    public
    payable
    onlyVerifier(_applicationId)
    notWhistleblown(_applicationId)
  {
    Verification storage verification = verifications[_applicationId];
    Game storage game = games[_applicationId];

    require(msg.value >= game.applicationFeeWei, 'verifier is submitting enough ether');
    require(gamesIterator.hasValue(_applicationId), 'application has been initialized');
    require(verification.verifierSecret == bytes32(0), 'verify has not already been called');
    require(_secret.length > 0, 'secret is not empty');

    verification.verifierSecret = _secret;
    verification.verifierSubmittedAt = block.timestamp;
    verification.verifierDepositWei = msg.value;
    game.updatedAt = block.timestamp;

    emit VerifierSecretSubmitted(_applicationId, msg.sender, _secret);
  }

  function whistleblow(
    bytes32 _applicationId,
    uint256 _randomNumber
  )
    public
    applicationStarted(_applicationId)
    secretNotRevealed(_applicationId)
    notWhistleblown(_applicationId)
  {
    Game storage game = games[_applicationId];
    Verification storage verification = verifications[_applicationId];

    require(keccak256(abi.encodePacked(_randomNumber)) == game.randomHash, 'random number matches');

    // if a verifier was selected, refund
    if (verification.verifier != address(0)) {
      returnVerifierJobStake(_applicationId);
    }

    /// Transfer applicant's deposit to the whistleblower
    tilRegistry.token().transfer(
      msg.sender,
      game.applicantTokenDeposit
    );

    game.whistleblower = msg.sender;

    emit Whistleblown(msg.sender, _applicationId, _randomNumber);

    /// Transfer applicant's deposit to the whistleblower
    msg.sender.transfer(game.applicationFeeWei);
  }

  /**
  @notice Allows the applicant to reveal their secret
  @param _secret The applicant's secret
  @param _randomNumber The random number the applicant chose to obscure the secret
  */
  function applicantRevealSecret(
    bytes32 _applicationId,
    bytes32 _secret,
    uint256 _randomNumber
  ) public onlyApplicant(_applicationId) notWhistleblown(_applicationId) secretNotRevealed(_applicationId) {
    Game storage game = games[_applicationId];
    Verification storage verification = verifications[_applicationId];

    require(!applicantRevealExpired(_applicationId), 'applicant can still reveal their secret');
    require(verification.verifierSecret != bytes32(0), 'verifier has submitted their secret');

    bytes32 srHash = keccak256(abi.encodePacked(_secret, _randomNumber));
    bytes32 rHash = keccak256(abi.encodePacked(_randomNumber));
    require(srHash == game.secretAndRandomHash, 'secret and random hash matches');
    require(rHash == game.randomHash, 'random hash matches');

    game.updatedAt = block.timestamp;
    game.applicantSecret = _secret;

    if (_secret != verification.verifierSecret) {
      applicantLost(_applicationId);
    } else {
      applicantWon(_applicationId);
    }
  }

  /**
  @notice Allows the verifier to challenge when the applicant reveal timeframe has passed
  @param _applicationId The application that the verifier is challenging
  */
  function verifierChallenge(
    bytes32 _applicationId
  ) public onlyVerifier(_applicationId) notWhistleblown(_applicationId) secretNotRevealed(_applicationId) {
    Game storage game = games[_applicationId];
    Verification storage verification = verifications[_applicationId];

    require(
      applicantRevealExpired(_applicationId),
      'applicant reveal period has expired'
    );
    require(
      verification.verifierChallengedAt == 0,
      'verifier has not already challenged'
    );
    verification.verifierChallengedAt = block.timestamp;

    /// Transfer the verifier's deposit back to them
    returnVerifierJobStake(_applicationId);
    game.updatedAt = block.timestamp;

    /// Transfer applicant's deposit back to them
    tilRegistry.token().transfer(
      game.applicant,
      game.applicantTokenDeposit
    );

    emit VerifierChallenged(_applicationId, msg.sender);

    /// Transfer the applicant's application fee to the verifier
    msg.sender.transfer(game.applicationFeeWei);
  }

  function applicantWon(bytes32 _applicationId) internal {
    Game storage game = games[_applicationId];
    Verification storage verification = verifications[_applicationId];

    /// provide the stake for the Registry
    tilRegistry.token().approve(address(tilRegistry), game.applicantTokenDeposit);

    tilRegistry.applicantWonCoordinationGame(
      _applicationId, game.applicant, game.applicantTokenDeposit
    );

    /// Return the verifier's job stake
    returnVerifierJobStake(_applicationId);
    /// Pay the verifier the application fee
    verification.verifier.transfer(game.applicationFeeWei);

    emit ApplicantWon(_applicationId);
  }

  function applicantLost(bytes32 _applicationId) internal {
    Game storage game = games[_applicationId];
    Verification storage verification = verifications[_applicationId];

    /// Approve of the verifier token transfer & applicant token transfer
    tilRegistry.token().approve(
      address(tilRegistry),
      game.applicantTokenDeposit.add(work.jobStake())
    );

    uint256 totalTransfer = game.applicationFeeWei.add(verification.verifierDepositWei);

    tilRegistry.applicantLostCoordinationGame.value(totalTransfer)(
      _applicationId, game.applicant, game.applicantTokenDeposit, totalTransfer,
      verification.verifier, work.jobStake()
    );

    emit ApplicantLost(_applicationId);
  }

  function returnVerifierJobStake(bytes32 _applicationId) internal {
    Verification storage verification = verifications[_applicationId];
    tilRegistry.token().approve(address(work), work.jobStake());
    work.depositJobStake(verification.verifier);
    uint256 deposit = verification.verifierDepositWei;
    verification.verifierDepositWei = 0;
    verification.verifier.transfer(deposit);
  }

  function getApplicantsApplicationCount(address _applicant) external view returns (uint256) {
    return applicantsApplicationIndices[_applicant].length();
  }

  function getApplicantsApplicationAtIndex(address _applicant, uint256 _index) external view returns (bytes32) {
    return applicantsApplicationIndices[_applicant].valueAtIndex(_index);
  }

  function getApplicantsLastApplicationID(address _applicant) external view returns (bytes32) {
    if (applicantsApplicationIndices[_applicant].length() > 0) {
      uint256 index = applicantsApplicationIndices[_applicant].length().sub(1);
      return applicantsApplicationIndices[_applicant].valueAtIndex(index);
    } else {
      return 0;
    }
  }

  function getVerifiersApplicationCount(address _verifier) external view returns (uint256) {
    return verifiersApplicationIndices[_verifier].length();
  }

  function getVerifiersApplicationAtIndex(address _applicant, uint256 _index) external view returns (bytes32) {
    return verifiersApplicationIndices[_applicant].valueAtIndex(_index);
  }

  function getVerifiersLastApplicationID(address _verifier) external view returns (bytes32) {
    if (verifiersApplicationIndices[_verifier].length() > 0) {
      uint256 index = verifiersApplicationIndices[_verifier].length().sub(1);
      return verifiersApplicationIndices[_verifier].valueAtIndex(index);
    } else {
      return 0;
    }
  }

  function verifierSubmissionTimedOut(bytes32 _applicationId) public view returns (bool) {
    return (block.timestamp - verifications[_applicationId].verifierSelectedAt) > verifierTimeoutInSeconds;
  }

  function applicantRevealExpired(bytes32 _applicationId) public view returns (bool) {
    return (block.timestamp - verifications[_applicationId].verifierSubmittedAt) > applicantRevealTimeoutInSeconds;
  }

  function verifierSubmittedSecret(bytes32 _applicationId) internal view returns (bool) {
    return verifications[_applicationId].verifierSecret != 0;
  }

  function updateSettings(
    uint256 _applicationStakeAmount,
    uint256 _baseApplicationFeeUsdWei,
    uint256 _verifierTimeoutInSeconds,
    uint256 _applicantRevealTimeoutInSeconds
  ) public onlyOwner {
    setApplicationStakeAmount(_applicationStakeAmount);
    setBaseApplicationFeeUsdWei(_baseApplicationFeeUsdWei);

    setVerifierTimeoutInSeconds(_verifierTimeoutInSeconds);
    setApplicantRevealTimeoutInSeconds(_applicantRevealTimeoutInSeconds);

    emit SettingsUpdated(
      applicationStakeAmount,
      baseApplicationFeeUsdWei,
      verifierTimeoutInSeconds,
      applicantRevealTimeoutInSeconds
    );
  }

  function setApplicantRevealTimeoutInSeconds(uint256 _applicantRevealTimeoutInSeconds) public onlyOwner {
    require(_applicantRevealTimeoutInSeconds > 0);

    applicantRevealTimeoutInSeconds = _applicantRevealTimeoutInSeconds;
  }

  function setVerifierTimeoutInSeconds(uint256 _verifierTimeoutInSeconds) public onlyOwner {
    require(_verifierTimeoutInSeconds > 0);

    verifierTimeoutInSeconds = _verifierTimeoutInSeconds;
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

  function applicationCount() public view returns (uint256) {
    return gamesIterator.length();
  }

  function applicationAt(uint256 _index) public view returns (bytes32) {
    return gamesIterator.valueAtIndex(_index);
  }
}
