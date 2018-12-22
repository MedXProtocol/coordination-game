import { mailtoCsvLink } from '../mailtoCsvLink'

describe('mailtoCsvLink', () => {

  const GOOD_RESULT = "mailto:?subject=Test CSV&body=AppId#, Hint, Random#, Secret%0D%0Ahello, there, code, reviewer%0D%0Ahow, be, you, today?%0D%0Atest@this, 0x001, nice, stuff.0,yes"

  it('provides the correct mailto link with an array of entries', () => {
    const data = [
      ['hello', 'there', 'code', 'reviewer'],
      ['how', 'be', 'you', 'today?'],
      ['test@this', '0x001', 'nice', 'stuff.0,yes']
    ]

    expect(
      mailtoCsvLink(
				'Test CSV',
				["AppId#", "Hint", "Random#", "Secret"],
				data
			)
    ).toEqual(
      GOOD_RESULT
    )
  })

  it('returns correct link when array of objects passed in', () => {
    const data = [
      { appId: 'hello', hint: 'there', random: 'code', secret: 'reviewer' },
      { appId: 'how', hint: 'be', random: 'you', secret: 'today?' },
      { appId: 'test@this', hint: '0x001', random: 'nice', secret: 'stuff.0,yes' }
    ]

    expect(
      mailtoCsvLink(
				'Test CSV',
				["AppId#", "Hint", "Random#", "Secret"],
				data
			)
    ).toEqual(
      GOOD_RESULT
    )
  })

  it('still provides a link without a header row or title', () => {
    const data = [
      [ 'the', 'rain', 'in', 'spain' ]
    ]

    expect(
      mailtoCsvLink(
				'',
				[],
				data
			)
    ).toEqual(
      "mailto:?subject=&body=%0D%0Athe, rain, in, spain"
    )
  })
})
