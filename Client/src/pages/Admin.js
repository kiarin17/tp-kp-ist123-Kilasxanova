import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import '../styles/admin.css';

const Admin = () => {
  const [user, setUser] = useState(null);
  const [stats, setStats] = useState({});
  const [orders, setOrders] = useState([]);
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
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
      setLoading(true);
      const [statsRes, ordersRes, usersRes] = await Promise.all([
        axios.get('http://localhost:5110/api/admin/dashboard', {
          headers: { Authorization: `Bearer ${token}` }
        }).catch(() => ({ data: { orders: {}, revenue: {}, users: {} } })),
        axios.get('http://localhost:5110/api/admin/orders', {
          headers: { Authorization: `Bearer ${token}` }
        }).catch(() => ({ data: [] })),
        axios.get('http://localhost:5110/api/admin/users', {
          headers: { Authorization: `Bearer ${token}` }
        }).catch(() => ({ data: [] }))
      ]);

      setStats(statsRes.data);
      setOrders(ordersRes.data);
      setUsers(usersRes.data);
    } catch (error) {
      console.error('Ошибка загрузки данных:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    navigate('/login');
  };

  const handleStatusChange = async (orderId, newStatus) => {
    try {
      const token = localStorage.getItem('token');
      await axios.patch(`http://localhost:5110/api/admin/orders/${orderId}/status`, 
        { status: newStatus },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      
      // Обновляем список заказов
      const ordersRes = await axios.get('http://localhost:5110/api/admin/orders', {
        headers: { Authorization: `Bearer ${token}` }
      });
      setOrders(ordersRes.data);
      
      // Показываем уведомление
      showNotification(`Статус заказа #${orderId} изменён на "${getStatusText(newStatus)}"`, 'success');
    } catch (error) {
      console.error('Ошибка обновления статуса:', error);
      showNotification('Ошибка обновления статуса', 'error');
    }
  };

  const showNotification = (message, type) => {
    // Создаем временное уведомление
    const notification = document.createElement('div');
    notification.className = `notification notification-${type}`;
    notification.textContent = message;
    notification.style.cssText = `
      position: fixed;
      top: 20px;
      right: 20px;
      padding: 16px 24px;
      background: ${type === 'success' ? '#38b000' : '#ef476f'};
      color: white;
      border-radius: 8px;
      box-shadow: 0 4px 12px rgba(0,0,0,0.15);
      z-index: 1000;
      animation: slideIn 0.3s ease-out;
    `;
    
    document.body.appendChild(notification);
    
    setTimeout(() => {
      notification.style.animation = 'slideOut 0.3s ease-out';
      setTimeout(() => {
        document.body.removeChild(notification);
      }, 300);
    }, 3000);
  };

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return new Intl.DateTimeFormat('ru-RU', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    }).format(date);
  };

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('ru-RU', {
      style: 'currency',
      currency: 'RUB',
      minimumFractionDigits: 0
    }).format(amount);
  };

  if (loading && !user) {
    return (
      <div className="loading-screen">
        <div className="loading-spinner"></div>
        <div className="loading-text">Загрузка админ-панели...</div>
      </div>
    );
  }

  if (!user) {
    return null;
  }

  return (
    <div className="admin-container">
      <style>{`
        @keyframes slideIn {
          from { transform: translateX(100%); opacity: 0; }
          to { transform: translateX(0); opacity: 1; }
        }
        @keyframes slideOut {
          from { transform: translateX(0); opacity: 1; }
          to { transform: translateX(100%); opacity: 0; }
        }
        .loading-screen {
          display: flex;
          flex-direction: column;
          justify-content: center;
          align-items: center;
          height: 100vh;
          background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
        }
        .loading-spinner {
          width: 50px;
          height: 50px;
          border: 3px solid rgba(255,255,255,0.3);
          border-radius: 50%;
          border-top-color: white;
          animation: spin 1s ease-in-out infinite;
          margin-bottom: 20px;
        }
        @keyframes spin {
          to { transform: rotate(360deg); }
        }
        .loading-text {
          color: white;
          font-size: 18px;
          font-weight: 500;
        }
      `}</style>

      {/* Шапка */}
      <div className="admin-header">
        <h1>
          <span className="header-icon">⚡</span>
          Админ-панель
        </h1>
        <div className="admin-user">
          <div className="user-info">
            <div className="user-name">
              {user.firstName} {user.lastName}
            </div>
            <div className="user-email">{user.email}</div>
          </div>
          <button onClick={handleLogout} className="logout-btn">
            <span className="logout-icon">↪</span>
            Выйти
          </button>
        </div>
      </div>

      {/* Навигационные вкладки */}
      <div className="admin-tabs">
        <button 
          className={`tab-btn ${activeTab === 'dashboard' ? 'active' : ''}`}
          onClick={() => setActiveTab('dashboard')}
        >
          <span className="tab-icon">📊</span>
          Дашборд
        </button>
        <button 
          className={`tab-btn ${activeTab === 'orders' ? 'active' : ''}`}
          onClick={() => setActiveTab('orders')}
        >
          <span className="tab-icon">🛒</span>
          Заказы
          {stats.orders?.pending > 0 && (
            <span className="tab-badge">{stats.orders.pending}</span>
          )}
        </button>
        <button 
          className={`tab-btn ${activeTab === 'users' ? 'active' : ''}`}
          onClick={() => setActiveTab('users')}
        >
          <span className="tab-icon">👥</span>
          Пользователи
          <span className="tab-badge">{stats.users?.total || 0}</span>
        </button>
        <button 
          className="tab-btn"
          onClick={() => navigate('/menu')}
        >
          <span className="tab-icon">🍽️</span>
          Управление меню
        </button>
      </div>

      {/* Основной контент */}
      <div className="admin-content">
        {activeTab === 'dashboard' && (
          <div className="dashboard">
            <div className="section-header">
              <h2>Обзор системы</h2>
              <button 
                className="refresh-btn"
                onClick={() => fetchAdminData(localStorage.getItem('token'))}
              >
                🔄 Обновить
              </button>
            </div>
            
            <div className="stats-grid">
              <div className="stat-card stat-primary">
                <div className="stat-icon">📈</div>
                <h3>Всего заказов</h3>
                <span className="stat-number">{stats.orders?.total || 0}</span>
                <div className="stat-trend">+12% за месяц</div>
              </div>
              
              <div className="stat-card stat-warning">
                <div className="stat-icon">⏳</div>
                <h3>Ожидают подтверждения</h3>
                <span className="stat-number">{stats.orders?.pending || 0}</span>
                <div className="stat-actions">
                  <button className="stat-btn">Просмотреть →</button>
                </div>
              </div>
              
              <div className="stat-card stat-success">
                <div className="stat-icon">📅</div>
                <h3>Заказов сегодня</h3>
                <span className="stat-number">{stats.orders?.today || 0}</span>
                <div className="stat-trend">Сегодня</div>
              </div>
              
              <div className="stat-card stat-revenue">
                <div className="stat-icon">💰</div>
                <h3>Выручка сегодня</h3>
                <span className="stat-number">{formatCurrency(stats.revenue?.today || 0)}</span>
                <div className="stat-trend">+8% к вчерашнему дню</div>
              </div>
              
              <div className="stat-card stat-users">
                <div className="stat-icon">👤</div>
                <h3>Всего пользователей</h3>
                <span className="stat-number">{stats.users?.total || 0}</span>
                <div className="stat-trend">+5 новых за неделю</div>
              </div>
              
              <div className="stat-card stat-couriers">
                <div className="stat-icon">🚴</div>
                <h3>Свободных курьеров</h3>
                <span className="stat-number">{stats.users?.availableCouriers || 0}</span>
                <div className="stat-trend">из {stats.users?.totalCouriers || 0} всего</div>
              </div>
            </div>

            {/* Быстрые действия */}
            <div className="quick-actions">
              <h3>Быстрые действия</h3>
              <div className="actions-grid">
                <button className="action-btn" onClick={() => navigate('/menu?add=true')}>
                  <span className="action-icon">➕</span>
                  Добавить блюдо
                </button>
                <button className="action-btn" onClick={() => setActiveTab('orders')}>
                  <span className="action-icon">📋</span>
                  Просмотреть заказы
                </button>
                <button className="action-btn" onClick={() => setActiveTab('users')}>
                  <span className="action-icon">👤</span>
                  Добавить пользователя
                </button>
                <button className="action-btn">
                  <span className="action-icon">📊</span>
                  Скачать отчёт
                </button>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'orders' && (
          <div className="orders-section">
            <div className="section-header">
              <h2>Управление заказами</h2>
              <div className="order-filters">
                <select className="filter-select">
                  <option value="all">Все заказы</option>
                  <option value="today">Сегодня</option>
                  <option value="pending">Ожидают подтверждения</option>
                  <option value="delivered">Доставленные</option>
                </select>
              </div>
            </div>

            {loading ? (
              <div className="loading-state">
                <div className="loading-spinner small"></div>
                <p>Загрузка заказов...</p>
              </div>
            ) : orders.length === 0 ? (
              <div className="empty-state">
                <div className="empty-icon">🛒</div>
                <h3>Нет заказов</h3>
                <p>Здесь появятся заказы от клиентов</p>
              </div>
            ) : (
              <div className="orders-list">
                {orders.map(order => (
                  <div key={order.id} className="order-card">
                    <div className="order-header">
                      <div className="order-title">
                        <span className="order-id">Заказ #{order.id}</span>
                        <span className="order-customer">{order.customerName}</span>
                      </div>
                      <div className="order-status-group">
                        <span className={`order-status status-${order.status.toLowerCase()}`}>
                          {getStatusText(order.status)}
                        </span>
                        <div className="status-control">
                          <select 
                            onChange={(e) => handleStatusChange(order.id, e.target.value)}
                            value={order.status}
                            className="status-select"
                          >
                            <option value="Pending">Ожидание</option>
                            <option value="Confirmed">Подтвержден</option>
                            <option value="Cooking">Готовится</option>
                            <option value="AssignedToCourier">Курьер назначен</option>
                            <option value="OnTheWay">В пути</option>
                            <option value="Delivered">Доставлен</option>
                            <option value="Cancelled">Отменен</option>
                          </select>
                        </div>
                      </div>
                    </div>
                    
                    <div className="order-info">
                      <div className="info-row">
                        <div className="info-item">
                          <span className="info-label">Телефон</span>
                          <span className="info-value">{order.customerPhone}</span>
                        </div>
                        <div className="info-item">
                          <span className="info-label">Адрес доставки</span>
                          <span className="info-value">{order.deliveryAddress}</span>
                        </div>
                        <div className="info-item">
                          <span className="info-label">Дата</span>
                          <span className="info-value">{formatDate(order.createdAt)}</span>
                        </div>
                      </div>
                      
                      <div className="info-row">
                        <div className="info-item">
                          <span className="info-label">Сумма</span>
                          <span className="info-value amount">{formatCurrency(order.totalAmount)}</span>
                        </div>
                        <div className="info-item">
                          <span className="info-label">Товаров</span>
                          <span className="info-value">{order.itemsCount || order.items?.length || 0} шт.</span>
                        </div>
                        <div className="info-item">
                          <span className="info-label">Способ оплаты</span>
                          <span className="info-value">{order.paymentMethod || 'Карта онлайн'}</span>
                        </div>
                      </div>
                    </div>
                    
                    <div className="order-actions">
                      <button className="btn-secondary">
                        <span className="btn-icon">👁️</span>
                        Подробнее
                      </button>
                      <button className="btn-primary">
                        <span className="btn-icon">💬</span>
                        Связаться
                      </button>
                      <button className="btn-danger">
                        <span className="btn-icon">✖️</span>
                        Отменить
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {activeTab === 'users' && (
          <div className="users-section">
            <div className="section-header">
              <h2>Пользователи системы</h2>
              <button className="add-user-btn">
                <span className="btn-icon">➕</span>
                Добавить пользователя
              </button>
            </div>

            {loading ? (
              <div className="loading-state">
                <div className="loading-spinner small"></div>
                <p>Загрузка пользователей...</p>
              </div>
            ) : users.length === 0 ? (
              <div className="empty-state">
                <div className="empty-icon">👥</div>
                <h3>Нет пользователей</h3>
                <p>Здесь появятся пользователи системы</p>
              </div>
            ) : (
              <div className="users-table-container">
                <div className="table-controls">
                  <input 
                    type="text" 
                    placeholder="Поиск пользователей..." 
                    className="search-input"
                  />
                  <select className="filter-select">
                    <option value="all">Все роли</option>
                    <option value="Admin">Администраторы</option>
                    <option value="Courier">Курьеры</option>
                    <option value="Client">Клиенты</option>
                  </select>
                </div>
                
                <div className="users-table">
                  <table>
                    <thead>
                      <tr>
                        <th>ID</th>
                        <th>Имя</th>
                        <th>Email</th>
                        <th>Роль</th>
                        <th>Телефон</th>
                        <th>Регистрация</th>
                        <th>Действия</th>
                      </tr>
                    </thead>
                    <tbody>
                      {users.map(user => (
                        <tr key={user.id} className="user-row">
                          <td className="user-id">#{user.id}</td>
                          <td className="user-name">
                            <div className="name-wrapper">
                              <div className="avatar">
                                {user.firstName?.[0]}{user.lastName?.[0]}
                              </div>
                              <div className="name-info">
                                <div className="full-name">{user.firstName} {user.lastName}</div>
                                <div className="user-email-mobile">{user.email}</div>
                              </div>
                            </div>
                          </td>
                          <td className="user-email">{user.email}</td>
                          <td className="user-role">
                            <span className={`role-badge role-${user.role.toLowerCase()}`}>
                              {getRoleText(user.role)}
                            </span>
                          </td>
                          <td className="user-phone">{user.phoneNumber}</td>
                          <td className="user-date">{new Date(user.createdAt).toLocaleDateString('ru-RU')}</td>
                          <td className="user-actions">
                            <button className="action-icon-btn" title="Редактировать">
                              ✏️
                            </button>
                            <button className="action-icon-btn" title="Удалить">
                              🗑️
                            </button>
                            <button className="action-icon-btn" title="Отправить сообщение">
                              💬
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
                
                <div className="table-footer">
                  <div className="pagination-info">
                    Показано {users.length} из {users.length} пользователей
                  </div>
                  <div className="pagination-controls">
                    <button className="pagination-btn" disabled>← Назад</button>
                    <span className="pagination-current">1</span>
                    <button className="pagination-btn">Вперёд →</button>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Футер */}
      <div className="admin-footer">
        <div className="footer-content">
          <div className="footer-info">
            <div className="system-status">
              <span className="status-indicator active"></span>
              Система активна
            </div>
            <div className="server-time">
              Серверное время: {new Date().toLocaleTimeString('ru-RU')}
            </div>
          </div>
          <div className="footer-version">
            v1.0.0 • {new Date().getFullYear()} © Ресторан
          </div>
        </div>
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
    'Client': 'Клиент',
    'Manager': 'Менеджер',
    'Cook': 'Повар'
  };
  return roleMap[role] || role;
};

export default Admin;