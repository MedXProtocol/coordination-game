import React from 'react'
import { LoadingLines } from '~/components/LoadingLines'

export const LoadingButton = props => (
  <button
    onClick={props.handleClick ? props.handleClick : null}
    type="submit"
    className="button is-outlined is-primary"
    disabled={props.isLoading}
  >
    {
      props.isLoading ? (
        <React.Fragment>
          {props.loadingText} <LoadingLines visible={true} />
        </React.Fragment>
      ) : (
        <React.Fragment>
          {props.initialText}
        </React.Fragment>
      )
    }
  </button>
)
