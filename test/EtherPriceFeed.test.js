const EtherPriceFeed = artifacts.require('EtherPriceFeed.sol');

contract('EtherPriceFeed', function (accounts) {
  describe('set()', () => {
    it("should work", async () => {
      const etherPriceFeed = await EtherPriceFeed.deployed()

      etherPriceFeed.set(web3.toWei('100.52', 'ether'))
      assert.equal(web3.toDecimal(await etherPriceFeed.read()), web3.toWei('100.52', 'ether'))
    })
  })
})
