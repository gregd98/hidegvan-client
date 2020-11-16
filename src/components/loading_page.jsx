import React from 'react';

const LoadingPage = () => (
  <div className="d-flex justify-content-center mt-4">
    <div className="spinner-border" role="status" style={{ color: '#80DEEA' }}>
      <span className="sr-only">Loading...</span>
    </div>
  </div>
);

export default LoadingPage;
