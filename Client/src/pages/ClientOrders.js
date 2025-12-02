import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import axios from 'axios';

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
    
    // Автообновление каждые 30 секунд
    const interval = setInterval(loadOrders, 30000);
    
    // Показываем сообщение об успешном заказе
    if (location.state?.message) {
      alert(location.state.message);
      window.history.replaceState({}, document.title);
    }
    
    return () => clearInterval(interval);
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
        `${API_BASE_URL}/orders/my`,
        getAuthHeaders()
      );
      
      const ordersData = Array.isArray(response.data) ? response.data : [];
      setOrders(ordersData);
      
      // Загружаем историю статусов для каждого заказа
      for (const order of ordersData) {
        if (['Pending', 'Confirmed', 'Cooking'].includes(order.status)) {
          loadStatusHistory(order.id);
        }
      }
      
    } catch (error) {
      console.error('Ошибка загрузки заказов:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadStatusHistory = async (orderId) => {
    try {
      const response = await axios.get(
        `${API_BASE_URL}/orders/${orderId}/status-history`,
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
        `${API_BASE_URL}/orders/${orderId}/cancel`,
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
    // Можно отменить только заказы в статусе "Ожидание" или "Подтвержден"
    return order.status === 'Pending' || order.status === 'Confirmed';
  };

  const getOrderProgress = (order) => {
    const steps = [
      { status: 'Pending', label: 'Ожидание', icon: '⏳' },
      { status: 'Confirmed', label: 'Подтвержден', icon: '✅' },
      { status: 'Cooking', label: 'Готовится', icon: '👨‍🍳' },
      { status: 'AssignedToCourier', label: 'Курьер назначен', icon: '🚴' },
      { status: 'OnTheWay', label: 'В пути', icon: '🛵' },
      { status: 'Delivered', label: 'Доставлен', icon: '🏠' }
    ];
    
    const currentStepIndex = steps.findIndex(step => step.status === order.status);
    
    return { steps, currentStepIndex };
  };

  if (!user) return null;

  return (
    <div style={styles.container}>
      <div style={styles.header}>
        <button 
          style={styles.backButton}
          onClick={() => navigate('/client')}
        >
          ← Назад в меню
        </button>
        <h1 style={styles.title}>Мои заказы</h1>
        <button 
          style={styles.refreshButton}
          onClick={loadOrders}
        >
          🔄 Обновить
        </button>
      </div>

      {loading ? (
        <div style={styles.loading}>
          <div style={styles.spinner}></div>
          <p>Загрузка заказов...</p>
        </div>
      ) : orders.length === 0 ? (
        <div style={styles.emptyOrders}>
          <div style={styles.emptyIcon}>📋</div>
          <h3>У вас еще нет заказов</h3>
          <p>Сделайте свой первый заказ!</p>
          <button 
            style={styles.orderButton}
            onClick={() => navigate('/client')}
          >
            Перейти в меню
          </button>
        </div>
      ) : (
        <div style={styles.ordersList}>
          {orders.map(order => {
            const { steps, currentStepIndex } = getOrderProgress(order);
            const history = statusHistory[order.id] || [];
            
            return (
              <div key={order.id} style={styles.orderCard}>
                <div style={styles.orderHeader}>
                  <div style={styles.orderInfo}>
                    <h3 style={styles.orderNumber}>
                      Заказ #{order.id}
                      {canCancelOrder(order) && (
                        <button 
                          style={styles.cancelOrderButton}
                          onClick={() => cancelOrder(order.id)}
                        >
                          Отменить заказ
                        </button>
                      )}
                    </h3>
                    <div style={styles.orderMeta}>
                      <span style={styles.orderDate}>
                        📅 {formatDate(order.createdAt)}
                      </span>
                      <span style={styles.orderTotal}>
                        💰 {formatCurrency(order.totalAmount)}
                      </span>
                      <span style={styles.orderAddress}>
                        📍 {order.deliveryAddress || 'Самовывоз'}
                      </span>
                    </div>
                  </div>
                  
                  <div style={styles.orderStatus}>
                    <span 
                      style={{
                        ...styles.statusBadge,
                        background: getStatusColor(order.status),
                        color: 'white'
                      }}
                    >
                      {getStatusText(order.status)}
                    </span>
                  </div>
                </div>
                
                {/* Прогресс выполнения заказа */}
                {currentStepIndex >= 0 && (
                  <div style={styles.orderProgress}>
                    <div style={styles.progressSteps}>
                      {steps.map((step, index) => (
                        <div 
                          key={step.status}
                          style={styles.progressStep}
                        >
                          <div 
                            style={{
                              ...styles.progressIcon,
                              ...(index <= currentStepIndex ? styles.progressIconActive : {}),
                              ...(index < currentStepIndex ? styles.progressIconCompleted : {})
                            }}
                          >
                            {index < currentStepIndex ? '✓' : step.icon}
                          </div>
                          <span 
                            style={{
                              ...styles.progressLabel,
                              ...(index <= currentStepIndex ? styles.progressLabelActive : {})
                            }}
                          >
                            {step.label}
                          </span>
                          {index < steps.length - 1 && (
                            <div 
                              style={{
                                ...styles.progressLine,
                                ...(index < currentStepIndex ? styles.progressLineActive : {})
                              }}
                            />
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                )}
                
                <div style={styles.orderDetails}>
                  <div style={styles.orderSection}>
                    <h4 style={styles.sectionTitle}>Состав заказа:</h4>
                    <div style={styles.itemsList}>
                      {order.orderItems && order.orderItems.length > 0 ? (
                        order.orderItems.map((item, index) => (
                          <div key={index} style={styles.orderItem}>
                            <span style={styles.itemName}>
                              {item.itemName}
                            </span>
                            <span style={styles.itemQuantity}>
                              × {item.quantity}
                            </span>
                            <span style={styles.itemPrice}>
                              {formatCurrency(item.unitPrice * item.quantity)}
                            </span>
                          </div>
                        ))
                      ) : (
                        <p>Информация о товарах недоступна</p>
                      )}
                    </div>
                  </div>
                  
                  {order.specialInstructions && (
                    <div style={styles.orderSection}>
                      <h4 style={styles.sectionTitle}>Особые пожелания:</h4>
                      <p style={styles.specialInstructions}>{order.specialInstructions}</p>
                    </div>
                  )}
                  
                  {history.length > 0 && (
                    <div style={styles.orderSection}>
                      <h4 style={styles.sectionTitle}>История статусов:</h4>
                      <div style={styles.statusHistory}>
                        {history.map((record, index) => (
                          <div key={index} style={styles.statusRecord}>
                            <div style={styles.statusRecordHeader}>
                              <span style={styles.statusRecordStatus}>
                                {getStatusText(record.status)}
                              </span>
                              <span style={styles.statusRecordDate}>
                                {formatDate(record.createdAt)}
                              </span>
                            </div>
                            {record.notes && (
                              <p style={styles.statusRecordNotes}>📝 {record.notes}</p>
                            )}
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
                
                {order.estimatedDeliveryTime && (
                  <div style={styles.deliveryInfo}>
                    <div style={styles.deliveryTime}>
                      <strong>⏰ Примерное время доставки:</strong> {formatDate(order.estimatedDeliveryTime)}
                    </div>
                  </div>
                )}
                
                {order.assignedCourierId && (
                  <div style={styles.courierInfo}>
                    <div style={styles.courierBadge}>
                      🚴 Курьер назначен
                    </div>
                  </div>
                )}
              </div>
            );
          })}
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
  },
  backButton: {
    background: 'transparent',
    color: 'white',
    border: 'none',
    fontSize: '16px',
    cursor: 'pointer',
    padding: '10px',
    borderRadius: '8px',
    transition: 'background 0.3s ease',
  },
  title: {
    margin: 0,
    fontSize: '24px',
    fontWeight: 'bold',
  },
  refreshButton: {
    background: 'rgba(255,255,255,0.2)',
    color: 'white',
    border: 'none',
    padding: '10px 20px',
    borderRadius: '8px',
    cursor: 'pointer',
    fontSize: '14px',
  },
  loading: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    padding: '80px 20px',
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
  emptyIcon: {
    fontSize: '80px',
    marginBottom: '20px',
    opacity: 0.3,
  },
  orderButton: {
    background: '#780505',
    color: 'white',
    border: 'none',
    padding: '12px 32px',
    borderRadius: '8px',
    fontSize: '16px',
    cursor: 'pointer',
    marginTop: '20px',
  },
  ordersList: {
    padding: '40px',
    maxWidth: '1200px',
    margin: '0 auto',
  },
  orderCard: {
    background: 'white',
    borderRadius: '15px',
    padding: '30px',
    marginBottom: '30px',
    boxShadow: '0 4px 20px rgba(0,0,0,0.08)',
    borderLeft: '5px solid #780505',
  },
  orderHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: '25px',
    paddingBottom: '25px',
    borderBottom: '1px solid #f0f0f0',
  },
  orderInfo: {
    flex: 1,
  },
  orderNumber: {
    margin: '0 0 15px 0',
    fontSize: '22px',
    color: '#333',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    flexWrap: 'wrap',
    gap: '20px',
  },
  cancelOrderButton: {
    background: 'transparent',
    color: '#f44336',
    border: '1px solid #f44336',
    padding: '8px 20px',
    borderRadius: '6px',
    fontSize: '14px',
    cursor: 'pointer',
    transition: 'all 0.3s ease',
  },
  orderMeta: {
    display: 'flex',
    flexWrap: 'wrap',
    gap: '20px',
    fontSize: '14px',
    color: '#666',
  },
  orderDate: {
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
  },
  orderTotal: {
    fontWeight: 'bold',
    color: '#780505',
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
  },
  orderAddress: {
    maxWidth: '300px',
    overflow: 'hidden',
    textOverflow: 'ellipsis',
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
  },
  orderStatus: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
  },
  statusBadge: {
    padding: '10px 20px',
    borderRadius: '50px',
    fontSize: '14px',
    fontWeight: 'bold',
    textTransform: 'uppercase',
    minWidth: '150px',
    textAlign: 'center',
  },
  orderProgress: {
    marginBottom: '30px',
    padding: '20px',
    background: '#f9f9f9',
    borderRadius: '10px',
  },
  progressSteps: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    position: 'relative',
  },
  progressStep: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    flex: 1,
    position: 'relative',
  },
  progressIcon: {
    width: '40px',
    height: '40px',
    borderRadius: '50%',
    background: '#e0e0e0',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontSize: '18px',
    marginBottom: '10px',
    zIndex: 2,
  },
  progressIconActive: {
    background: '#780505',
    color: 'white',
  },
  progressIconCompleted: {
    background: '#4caf50',
    color: 'white',
  },
  progressLabel: {
    fontSize: '12px',
    color: '#999',
    textAlign: 'center',
    fontWeight: '500',
  },
  progressLabelActive: {
    color: '#333',
    fontWeight: 'bold',
  },
  progressLine: {
    position: 'absolute',
    top: '20px',
    left: '70%',
    right: '-30%',
    height: '2px',
    background: '#e0e0e0',
    zIndex: 1,
  },
  progressLineActive: {
    background: '#4caf50',
  },
  orderDetails: {
    display: 'grid',
    gridTemplateColumns: '1fr 1fr',
    gap: '30px',
    marginBottom: '25px',
  },
  orderSection: {
    marginBottom: '20px',
  },
  sectionTitle: {
    margin: '0 0 15px 0',
    fontSize: '16px',
    color: '#333',
    borderBottom: '1px solid #f0f0f0',
    paddingBottom: '8px',
  },
  itemsList: {
    display: 'flex',
    flexDirection: 'column',
    gap: '12px',
  },
  orderItem: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: '12px 0',
    borderBottom: '1px dashed #f0f0f0',
  },
  itemName: {
    flex: 1,
    fontSize: '14px',
  },
  itemQuantity: {
    margin: '0 20px',
    color: '#666',
    fontSize: '14px',
  },
  itemPrice: {
    fontWeight: 'bold',
    color: '#780505',
    minWidth: '100px',
    textAlign: 'right',
    fontSize: '14px',
  },
  specialInstructions: {
    background: '#f9f9f9',
    padding: '15px',
    borderRadius: '8px',
    fontSize: '14px',
    color: '#666',
    lineHeight: 1.5,
  },
  statusHistory: {
    display: 'flex',
    flexDirection: 'column',
    gap: '15px',
    maxHeight: '200px',
    overflowY: 'auto',
  },
  statusRecord: {
    background: '#f5f5f5',
    padding: '15px',
    borderRadius: '8px',
    borderLeft: '3px solid #780505',
  },
  statusRecordHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: '8px',
  },
  statusRecordStatus: {
    fontWeight: 'bold',
    fontSize: '14px',
    color: '#333',
  },
  statusRecordDate: {
    fontSize: '12px',
    color: '#666',
  },
  statusRecordNotes: {
    margin: 0,
    fontSize: '13px',
    color: '#666',
  },
  deliveryInfo: {
    marginTop: '20px',
    padding: '15px',
    background: '#e3f2fd',
    borderRadius: '10px',
    border: '1px solid #bbdefb',
  },
  deliveryTime: {
    display: 'flex',
    alignItems: 'center',
    gap: '10px',
    fontSize: '14px',
    color: '#0d47a1',
  },
  courierInfo: {
    marginTop: '15px',
  },
  courierBadge: {
    display: 'inline-block',
    background: '#e1bee7',
    color: '#4a148c',
    padding: '8px 16px',
    borderRadius: '20px',
    fontSize: '14px',
    fontWeight: 'bold',
  },
};

// Добавляем анимацию спиннера
const styleSheet = document.styleSheets[0];
styleSheet.insertRule(`
  @keyframes spin {
    0% { transform: rotate(0deg); }
    100% { transform: rotate(360deg); }
  }
`, styleSheet.cssRules.length);

export default ClientOrders;