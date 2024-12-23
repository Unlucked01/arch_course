import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';

function LoginPage({ token, setToken }) {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const navigate = useNavigate();

  const handleLogin = async () => {
    const formData = new URLSearchParams();
    formData.append('username', username);
    formData.append('password', password);

    const resp = await fetch('http://127.0.0.1:8000/auth/login', {
      method: 'POST',
      headers: {'Content-Type':'application/x-www-form-urlencoded'},
      body: formData
    });
    const data = await resp.json();
    if(resp.ok) {
      setToken(data.access_token);
      navigate('/admin');
    } else {
      alert(data.detail || 'Login failed');
    }
  };

  return (
    <div className="container mt-5" style={{ maxWidth: '600px' }}>
      <div className="card p-3">
        <h2 style={{ textAlign: 'center' }}>{'Войти'}</h2>
        <div className="mb-4">
          <input className="form-control" placeholder={"Имя пользователя"} value={username} onChange={e=>setUsername(e.target.value)} />
        </div>
        <div className="mb-4">
          <input className="form-control" placeholder={"Пароль"} type="password" value={password} onChange={e=>setPassword(e.target.value)} />
        </div>

          <>
            <button className="btn btn-success" onClick={handleLogin}>Войти</button>
          </>
      </div>
    </div>
  );
}

export default LoginPage;
