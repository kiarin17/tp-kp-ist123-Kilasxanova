// CourierDashboard.js
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import '../styles/courier.css';

const API_BASE_URL = 'http://localhost:5110/api';

const CourierDashboard = () => {
  const [user, setUser] = useState(null);
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [refreshInterval, setRefreshInterval] = useState(null);
  const navigate = useNavigate();

  // Проверка авторизации
  useEffect(() => {
    const checkAuth = async () => {
      const userData = localStorage.getItem('user');
      const token = localStorage.getItem('token');
      
      if (!userData || !token) {
        navigate('/login');
        return;
      }

      try {
        const userObj = JSON.parse(userData);
        
        if (userObj.role !== 'Courier') {
          navigate('/login');
          return;
        }
        
        setUser(userObj);
        loadOrders();
        
        // Автообновление каждые 10 секунд
        const interval = setInterval(loadOrders, 10000);
        setRefreshInterval(interval);
        
      } catch (error) {
        console.error('Ошибка авторизации:', error);
        navigate('/login');
      }
    };

    checkAuth();

    // Очистка интервала при размонтировании
    return () => {
      if (refreshInterval) {
        clearInterval(refreshInterval);
      }
    };
  }, [navigate]);

  // Загрузка заказов
  const loadOrders = async () => {
    try {
      const token = localStorage.getItem('token');
      
      // Загружаем все заказы, доступные курьеру
      const response = await axios.get(`${API_BASE_URL}/orders/available`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });
      
      setOrders(response.data || []);
      
    } catch (error) {
      console.error('Ошибка загрузки заказов:', error);
      
      // Если endpoint не работает, 
      if (error.response?.status === 404) {
        console.log('Используем данные');
        setOrders(getMockOrders());
      } else {
        setError('Ошибка загрузки заказов');
      }
    } finally {
      setLoading(false);
    }
  };

  // данные для демонстрации
  const getMockOrders = () => {
    return [
      {
        id: 1001,
        orderNumber: '#1001',
        customerName: 'Иван Иванов',
        customerPhone: '+7 (999) 123-45-67',
        deliveryAddress: 'ул. Ленина, д. 10, кв. 5',
        totalAmount: 1499.99,
        status: 'Confirmed',
        createdAt: new Date().toISOString(),
        items: [
          { name: 'Пицца Пепперони', quantity: 1, price: 850 },
          { name: 'Кола', quantity: 2, price: 150 }
        ]
      },
      {
        id: 1002,
        orderNumber: '#1002',
        customerName: 'Мария Петрова',
        customerPhone: '+7 (999) 987-65-43',
        deliveryAddress: 'ул. Мира, д. 25, кв. 12',
        totalAmount: 2350.50,
        status: 'Cooking',
        createdAt: new Date(Date.now() - 3600000).toISOString(),
        items: [
          { name: 'Бургер', quantity: 2, price: 450 },
          { name: 'Картофель фри', quantity: 1, price: 250 },
          { name: 'Чай', quantity: 2, price: 100 }
        ]
      },
      {
        id: 1003,
        orderNumber: '#1003',
        customerName: 'Алексей Смирнов',
        customerPhone: '+7 (999) 555-44-33',
        deliveryAddress: 'ул. Советская, д. 5, кв. 8',
        totalAmount: 3200.00,
        status: 'ReadyForDelivery',
        createdAt: new Date(Date.now() - 7200000).toISOString(),
        items: [
          { name: 'Суши сет', quantity: 1, price: 2500 },
          { name: 'Салат Цезарь', quantity: 1, price: 450 },
          { name: 'Вода', quantity: 2, price: 100 }
        ]
      }
    ];
  };

  // Принять заказ
  const acceptOrder = async (orderId) => {
    if (!window.confirm('Принять этот заказ на доставку?')) return;
    
    try {
      const token = localStorage.getItem('token');
      
      // Обновляем статус заказа
      await axios.put(`${API_BASE_URL}/orders/${orderId}/assign`, {
        courierId: user.id,
        status: 'AssignedToCourier'
      }, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });
      
      // Обновляем список заказов
      loadOrders();
      alert('Заказ принят на доставку!');
      
    } catch (error) {
      console.error('Ошибка принятия заказа:', error);
      
      // Демо-режим: обновляем локально
      setOrders(prevOrders => 
        prevOrders.map(order => 
          order.id === orderId 
            ? { ...order, status: 'AssignedToCourier', courierName: user.name } 
            : order
        )
      );
      alert('Заказ принят на доставку (демо-режим)');
    }
  };

  // Начать доставку
  const startDelivery = async (orderId) => {
    if (!window.confirm('Начать доставку этого заказа?')) return;
    
    try {
      const token = localStorage.getItem('token');
      
      await axios.put(`${API_BASE_URL}/orders/${orderId}/status`, {
        status: 'OnTheWay'
      }, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });
      
      loadOrders();
      alert('Доставка начата!');
      
    } catch (error) {
      console.error('Ошибка:', error);
      
      // Демо-режим
      setOrders(prevOrders => 
        prevOrders.map(order => 
          order.id === orderId 
            ? { ...order, status: 'OnTheWay' } 
            : order
        )
      );
      alert('Доставка начата (демо-режим)');
    }
  };

  // Завершить доставку
  const completeDelivery = async (orderId) => {
    if (!window.confirm('Завершить доставку этого заказа?')) return;
    
    try {
      const token = localStorage.getItem('token');
      
      await axios.put(`${API_BASE_URL}/orders/${orderId}/status`, {
        status: 'Delivered'
      }, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });
      
      loadOrders();
      alert('Доставка завершена!');
      
    } catch (error) {
      console.error('Ошибка:', error);
      
      // Демо-режим
      setOrders(prevOrders => 
        prevOrders.filter(order => order.id !== orderId)
      );
      alert('Доставка завершена (демо-режим)');
    }
  };

  // Получить текст статуса
  const getStatusText = (status) => {
    const statusMap = {
      'Pending': 'Ожидает',
      'Confirmed': 'Подтвержден',
      'Cooking': 'Готовится',
      'ReadyForDelivery': 'Готов к доставке',
      'AssignedToCourier': 'Назначен курьеру',
      'OnTheWay': 'В пути',
      'Delivered': 'Доставлен',
      'Cancelled': 'Отменен'
    };
    return statusMap[status] || status;
  };

  // Получить цвет статуса
  const getStatusColor = (status) => {
    const colors = {
      'Pending': '#ff9800',
      'Confirmed': '#2196f3',
      'Cooking': '#ff5722',
      'ReadyForDelivery': '#9c27b0',
      'AssignedToCourier': '#3f51b5',
      'OnTheWay': '#673ab7',
      'Delivered': '#4caf50',
      'Cancelled': '#f44336'
    };
    return colors[status] || '#666';
  };

  // Выйти из системы
  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    navigate('/login');
  };

  // Обновить вручную
  const handleRefresh = () => {
    setLoading(true);
    loadOrders();
  };

  if (loading) {
    return (
      <div className="courier-container">
        <div className="loading">
          <div className="spinner"></div>
          <p>Загрузка заказов...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="courier-container">
      {/* Шапка */}
      <div className="courier-header">
        <div className="header-content">
          <div className="header-left">
            <h1>Панель курьера</h1>
            <p>Добро пожаловать, {user?.name || 'Курьер'}!</p>
          </div>
          <div className="header-right">
            <button className="refresh-btn" onClick={handleRefresh}>
              Обновить
            </button>
            <button className="logout-btn" onClick={handleLogout}>
              Выйти
            </button>
          </div>
        </div>
      </div>

      {/* Сообщение об ошибке */}
      {error && (
        <div className="error-banner">
          <span className="error-icon">!</span>
          {error}
        </div>
      )}

      {/* Основной контент */}
      <div className="courier-content">
        <div className="stats">
          <div className="stat-card">
            <div className="stat-number">{orders.length}</div>
            <div className="stat-label">Всего заказов</div>
          </div>
          <div className="stat-card">
            <div className="stat-number">
              {orders.filter(o => o.status === 'ReadyForDelivery' || o.status === 'AssignedToCourier').length}
            </div>
            <div className="stat-label">Доступно для доставки</div>
          </div>
          <div className="stat-card">
            <div className="stat-number">
              {orders.filter(o => o.status === 'OnTheWay').length}
            </div>
            <div className="stat-label">В пути</div>
          </div>
        </div>

        <div className="orders-section">
          <h2>Доступные заказы</h2>
          <div className="orders-list">
            {orders.length === 0 ? (
              <div className="empty-orders">
                <p>Нет доступных заказов для доставки</p>
                <button onClick={handleRefresh}>Проверить снова</button>
              </div>
            ) : (
              orders.map(order => (
                <div key={order.id} className="order-card">
                  <div className="order-header">
                    <div className="order-info">
                      <div className="order-number">{order.orderNumber || `#${order.id}`}</div>
                      <div className="order-time">
                        {new Date(order.createdAt).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
                      </div>
                    </div>
                    <div className="order-status" style={{ backgroundColor: getStatusColor(order.status) }}>
                      {getStatusText(order.status)}
                    </div>
                  </div>

                  <div className="order-details">
                    <div className="detail-row">
                      <span className="detail-label">Клиент:</span>
                      <span className="detail-value">{order.customerName}</span>
                    </div>
                    <div className="detail-row">
                      <span className="detail-label">Телефон:</span>
                      <span className="detail-value">{order.customerPhone}</span>
                    </div>
                    <div className="detail-row">
                      <span className="detail-label">Адрес:</span>
                      <span className="detail-value">{order.deliveryAddress}</span>
                    </div>
                    <div className="detail-row">
                      <span className="detail-label">Сумма:</span>
                      <span className="detail-value total">{order.totalAmount} ₽</span>
                    </div>
                  </div>

                  {order.items && (
                    <div className="order-items">
                      <div className="items-title">Состав заказа:</div>
                      {order.items.map((item, index) => (
                        <div key={index} className="item-row">
                          <span>{item.quantity} × {item.name}</span>
                          <span>{item.price * item.quantity} ₽</span>
                        </div>
                      ))}
                    </div>
                  )}

                  <div className="order-actions">
                    {(order.status === 'ReadyForDelivery' || order.status === 'Confirmed') && (
                      <button 
                        className="action-btn accept"
                        onClick={() => acceptOrder(order.id)}
                      >
                        Принять заказ
                      </button>
                    )}
                    
                    {order.status === 'AssignedToCourier' && (
                      <button 
                        className="action-btn start"
                        onClick={() => startDelivery(order.id)}
                      >
                        Начать доставку
                      </button>
                    )}
                    
                    {order.status === 'OnTheWay' && (
                      <button 
                        className="action-btn complete"
                        onClick={() => completeDelivery(order.id)}
                      >
                        Завершить доставку
                      </button>
                    )}
                    
                    {order.status === 'Delivered' && (
                      <span className="completed-badge">Доставлен</span>
                    )}
                    
                    {order.status === 'Cancelled' && (
                      <span className="cancelled-badge">Отменен</span>
                    )}
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default CourierDashboard;