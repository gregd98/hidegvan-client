import React from 'react';

const classNames = require('classnames');

export const ConfirmationDialog = (input) => {
  const {
    id, text, btnText, btnHandler, errorMessage, isLoading,
  } = input;
  let { btnType } = input;
  if (!btnType) {
    btnType = 'primary';
  }
  const classes = classNames({
    btn: true,
    [`btn-${btnType}`]: true,
  });

  return (
    <div className="modal fade" id={id} data-keyboard="false" tabIndex="-1">
      <div className="modal-dialog">
        <div className="modal-content darkBg">
          <div className="modal-body">
            <p className="text-light" style={{ fontSize: '1.25rem' }}>{text}</p>
            <div>
              <button onClick={btnHandler} type="button" className={classes} disabled={isLoading}>
                {isLoading && <span className="spinner-border spinner-border-sm mr-2" role="status" aria-hidden="true" />}
                {btnText}
              </button>
              <button type="button" className="btn btn-outline-light ml-2" data-dismiss="modal">Cancel</button>
            </div>
            {errorMessage && <div className="alert alert-danger mt-4 mb-0" role="alert">{errorMessage}</div>}
          </div>
        </div>
      </div>
    </div>
  );
};

export const MessageDialog = (input) => {
  const { id, text } = input;

  return (
    <div className="modal fade" id={id} data-keyboard="false" tabIndex="-1">
      <div className="modal-dialog">
        <div className="modal-content darkBg">
          <div className="modal-body">
            <p className="text-light" style={{ fontSize: '1.25rem' }}>{text}</p>
            <div>
              <button type="button" className="btn btn-outline-light ml-2" data-dismiss="modal">OK</button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
