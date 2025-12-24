import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import '../styles/courier.css';

const Courier = () => {
  const [user, setUser] = useState(null);
  const [stats, setStats] = useState({});
  const [myOrders, setMyOrders] = useState([]);
  const [availableOrders, setAvailableOrders] = useState([]);
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
    if (userObj.role !== 'Courier') {
      navigate('/');
      return;
    }

    setUser(userObj);
    fetchCourierData(token);
  }, [navigate]);

  const fetchCourierData = async (token) => {
    try {
      const [statsRes, myOrdersRes, availableOrdersRes] = await Promise.all([
        axios.get('http://localhost:5110/api/courier/dashboard', {
          headers: { Authorization: `Bearer ${token}` }
        }),
        axios.get('http://localhost:5110/api/courier/orders', {
          headers: { Authorization: `Bearer ${token}` }
        }),
        axios.get('http://localhost:5110/api/courier/available-orders', {
          headers: { Authorization: `Bearer ${token}` }
        })
      ]);

      setStats(statsRes.data);
      setMyOrders(myOrdersRes.data);
      setAvailableOrders(availableOrdersRes.data);
    } catch (error) {
      console.error('Ошибка загрузки данных:', error);
    }
  };

  const takeOrder = async (orderId) => {
    try {
      const token = localStorage.getItem('token');
      await axios.put(`http://localhost:5110/api/courier/take-order/${orderId}`, {}, {
        headers: { Authorization: `Bearer ${token}` }
      });
      fetchCourierData(token); 
    } catch (error) {
      console.error('Ошибка принятия заказа:', error);
    }
  };

  const startDelivery = async (orderId) => {
    try {
      const token = localStorage.getItem('token');
      await axios.put(`http://localhost:5110/api/courier/start-delivery/${orderId}`, {}, {
        headers: { Authorization: `Bearer ${token}` }
      });
      fetchCourierData(token);
    } catch (error) {
      console.error('Ошибка начала доставки:', error);
    }
  };

  const completeDelivery = async (orderId) => {
    try {
      const token = localStorage.getItem('token');
      await axios.put(`http://localhost:5110/api/courier/complete-delivery/${orderId}`, {}, {
        headers: { Authorization: `Bearer ${token}` }
      });
      fetchCourierData(token);
    } catch (error) {
      console.error('Ошибка завершения доставки:', error);
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
    <div className="courier-container">
      <div className="courier-header">
        <h1>Кабинет курьера</h1>
        <div className="courier-user">
          <span>Курьер: {user.firstName} {user.lastName}</span>
          <span>Транспорт: {user.vehicleType} ({user.vehiclePlate})</span>
          <button onClick={handleLogout} className="logout-btn">Выйти</button>
        </div>
      </div>

      <div className="courier-tabs">
        <button 
          className={`tab-btn ${activeTab === 'dashboard' ? 'active' : ''}`}
          onClick={() => setActiveTab('dashboard')}
        >
          Обзор
        </button>
        <button 
          className={`tab-btn ${activeTab === 'my-orders' ? 'active' : ''}`}
          onClick={() => setActiveTab('my-orders')}
        >
          Мои заказы
        </button>
        <button 
          className={`tab-btn ${activeTab === 'available' ? 'active' : ''}`}
          onClick={() => setActiveTab('available')}
        >
          Доступные заказы
        </button>
        <button 
          className={`tab-btn ${activeTab === 'earnings' ? 'active' : ''}`}
          onClick={() => setActiveTab('earnings')}
        >
          Заработок
        </button>
      </div>

      <div className="courier-content">
        {activeTab === 'dashboard' && (
          <div className="dashboard">
            <h3>Моя статистика</h3>
            {stats.Stats && (
              <div className="stats-grid">
                <div className="stat-card">
                  <h3>Всего доставок</h3>
                  <span className="stat-number">{stats.Stats.totalOrders || 0}</span>
                </div>
                <div className="stat-card">
                  <h3>Доставок сегодня</h3>
                  <span className="stat-number">{stats.Stats.todayOrders || 0}</span>
                </div>
                <div className="stat-card">
                  <h3>Активных заказов</h3>
                  <span className="stat-number">{stats.Stats.activeOrders || 0}</span>
                </div>
                <div className="stat-card">
                  <h3>Заработок сегодня</h3>
                  <span className="stat-number">{stats.Stats.totalEarnings || 0} ₽</span>
                </div>
              </div>
            )}
          </div>
        )}

        {activeTab === 'my-orders' && (
          <div className="my-orders-section">
            <h3>Мои текущие заказы</h3>
            <div className="orders-list">
              {myOrders.map(order => (
                <div key={order.id} className="order-card">
                  <div className="order-header">
                    <span className="order-id">Заказ #{order.id}</span>
                    <span className={`order-status status-${order.status.toLowerCase()}`}>
                      {getStatusText(order.status)}
                    </span>
                  </div>
                  <div className="order-info">
                    <p><strong>Клиент:</strong> {order.customerName}</p>
                    <p><strong>Адрес:</strong> {order.deliveryAddress}</p>
                    <p><strong>Телефон:</strong> {order.customerPhone}</p>
                    <p><strong>Сумма:</strong> {order.totalAmount} ₽</p>
                    {order.specialInstructions && (
                      <p><strong>Примечание:</strong> {order.specialInstructions}</p>
                    )}
                  </div>
                  <div className="order-actions">
                    {order.canStartDelivery && (
                      <button 
                        className="btn-primary"
                        onClick={() => startDelivery(order.id)}
                      >
                        Начать доставку
                      </button>
                    )}
                    {order.canCompleteDelivery && (
                      <button 
                        className="btn-success"
                        onClick={() => completeDelivery(order.id)}
                      >
                        Завершить доставку
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {activeTab === 'available' && (
          <div className="available-orders-section">
            <h3>Доступные заказы</h3>
            <div className="orders-list">
              {availableOrders.map(order => (
                <div key={order.id} className="order-card available">
                  <div className="order-header">
                    <span className="order-id">Заказ #{order.id}</span>
                    <span className="order-status status-pending">Доступен</span>
                  </div>
                  <div className="order-info">
                    <p><strong>Клиент:</strong> {order.customerName}</p>
                    <p><strong>Адрес:</strong> {order.deliveryAddress}</p>
                    <p><strong>Сумма:</strong> {order.totalAmount} ₽</p>
                    <p><strong>Время приготовления:</strong> ~{order.estimatedPreparationTime} мин</p>
                  </div>
                  <div className="order-actions">
                    <button 
                      className="btn-primary"
                      onClick={() => takeOrder(order.id)}
                    >
                      Принять заказ
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {activeTab === 'earnings' && (
          <div className="earnings-section">
            <h3>Мой заработок</h3>
            <p>Здесь будет статистика по заработку за разные периоды</p>
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
    'AssignedToCourier': 'Назначен вам',
    'OnTheWay': 'В пути',
    'Delivered': 'Доставлен',
    'Cancelled': 'Отменен'
  };
  return statusMap[status] || status;
};

export default Courier;