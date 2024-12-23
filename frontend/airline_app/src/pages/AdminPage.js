import React from 'react';
import AdminCities from '../components/AdminCities';
import AdminFlights from '../components/AdminFlights';
import { useNavigate } from 'react-router-dom';

function AdminPage({ token }) {
    const navigate = useNavigate();
    const handleRedirectOrders = () => {
    navigate('/order');
  };
  return (
      <div className="container" style={{position: 'relative'}}>
          <div
              style={{
                  position: 'absolute',
                  top: '10px',
                  right  : '10px',
                  width: '40px',
                  height: '40px',
                  cursor: 'pointer',
                  padding: 10
              }}
              onClick={handleRedirectOrders}
          >
              <svg xmlns="http://www.w3.org/2000/svg" width="40" height="40" viewBox="0 0 24 24" fill="none"
                   stroke="#000000" strokeWidth="2.5" strokeLinecap="square" strokeLinejoin="round">
                  <path d="M6 2L3 6v14c0 1.1.9 2 2 2h14a2 2 0 0 0 2-2V6l-3-4H6zM3.8 6h16.4M16 10a4 4 0 1 1-8 0"/>
              </svg>
          </div>

          <h2 style={{padding: 10}}>Управление рейсами и городами</h2>

          <div
              style={{
                  position: 'absolute',
                  top: 75,
                  right: 0,
                  width: '320px',
              }}
          >
              <AdminCities token={token}/>
          </div>

          <div style={{marginRight: '340px'}}>
              <AdminFlights token={token}/>
          </div>
      </div>
  );
}

export default AdminPage;
