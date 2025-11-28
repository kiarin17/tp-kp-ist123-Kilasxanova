import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

const Profile = () => {
  const [user, setUser] = useState(null);
  const navigate = useNavigate();

  useEffect(() => {
    const userData = localStorage.getItem('user');
    if (!userData) {
      navigate('/login');
      return;
    }
    setUser(JSON.parse(userData));
  }, [navigate]);

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    navigate('/');
  };

  if (!user) {
    return <div style={styles.loading}>Загрузка...</div>;
  }

  return (
    <div style={styles.container}>
      <div style={styles.header}>
        <h1>Личный кабинет</h1>
        <button onClick={handleLogout} style={styles.logoutBtn}>
          Выйти
        </button>
      </div>

      <div style={styles.info}>
        <div style={styles.card}>
          <h2>Данные профиля</h2>
          <div style={styles.details}>
            <p><strong>Имя:</strong> {user.firstName} {user.lastName}</p>
            <p><strong>Email:</strong> {user.email}</p>
            <p><strong>Телефон:</strong> {user.phoneNumber}</p>
            <p><strong>Роль:</strong> {user.role === 'Client' ? 'Клиент' : user.role}</p>
          </div>
        </div>
      </div>
    </div>
  );
};

const styles = {
  container: {
    minHeight: '100vh',
    background: '#f5f5f5',
    padding: '20px'
  },
  header: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: '30px'
  },
  logoutBtn: {
    background: '#780505',
    color: 'white',
    border: 'none',
    padding: '10px 20px',
    borderRadius: '5px',
    cursor: 'pointer'
  },
  info: {
    maxWidth: '600px',
    margin: '0 auto'
  },
  card: {
    background: 'white',
    padding: '30px',
    borderRadius: '10px',
    boxShadow: '0 2px 10px rgba(0,0,0,0.1)'
  },
  details: {
    lineHeight: '1.6'
  },
  loading: {
    textAlign: 'center',
    padding: '50px',
    fontSize: '1.2rem'
  }
};

export default Profile;