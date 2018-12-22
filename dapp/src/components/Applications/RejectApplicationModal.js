import React from 'react'
import { Modal } from '~/components/Modals/Modal'

export default function ({ handleCloseModal, modalState, onConfirm }) {
  return (
    <Modal
      closeModal={handleCloseModal}
      modalState={modalState}
      title="Confirm Rejection"
    >
      <div className='has-text-centered'>
        <h3 className="is-size-3">
          Are you sure you want to reject the application?
        </h3>

        <p>
          This will immediately reject the application.  Once the applicant submits their secret, the
          application will be challenged immediately.
        </p>

        <p>
          <br />
          <button
            onClick={handleCloseModal}
            className="button is-primary is-outlined"
          >
            Cancel
          </button>
          <span className="is-hidden-touch">
            &nbsp;
            &nbsp;
          </span>
          <br className="is-hidden-desktop" />
          <br className="is-hidden-desktop" />
          <button
            onClick={onConfirm}
            className="button is-danger is-outlined"
          >
            Reject Application
          </button>
        </p>
      </div>
    </Modal>
  )
}
