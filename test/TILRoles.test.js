const TILRoles = artifacts.require('TILRoles')
const expectThrow = require('./helpers/expectThrow')

contract('TILRoles', (addresses) => {
  const [owner, user1, user2] = addresses

  let roles

  beforeEach(async () => {
    roles = await TILRoles.new()
  })

  describe('hasRole', () => {
    it('should be false if no role added', async () => {
      assert.equal(await roles.hasRole(owner, 0), false)
    })

    it('should be true if the role was added', async () => {
      await roles.setRole(owner, 0, true)
      assert.equal(await roles.hasRole(owner, 0), true)
    })
  })

  describe('setRole', () => {
    it('should not allow anyone to set a role', async () => {
      expectThrow(async () => {
        return roles.setRole(user1, 1, true, { from: user1 })
      })
    })

    it('should set a role', async () => {
      await roles.setRole(user2, 1, true)
      assert.equal(await roles.hasRole(user2, 1), true)
    })
  })
})
