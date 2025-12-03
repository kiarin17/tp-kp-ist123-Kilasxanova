import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import axios from 'axios';
import { 
  FaArrowLeft, 
  FaShoppingBag, 
  FaMapMarkerAlt, 
  FaPhone, 
  FaMoneyBillWave,
  FaCreditCard,
  FaClock,
  FaHistory,
  FaTimes,
  FaCheck,
  FaTruck,
  FaHome
} from 'react-icons/fa';

const API_BASE_URL = 'http://localhost:5110/api';

const ClientOrders = () => {
  const [user, setUser] = useState(null);
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [statusHistory, setStatusHistory] = useState({});
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    const userData = localStorage.getItem('user');
    const token = localStorage.getItem('token');
    
    if (!userData || !token) {
      navigate('/login');
      return;
    }

    const userObj = JSON.parse(userData);
    setUser(userObj);
    
    loadOrders();
    
    if (location.state?.message) {
      alert(location.state.message);
      window.history.replaceState({}, document.title);
    }
  }, [navigate, location]);

  const getAuthHeaders = () => {
    const token = localStorage.getItem('token');
    return {
      headers: { 
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    };
  };

  const loadOrders = async () => {
    try {
      const response = await axios.get(
        `${API_BASE_URL}/client/ClientOrders/my`,
        getAuthHeaders()
      );
      
      const ordersData = Array.isArray(response.data) ? response.data : [];
      setOrders(ordersData);
      
    } catch (error) {
      console.error('Ошибка загрузки заказов:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadStatusHistory = async (orderId) => {
    try {
      const response = await axios.get(
        `${API_BASE_URL}/client/ClientOrders/${orderId}/status-history`,
        getAuthHeaders()
      );
      
      setStatusHistory(prev => ({
        ...prev,
        [orderId]: response.data || []
      }));
    } catch (error) {
      console.error('Ошибка загрузки истории статусов:', error);
    }
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

  const getStatusColor = (status) => {
    const colors = {
      'Pending': '#ff9800',
      'Confirmed': '#2196f3',
      'Cooking': '#ff5722',
      'AssignedToCourier': '#9c27b0',
      'OnTheWay': '#3f51b5',
      'Delivered': '#4caf50',
      'Cancelled': '#f44336'
    };
    return colors[status] || '#666';
  };

  const formatDate = (dateString) => {
    if (!dateString) return '';
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
    }).format(amount || 0);
  };

  const cancelOrder = async (orderId) => {
    if (!window.confirm('Вы уверены, что хотите отменить заказ?')) return;
    
    try {
      await axios.put(
        `${API_BASE_URL}/client/ClientOrders/${orderId}/cancel`,
        {},
        getAuthHeaders()
      );
      
      loadOrders();
      alert('Заказ отменен');
    } catch (error) {
      console.error('Ошибка отмены заказа:', error);
      alert('Не удалось отменить заказ');
    }
  };

  const canCancelOrder = (order) => {
    return order.status === 'Pending' || order.status === 'Confirmed';
  };

  if (!user) return null;

  return (
    <div style={styles.container}>
      <div style={styles.header}>
        <button 
          style={styles.backButton}
          onClick={() => navigate('/client')}
        >
          <FaArrowLeft style={{ marginRight: '8px' }} />
          Назад в меню
        </button>
        <h1 style={styles.title}>
          <FaShoppingBag style={{ marginRight: '10px' }} />
          Мои заказы
        </h1>
        <div style={{ width: '80px' }}></div>
      </div>

      {loading ? (
        <div style={styles.loadingContainer}>
          <div style={styles.spinner}></div>
          <p>Загрузка заказов...</p>
        </div>
      ) : orders.length === 0 ? (
        <div style={styles.emptyOrders}>
          <FaShoppingBag size={80} style={{ opacity: 0.3, marginBottom: '20px' }} />
          <h3>Заказов пока нет</h3>
          <p>Сделайте свой первый заказ из меню</p>
          <button 
            style={styles.menuButton}
            onClick={() => navigate('/client')}
          >
            Перейти в меню
          </button>
        </div>
      ) : (
        <div style={styles.content}>
          <div style={styles.ordersList}>
            {orders.map(order => (
              <div key={order.id} style={styles.orderCard}>
                <div style={styles.orderHeader}>
                  <div style={styles.orderHeaderLeft}>
                    <div style={styles.orderNumber}>
                      <FaShoppingBag style={{ marginRight: '8px' }} />
                      Заказ #{order.id}
                    </div>
                    <div style={styles.orderDate}>
                      {formatDate(order.createdAt)}
                    </div>
                  </div>
                  <div style={styles.orderHeaderRight}>
                    <div 
                      style={{
                        ...styles.statusBadge,
                        backgroundColor: getStatusColor(order.status)
                      }}
                    >
                     
                      <span style={{ marginLeft: '8px' }}>
                        {getStatusText(order.status)}
                      </span>
                    </div>
                    <div style={styles.orderTotal}>
                      {formatCurrency(order.totalAmount)}
                    </div>
                  </div>
                </div>

                <div style={styles.orderInfo}>
                  <div style={styles.infoRow}>
                    <span style={styles.infoLabel}>
                      <FaMapMarkerAlt style={{ marginRight: '8px' }} />
                      Адрес доставки:
                    </span>
                    <span style={styles.infoValue}>
                      {order.deliveryAddress || 'Самовывоз'}
                    </span>
                  </div>
                  <div style={styles.infoRow}>
                    <span style={styles.infoLabel}>
                      <FaPhone style={{ marginRight: '8px' }} />
                      Телефон:
                    </span>
                    <span style={styles.infoValue}>{order.customerPhone}</span>
                  </div>
                  <div style={styles.infoRow}>
                    <span style={styles.infoLabel}>Способ оплаты:</span>
                    <span style={styles.infoValue}>
                      {order.paymentMethod === 'cash' ? (
                        <><FaMoneyBillWave style={{ marginRight: '8px' }} />Наличные</>
                      ) : (
                        <><FaCreditCard style={{ marginRight: '8px' }} />Карта онлайн</>
                      )}
                    </span>
                  </div>
                  {order.specialInstructions && (
                    <div style={styles.infoRow}>
                      <span style={styles.infoLabel}>Пожелания:</span>
                      <span style={styles.infoValue}>{order.specialInstructions}</span>
                    </div>
                  )}
                </div>

                <div style={styles.orderItems}>
                  <h4 style={styles.itemsTitle}>Состав заказа:</h4>
                  {order.orderItems && order.orderItems.map((item, index) => (
                    <div key={item.id || index} style={styles.orderItem}>
                      <div style={styles.orderItemName}>
                        <span style={styles.orderItemQuantity}>{item.quantity}×</span>
                        {item.itemName}
                      </div>
                      <div style={styles.orderItemPrice}>
                        {formatCurrency(item.unitPrice * item.quantity)}
                      </div>
                    </div>
                  ))}
                </div>

                <div style={styles.orderActions}>
                  {canCancelOrder(order) && (
                    <button 
                      style={styles.cancelButton}
                      onClick={() => cancelOrder(order.id)}
                    >
                      <FaTimes style={{ marginRight: '8px' }} />
                      Отменить заказ
                    </button>
                  )}
                  
                  <button 
                    style={styles.historyButton}
                    onClick={() => {
                      if (statusHistory[order.id]) {
                        setStatusHistory(prev => ({
                          ...prev,
                          [order.id]: null
                        }));
                      } else {
                        loadStatusHistory(order.id);
                      }
                    }}
                  >
                    <FaHistory style={{ marginRight: '8px' }} />
                    {statusHistory[order.id] ? 'Скрыть историю' : 'Показать историю статусов'}
                  </button>
                </div>

                {statusHistory[order.id] && statusHistory[order.id].length > 0 && (
                  <div style={styles.statusHistory}>
                    <h4 style={styles.historyTitle}>
                      <FaHistory style={{ marginRight: '8px' }} />
                      История изменений:
                    </h4>
                    <div style={styles.historyList}>
                      {statusHistory[order.id].map((history, idx) => (
                        <div key={history.id || idx} style={styles.historyItem}>
                          <div style={styles.historyLeft}>
                            <div style={styles.historyStatus}>
                              <div 
                                style={{
                                  ...styles.historyStatusDot,
                                  backgroundColor: getStatusColor(history.status)
                                }}
                              />
                          
                              <span style={{ marginLeft: '8px' }}>
                                {getStatusText(history.status)}
                              </span>
                            </div>
                            <div style={styles.historyNotes}>
                              {history.notes}
                            </div>
                          </div>
                          <div style={styles.historyDate}>
                            {formatDate(history.createdAt)}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

const styles = {
  container: {
    minHeight: '100vh',
    background: '#f5f5f5',
  },
  header: {
    background: 'linear-gradient(135deg, #780505 0%, #a50606 100%)',
    color: 'white',
    padding: '20px 40px',
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    position: 'sticky',
    top: 0,
    zIndex: 100,
    boxShadow: '0 4px 12px rgba(0,0,0,0.1)',
  },
  backButton: {
    background: 'transparent',
    color: 'white',
    border: 'none',
    fontSize: '16px',
    cursor: 'pointer',
    padding: '10px',
    borderRadius: '8px',
    display: 'flex',
    alignItems: 'center',
  },
  title: {
    margin: 0,
    fontSize: '24px',
    fontWeight: 'bold',
    display: 'flex',
    alignItems: 'center',
  },
  loadingContainer: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    padding: '100px 20px',
    textAlign: 'center',
  },
  spinner: {
    width: '50px',
    height: '50px',
    border: '3px solid #f3f3f3',
    borderTop: '3px solid #780505',
    borderRadius: '50%',
    animation: 'spin 1s linear infinite',
    marginBottom: '20px',
  },
  emptyOrders: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    padding: '80px 20px',
    textAlign: 'center',
  },
  menuButton: {
    background: '#780505',
    color: 'white',
    border: 'none',
    padding: '12px 32px',
    borderRadius: '8px',
    fontSize: '16px',
    cursor: 'pointer',
    marginTop: '20px',
  },
  content: {
    maxWidth: '1200px',
    margin: '0 auto',
    padding: '40px 20px',
  },
  ordersList: {
    display: 'flex',
    flexDirection: 'column',
    gap: '30px',
  },
  orderCard: {
    background: 'white',
    borderRadius: '15px',
    padding: '30px',
    boxShadow: '0 4px 12px rgba(0,0,0,0.08)',
  },
  orderHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: '25px',
    paddingBottom: '20px',
    borderBottom: '2px solid #f0f0f0',
  },
  orderHeaderLeft: {
    display: 'flex',
    flexDirection: 'column',
    gap: '8px',
  },
  orderNumber: {
    fontSize: '20px',
    fontWeight: 'bold',
    color: '#333',
    display: 'flex',
    alignItems: 'center',
  },
  orderDate: {
    fontSize: '14px',
    color: '#666',
  },
  orderHeaderRight: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'flex-end',
    gap: '10px',
  },
  statusBadge: {
    padding: '8px 16px',
    borderRadius: '50px',
    fontSize: '14px',
    fontWeight: 'bold',
    color: 'white',
    display: 'flex',
    alignItems: 'center',
  },
  orderTotal: {
    fontSize: '24px',
    fontWeight: 'bold',
    color: '#780505',
  },
  orderInfo: {
    marginBottom: '25px',
    paddingBottom: '20px',
    borderBottom: '1px solid #f0f0f0',
  },
  infoRow: {
    display: 'flex',
    marginBottom: '12px',
    fontSize: '14px',
  },
  infoLabel: {
    fontWeight: '600',
    color: '#666',
    minWidth: '150px',
    display: 'flex',
    alignItems: 'center',
  },
  infoValue: {
    color: '#333',
    flex: 1,
    display: 'flex',
    alignItems: 'center',
  },
  orderItems: {
    marginBottom: '25px',
  },
  itemsTitle: {
    margin: '0 0 15px 0',
    fontSize: '16px',
    color: '#333',
  },
  orderItem: {
    display: 'flex',
    justifyContent: 'space-between',
    padding: '12px 0',
    borderBottom: '1px dashed #f0f0f0',
  },
  orderItemName: {
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
    color: '#333',
  },
  orderItemQuantity: {
    background: '#f0f0f0',
    padding: '2px 8px',
    borderRadius: '4px',
    fontSize: '12px',
    fontWeight: 'bold',
  },
  orderItemPrice: {
    fontWeight: 'bold',
    color: '#780505',
  },
  orderActions: {
    display: 'flex',
    gap: '15px',
    marginTop: '30px',
    paddingTop: '20px',
    borderTop: '2px solid #f0f0f0',
  },
  cancelButton: {
    background: 'transparent',
    color: '#ff4444',
    border: '2px solid #ff4444',
    padding: '12px 24px',
    borderRadius: '8px',
    fontSize: '14px',
    fontWeight: 'bold',
    cursor: 'pointer',
    display: 'flex',
    alignItems: 'center',
  },
  historyButton: {
    background: 'transparent',
    color: '#666',
    border: '2px solid #ddd',
    padding: '12px 24px',
    borderRadius: '8px',
    fontSize: '14px',
    fontWeight: 'bold',
    cursor: 'pointer',
    display: 'flex',
    alignItems: 'center',
  },
  statusHistory: {
    marginTop: '25px',
    padding: '20px',
    background: '#f9f9f9',
    borderRadius: '10px',
    border: '1px solid #eee',
  },
  historyTitle: {
    margin: '0 0 15px 0',
    fontSize: '16px',
    color: '#333',
    display: 'flex',
    alignItems: 'center',
  },
  historyList: {
    display: 'flex',
    flexDirection: 'column',
    gap: '15px',
  },
  historyItem: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    padding: '15px',
    background: 'white',
    borderRadius: '8px',
    border: '1px solid #eee',
  },
  historyLeft: {
    display: 'flex',
    flexDirection: 'column',
    gap: '8px',
    flex: 1,
  },
  historyStatus: {
    display: 'flex',
    alignItems: 'center',
    gap: '10px',
    fontWeight: 'bold',
    color: '#333',
  },
  historyStatusDot: {
    width: '10px',
    height: '10px',
    borderRadius: '50%',
  },
  historyNotes: {
    fontSize: '14px',
    color: '#666',
    fontStyle: 'italic',
  },
  historyDate: {
    fontSize: '12px',
    color: '#999',
    whiteSpace: 'nowrap',
  },
};

// Добавляем анимацию спиннера
if (typeof document !== 'undefined') {
  const style = document.createElement('style');
  style.textContent = `
    @keyframes spin {
      0% { transform: rotate(0deg); }
      100% { transform: rotate(360deg); }
    }
  `;
  document.head.appendChild(style);
}

export default ClientOrders;