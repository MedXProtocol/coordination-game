import React from 'react'
import classnames from 'classnames'
import PropTypes from 'prop-types'
import CustomScroll from 'react-custom-scroll'

export const Modal = ({ children, closeModal, modalState, modalCssClass }) => {
  return (
    <div className={classnames('modal', modalCssClass || '', { 'is-active': modalState })}>
      <div className="modal-background" onClick={closeModal} />

      <CustomScroll>
        <div className="modal-content">
          <div className="modal-content--inner">
            {children}
          </div>
        </div>
      </CustomScroll>
    </div>
  )
}

Modal.propTypes = {
  closeModal: PropTypes.func.isRequired,
  modalState: PropTypes.bool.isRequired
}
