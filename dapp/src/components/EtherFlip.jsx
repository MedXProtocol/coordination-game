import React, {
  Component
} from 'react'
import PropTypes from 'prop-types'
import { connect } from 'react-redux'
import {
  cacheCall,
  cacheCallValue,
  withSaga,
  contractByName
} from 'saga-genesis'
import { etherWeiToUsdWei } from '~/utils/etherWeiToUsdWei'
import { displayWeiToUsd } from '~/utils/displayWeiToUsd'
import { Ether } from './Ether'

function mapStateToProps(state) {
  const CoordinationGame = contractByName(state, 'CoordinationGame')
  return {
    usdWeiPerEther: cacheCallValue(state, CoordinationGame, 'usdWeiPerEther'),
    CoordinationGame
  }
}

function* etherFlipSaga({ CoordinationGame }) {
  if (!CoordinationGame) { return }

  yield cacheCall(CoordinationGame, 'usdWeiPerEther')
}

export const EtherFlip = connect(mapStateToProps)(
  withSaga(etherFlipSaga)(
    class _EtherFlip extends Component {
      static propTypes = {
        wei: PropTypes.any.isRequired,
        noToggle: PropTypes.bool
      }

      static defaultProps = {
        wei: '0',
        usdWeiPerEther: '1',
        noToggle: false
      }

      constructor (props) {
        super(props)
        this.state = {
          showUsd: false
        }
      }

      onFlip = () => {
        this.setState({showUsd: !this.state.showUsd})
      }

      render () {
        const wei = this.props.wei || 0

        const usd = <span className='currency'>${displayWeiToUsd(etherWeiToUsdWei(wei, this.props.usdWeiPerEther))} USD</span>
        const ether = <Ether wei={wei} />

        let firstValue = ether
        let secondValue = usd

        if (this.state.showUsd) {
          firstValue = usd
          secondValue = ether
        }

        if (!this.props.noToggle) {
           var extraProps = {
             onClick: this.onFlip
           }
        }

        return (
          <span className='ether-flip flip-link' {...extraProps}>
            <span className='ether-flip--first-value'>{firstValue}</span>&nbsp;&nbsp;&nbsp;
            <span className='ether-flip--second-value'>{secondValue}</span>
          </span>
        )
      }
    }
  )
)
