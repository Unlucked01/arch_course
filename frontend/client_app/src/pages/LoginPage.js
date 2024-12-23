import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';

function LoginPage({ token, setToken }) {
  const [showRegister, setShowRegister] = useState(false);
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const navigate = useNavigate();

  const handleRegister = async () => {
    const resp = await fetch('http://127.0.0.1:8000/auth/register', {
      method: 'POST',
      headers: {'Content-Type':'application/json'},
      body: JSON.stringify({username, password})
    });
    if(resp.ok) {
      alert("Успешно зарегистрирован!");
      setShowRegister(false);
    } else {
      const data = await resp.json();
      alert(data.detail || 'Ошибка регистрации');
    }
  };

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
      navigate('/flights');
    } else {
      alert(data.detail || 'Login failed');
    }
  };

  return (
    <div className="container mt-5" style={{ maxWidth: '600px' }}>
      <div className="card p-3">
        <h2 style={{ textAlign: 'center' }}>{showRegister ? 'Зарегистрироваться' : 'Войти'}</h2>
        <div className="mb-4">
          <input className="form-control" placeholder={"Имя пользователя"} value={username} onChange={e=>setUsername(e.target.value)} />
        </div>
        <div className="mb-4">
          <input className="form-control" placeholder={"Пароль"} type="password" value={password} onChange={e=>setPassword(e.target.value)} />
        </div>
        {showRegister ? (
          <>
            <button className="btn btn-primary" onClick={handleRegister}>Зарегистрироваться</button>
            <button className="btn btn-link" onClick={()=>setShowRegister(false)}>Уже есть аккаунт? Войти</button>
          </>
        ) : (
          <>
            <button className="btn btn-success" onClick={handleLogin}>Войти</button>
            <button className="btn btn-link" onClick={()=>setShowRegister(true)}>Нет аккаунта? Зарегистрироваться</button>
          </>
        )}
      </div>
    </div>
  );
}

export default LoginPage;
