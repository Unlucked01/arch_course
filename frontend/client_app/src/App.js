import React, { useState } from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import LoginPage from './pages/LoginPage';
import FlightsPage from './pages/FlightsPage';
import BookedTickets from "./components/BookedTickets";
import OrderHistory from "./components/OrderHistory";

function App() {
  const [token, setToken] = useState(null);

  return (
    <Router>
      <Routes>
        <Route path="/" element={<LoginPage token={token} setToken={setToken} />} />
        <Route path="/flights" element={<FlightsPage token={token} />} />
        <Route path="/tickets" element={<BookedTickets token={token} />} />
        <Route path="/orders" element={<OrderHistory token={token} />} />
      </Routes>
    </Router>
  );
}

export default App;
