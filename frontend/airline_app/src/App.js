import React, { useState } from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import LoginPage from './pages/LoginPage';
import AdminPage from "./pages/AdminPage";
import OrdersPage from "./pages/OrdersPage";

function App() {
  const [token, setToken] = useState(null);

  return (
    <Router>
      <Routes>
        <Route path="/" element={<LoginPage token={token} setToken={setToken} />} />
        <Route path="/admin" element={<AdminPage token={token} />} />
        <Route path="/order" element={<OrdersPage token={token} />} />
      </Routes>
    </Router>
  );
}

export default App;
