import React from 'react';
import { useNavigate } from 'react-router-dom';

function NavigationButtons() {
  const navigate = useNavigate();

  return (
    <div className="d-flex justify-content-start mb-2">
      {/* Navigation Button: Home */}
      <button
        className="btn btn-light me-2"
        style={{ width: '40px', height: '40px' }}
        onClick={() => navigate('/')}
      >
        {/* Replace this placeholder with your Home icon */}
        🏠
      </button>

      {/* Navigation Button: Flights */}
      <button
        className="btn btn-light me-2"
        style={{ width: '40px', height: '40px' }}
        onClick={() => navigate('/flights')}
      >
        {/* Replace this placeholder with your Flights icon */}
        ✈️
      </button>

      {/* Navigation Button: Booked Tickets */}
      <button
        className="btn btn-light me-2"
        style={{ width: '40px', height: '40px' }}
        onClick={() => navigate('/tickets')}
      >
        {/* Replace this placeholder with your Tickets icon */}
        🎟️
      </button>

      {/* Navigation Button: Orders */}
      <button
        className="btn btn-light"
        style={{ width: '40px', height: '40px' }}
        onClick={() => navigate('/orders')}
      >
        {/* Replace this placeholder with your Orders icon */}
        📦
      </button>
    </div>
  );
}

export default NavigationButtons;
