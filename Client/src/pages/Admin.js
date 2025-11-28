import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import '../styles/admin.css';

const Admin = () => {
  const [user, setUser] = useState(null);
  const [stats, setStats] = useState({});
  const [orders, setOrders] = useState([]);
  const [users, setUsers] = useState([]);
  const [activeTab, setActiveTab] = useState('dashboard');
  const navigate = useNavigate();

  useEffect(() => {
    const userData = localStorage.getItem('user');
    const token = localStorage.getItem('token');
    
    if (!userData || !token) {
      navigate('/login');
      return;
    }

    const userObj = JSON.parse(userData);
    if (userObj.role !== 'Admin') {
      navigate('/');
      return;
    }

    setUser(userObj);
    fetchAdminData(token);
  }, [navigate]);

  const fetchAdminData = async (token) => {
    try {
      const [statsRes, ordersRes, usersRes] = await Promise.all([
        axios.get('http://localhost:5110/api/admin/dashboard', {
          headers: { Authorization: `Bearer ${token}` }
        }),
        axios.get('http://localhost:5110/api/admin/orders', {
          headers: { Authorization: `Bearer ${token}` }
        }),
        axios.get('http://localhost:5110/api/admin/users', {
          headers: { Authorization: `Bearer ${token}` }
        })
      ]);

      setStats(statsRes.data);
      setOrders(ordersRes.data);
      setUsers(usersRes.data);
    } catch (error) {
      console.error('Ошибка загрузки данных:', error);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    navigate('/');
  };

  if (!user) {
    return <div className="loading">Загрузка...</div>;
  }

  return (
    <div className="admin-container">
      <div className="admin-header">
        <h1>Админ-панель</h1>
        <div className="admin-user">
          <span>Администратор: {user.firstName} {user.lastName}</span>
          <button onClick={handleLogout} className="logout-btn">Выйти</button>
        </div>
      </div>

      <div className="admin-tabs">
        <button 
          className={`tab-btn ${activeTab === 'dashboard' ? 'active' : ''}`}
          onClick={() => setActiveTab('dashboard')}
        >
          📊 Дашборд
        </button>
        <button 
          className={`tab-btn ${activeTab === 'orders' ? 'active' : ''}`}
          onClick={() => setActiveTab('orders')}
        >
          🛒 Заказы
        </button>
        <button 
          className={`tab-btn ${activeTab === 'users' ? 'active' : ''}`}
          onClick={() => setActiveTab('users')}
        >
          👥 Пользователи
        </button>
        <button 
          className={`tab-btn ${activeTab === 'menu' ? 'active' : ''}`}
          onClick={() => navigate('/menu')}
        >
          🍽️ Управление меню
        </button>
      </div>

      <div className="admin-content">
        {activeTab === 'dashboard' && (
          <div className="dashboard">
            <h2>Статистика</h2>
            <div className="stats-grid">
              <div className="stat-card">
                <h3>Всего заказов</h3>
                <span className="stat-number">{stats.orders?.total || 0}</span>
              </div>
              <div className="stat-card">
                <h3>Ожидают подтверждения</h3>
                <span className="stat-number">{stats.orders?.pending || 0}</span>
              </div>
              <div className="stat-card">
                <h3>Заказов сегодня</h3>
                <span className="stat-number">{stats.orders?.today || 0}</span>
              </div>
              <div className="stat-card">
                <h3>Выручка сегодня</h3>
                <span className="stat-number">{stats.revenue?.today || 0} ₽</span>
              </div>
              <div className="stat-card">
                <h3>Всего пользователей</h3>
                <span className="stat-number">{stats.users?.total || 0}</span>
              </div>
              <div className="stat-card">
                <h3>Свободных курьеров</h3>
                <span className="stat-number">{stats.users?.availableCouriers || 0}</span>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'orders' && (
          <div className="orders-section">
            <h2>Управление заказами</h2>
            <div className="orders-list">
              {orders.map(order => (
                <div key={order.id} className="order-card">
                  <div className="order-header">
                    <span className="order-id">Заказ #{order.id}</span>
                    <span className={`order-status status-${order.status.toLowerCase()}`}>
                      {getStatusText(order.status)}
                    </span>
                  </div>
                  <div className="order-info">
                    <p><strong>Клиент:</strong> {order.customerName}</p>
                    <p><strong>Телефон:</strong> {order.customerPhone}</p>
                    <p><strong>Адрес:</strong> {order.deliveryAddress}</p>
                    <p><strong>Сумма:</strong> {order.totalAmount} ₽</p>
                    <p><strong>Товаров:</strong> {order.itemsCount}</p>
                    <p><strong>Дата:</strong> {new Date(order.createdAt).toLocaleString()}</p>
                  </div>
                  <div className="order-actions">
                    <button className="btn-primary">Подробнее</button>
                    <button className="btn-secondary">Изменить статус</button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {activeTab === 'users' && (
          <div className="users-section">
            <h2>Пользователи системы</h2>
            <div className="users-table">
              <table>
                <thead>
                  <tr>
                    <th>ID</th>
                    <th>Имя</th>
                    <th>Email</th>
                    <th>Роль</th>
                    <th>Телефон</th>
                    <th>Дата регистрации</th>
                  </tr>
                </thead>
                <tbody>
                  {users.map(user => (
                    <tr key={user.id}>
                      <td>{user.id}</td>
                      <td>{user.firstName} {user.lastName}</td>
                      <td>{user.email}</td>
                      <td>
                        <span className={`role-badge role-${user.role.toLowerCase()}`}>
                          {getRoleText(user.role)}
                        </span>
                      </td>
                      <td>{user.phoneNumber}</td>
                      <td>{new Date(user.createdAt).toLocaleDateString()}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

const getStatusText = (status) => {
  const statusMap = {
    'Pending': 'Ожидание',
    'Confirmed': 'Подтвержден',
    'Cooking': 'Готовится',
    'AssignedToCourier': 'Курьер назначен',
    'OnTheWay': 'В пути',
    'Delivered': 'Доставлен',
    'Cancelled': 'Отменен'
  };
  return statusMap[status] || status;
};

const getRoleText = (role) => {
  const roleMap = {
    'Admin': 'Администратор',
    'Courier': 'Курьер',
    'Client': 'Клиент'
  };
  return roleMap[role] || role;
};

export default Admin;