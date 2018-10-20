import React from 'react'
import classnames from 'classnames'
import PropTypes from 'prop-types'

export const Modal = ({ children, closeModal, modalState }) => {
  return (
    <div className={classnames('modal', { 'is-active': modalState })}>
      <div className="modal-background" onClick={closeModal} />
      <div className="modal-content">
        {children}
      </div>
    </div>
  )
}

Modal.propTypes = {
  closeModal: PropTypes.func.isRequired,
  modalState: PropTypes.bool.isRequired
}
