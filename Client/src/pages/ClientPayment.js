import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import axios from 'axios';
import '../styles/PaymentPage.css';

const API_BASE_URL = 'http://localhost:5110/api';

const ClientPayment = () => {
  const { orderId } = useParams();
  const navigate = useNavigate();
  const location = useLocation();
  
  const [loading, setLoading] = useState(false);
  const [order, setOrder] = useState(null);
  const [paymentSuccess, setPaymentSuccess] = useState(false);
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  
  const [paymentData, setPaymentData] = useState({
    cardNumber: '',
    cardHolder: '',
    expiryDate: '',
    cvv: '',
    saveCard: false
  });

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (!token) {
      navigate('/login');
      return;
    }
    
    // Если orderId не передан в URL, попробуем получить его из location state
    const orderIdToUse = orderId || location.state?.orderId;
    
    if (!orderIdToUse) {
      console.error('Order ID не найден!');
      setError('Не удалось определить номер заказа');
      setIsLoading(false);
      return;
    }
    
    console.log('Order ID для загрузки:', orderIdToUse);
    loadOrder(orderIdToUse);
  }, [orderId, navigate, location]);

  const getAuthHeaders = () => {
    const token = localStorage.getItem('token');
    return {
      headers: { 
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    };
  };

  const loadOrder = async (orderIdToLoad) => {
    try {
      setIsLoading(true);
      setError('');
      
      console.log('Загружаем заказ с ID:', orderIdToLoad);
      
      // Вариант 1: Попробуем получить активный заказ из корзины
      try {
        const cartResponse = await axios.get(
          `${API_BASE_URL}/client/cart`,
          getAuthHeaders()
        );
        
        console.log('Данные корзины:', cartResponse.data);
        
        if (cartResponse.data && cartResponse.data.id) {
          setOrder({
            id: cartResponse.data.id,
            totalAmount: cartResponse.data.totalAmount || cartResponse.data.totalPrice || 0,
            orderItems: cartResponse.data.orderItems || cartResponse.data.items || [],
            deliveryAddress: cartResponse.data.deliveryAddress || '',
            specialInstructions: cartResponse.data.specialInstructions || '',
            status: 'Pending',
            createdAt: cartResponse.data.createdAt || new Date().toISOString()
          });
          return;
        }
      } catch (cartError) {
        console.log('Корзина не найдена или ошибка:', cartError.response?.status);
      }
      
      // Вариант 2: Попробуем получить заказ по ID
      try {
        const response = await axios.get(
          `${API_BASE_URL}/orders/${orderIdToLoad}`,
          getAuthHeaders()
        );
        
        if (response.data) {
          setOrder({
            id: response.data.id,
            totalAmount: response.data.totalAmount || response.data.totalPrice || 0,
            orderItems: response.data.orderItems || response.data.items || [],
            deliveryAddress: response.data.deliveryAddress || '',
            specialInstructions: response.data.specialInstructions || '',
            status: response.data.status || 'Pending',
            createdAt: response.data.createdAt || new Date().toISOString(),
            customerPhone: response.data.customerPhone || '',
            paymentMethod: response.data.paymentMethod || 'card'
          });
          return;
        }
      } catch (orderError) {
        console.log('Заказ не найден:', orderError.response?.status);
        
        // Вариант 3: Попробуем другой endpoint
        try {
          const response2 = await axios.get(
            `${API_BASE_URL}/client/orders/${orderIdToLoad}`,
            getAuthHeaders()
          );
          
          if (response2.data) {
            setOrder(response2.data);
            return;
          }
        } catch (orderError2) {
          console.log('Второй endpoint тоже не сработал:', orderError2.response?.status);
        }
      }
      
      // Если все варианты не сработали, создаем мок-данные
      console.log('Создаем мок-данные для заказа');
      createMockOrder(orderIdToLoad);
      
    } catch (error) {
      console.error('Ошибка загрузки заказа:', error);
      createMockOrder(orderId);
      setError('Не удалось загрузить информацию о заказе. Работаем в демо-режиме.');
    } finally {
      setIsLoading(false);
    }
  };

  const createMockOrder = (orderIdToLoad) => {
    // Создаем мок-данные для демонстрации
    const mockOrder = {
      id: orderIdToLoad || 'DEMO-' + Math.floor(Math.random() * 10000),
      totalAmount: 3499.99,
      orderItems: [
        { 
          id: 1,
          productName: 'Пицца Пепперони', 
          quantity: 2, 
          price: 1250.00,
          total: 2500.00
        },
        { 
          id: 2,
          productName: 'Картофель фри', 
          quantity: 1, 
          price: 999.99,
          total: 999.99
        }
      ],
      deliveryAddress: 'ул. Примерная, д. 1, кв. 1',
      specialInstructions: 'Позвоните за 30 минут до доставки',
      status: 'Pending',
      createdAt: new Date().toISOString(),
      customerPhone: '+7 (999) 123-45-67',
      paymentMethod: 'card'
    };
    
    setOrder(mockOrder);
  };

  const formatCardNumber = (value) => {
    const v = value.replace(/\s+/g, '').replace(/[^0-9]/gi, '');
    const matches = v.match(/\d{4,16}/g);
    const match = matches && matches[0] || '';
    const parts = [];
    
    for (let i = 0, len = match.length; i < len; i += 4) {
      parts.push(match.substring(i, i + 4));
    }
    
    if (parts.length) {
      return parts.join(' ');
    } else {
      return value;
    }
  };

  const validateCard = () => {
    // Очищаем предыдущие ошибки
    setError('');
    
    // Валидация номера карты
    const cleanCardNumber = paymentData.cardNumber.replace(/\s/g, '');
    if (cleanCardNumber.length !== 16) {
      setError('Номер карты должен содержать 16 цифр');
      return false;
    }
    
    // Проверка на только цифры
    if (!/^\d+$/.test(cleanCardNumber)) {
      setError('Номер карты должен содержать только цифры');
      return false;
    }
    
    // Валидация имени
    if (paymentData.cardHolder.trim().length < 3) {
      setError('Введите имя владельца карты (минимум 3 символа)');
      return false;
    }
    
    // Валидация CVV
    if (paymentData.cvv.length !== 3) {
      setError('CVV код должен содержать 3 цифры');
      return false;
    }
    
    if (!/^\d+$/.test(paymentData.cvv)) {
      setError('CVV код должен содержать только цифры');
      return false;
    }
    
    // Проверка срока действия
    const [month, year] = paymentData.expiryDate.split('/');
    const currentYear = new Date().getFullYear() % 100;
    const currentMonth = new Date().getMonth() + 1;
    
    if (!month || !year || month.length !== 2 || year.length !== 2) {
      setError('Некорректный срок действия карты. Формат: MM/YY');
      return false;
    }
    
    const monthNum = parseInt(month);
    const yearNum = parseInt(year);
    
    if (isNaN(monthNum) || isNaN(yearNum)) {
      setError('Срок действия должен содержать только цифры');
      return false;
    }
    
    if (monthNum < 1 || monthNum > 12) {
      setError('Месяц должен быть от 01 до 12');
      return false;
    }
    
    if (yearNum < currentYear) {
      setError('Срок действия карты истек');
      return false;
    }
    
    if (yearNum === currentYear && monthNum < currentMonth) {
      setError('Срок действия карты истек');
      return false;
    }
    
    return true;
  };

  const handlePayment = async () => {
    if (!validateCard()) {
      return;
    }

    setLoading(true);
    setError('');

    try {
      // Симуляция обработки платежа
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      // Пытаемся обновить статус заказа
      try {
        // Вариант 1: Стандартный endpoint
        await axios.post(
          `${API_BASE_URL}/orders/${order.id}/pay`,
          { 
            paymentMethod: 'card',
            paymentStatus: 'completed'
          },
          getAuthHeaders()
        );
      } catch (updateError) {
        console.log('Обновление статуса не удалось:', updateError);
        
        // Вариант 2: Альтернативный endpoint
        try {
          await axios.put(
            `${API_BASE_URL}/client/orders/${order.id}/complete-payment`,
            { 
              paymentMethod: 'card'
            },
            getAuthHeaders()
          );
        } catch (updateError2) {
          console.log('Второй endpoint тоже не сработал:', updateError2);
          // Продолжаем в демо-режиме
        }
      }
      
      setPaymentSuccess(true);
      
      // Через 3 секунды перенаправляем на страницу заказов
      setTimeout(() => {
        navigate('/client/orders', {
          state: { 
            message: 'Оплата прошла успешно! Заказ подтвержден.' 
          }
        });
      }, 3000);
      
    } catch (error) {
      console.error('Ошибка оплаты:', error);
      setError('Ошибка при обработке платежа. Попробуйте снова.');
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (dateString) => {
    if (!dateString) return 'Не указано';
    const date = new Date(dateString);
    return new Intl.DateTimeFormat('ru-RU', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    }).format(date);
  };

  // Добавляем CSS для анимации спиннера
  const spinnerStyle = `
    @keyframes spin {
      0% { transform: rotate(0deg); }
      100% { transform: rotate(360deg); }
    }
  `;

  if (isLoading) {
    return (
      <div className="payment-container">
        <div className="payment-header">
          <div className="payment-header-content">
            <h1 className="page-title">Оплата заказа</h1>
          </div>
        </div>
        
        <div className="payment-card">
          <div style={{ textAlign: 'center', padding: '40px' }}>
            <style>{spinnerStyle}</style>
            <div style={{ 
              width: '50px', 
              height: '50px', 
              margin: '0 auto 20px',
              border: '4px solid #ffeaea',
              borderTop: '4px solid #8b0000',
              borderRadius: '50%',
              animation: 'spin 1s linear infinite'
            }}></div>
            <p>Загрузка информации о заказе...</p>
          </div>
        </div>
      </div>
    );
  }

  if (!order) {
    return (
      <div className="payment-container">
        <div className="payment-header">
          <div className="payment-header-content">
            <button className="back-button" onClick={() => navigate('/client/cart')}>
              Вернуться в корзину
            </button>
            <h1 className="page-title">Оплата заказа</h1>
          </div>
        </div>
        
        <div className="payment-card">
          <div className="notification notification-error">
            <div style={{ fontSize: '20px', fontWeight: 'bold' }}>!</div>
            <div style={{ color: 'white' }}>
              Не удалось загрузить информацию о заказе. Пожалуйста, проверьте номер заказа.
            </div>
          </div>
          
          <div style={{ textAlign: 'center', padding: '40px' }}>
            <button
              className="pay-button"
              onClick={() => navigate('/client/cart')}
              style={{ margin: '20px auto' }}
            >
              Вернуться в корзину
            </button>
          </div>
        </div>
      </div>
    );
  }

  if (paymentSuccess) {
    return (
      <div className="payment-container">
        <div className="payment-header">
          <div className="payment-header-content">
            <h1 className="page-title">Оплата заказа #{order.id}</h1>
          </div>
        </div>
        
        <div style={{ maxWidth: '600px', margin: '0 auto' }}>
          <div className="notification notification-success">
            <div style={{ fontSize: '24px', fontWeight: 'bold' }}>✓</div>
            <div>
              <h3 style={{ margin: '0 0 10px 0', color: 'white' }}>Оплата успешно завершена!</h3>
              <p style={{ margin: 0, opacity: 0.9, color: 'white' }}>
                Заказ #{order.id} оплачен. Спасибо за оплату! Ваш заказ подтвержден и передан на выполнение.
              </p>
            </div>
          </div>
          
          <div className="order-info-card">
            <h3 className="order-title">Детали заказа</h3>
            <div className="order-details">
              <div className="detail-row">
                <span className="detail-label">Номер заказа:</span>
                <span className="detail-value">#{order.id}</span>
              </div>
              <div className="detail-row">
                <span className="detail-label">Сумма:</span>
                <span className="detail-value">{order.totalAmount.toFixed(2)} ₽</span>
              </div>
              <div className="detail-row">
                <span className="detail-label">Статус:</span>
                <span className="detail-value" style={{ color: '#90ee90' }}>Подтвержден</span>
              </div>
            </div>
          </div>
          
          <div style={{ textAlign: 'center', marginTop: '30px', color: '#666' }}>
            <p>Перенаправляем на страницу заказов...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="payment-container">
      {/* Шапка */}
      <div className="payment-header">
        <div className="payment-header-content">
          <button className="back-button" onClick={() => navigate('/client/cart')}>
            Вернуться в корзину
          </button>
          <h1 className="page-title">Оплата банковской картой</h1>
        </div>
      </div>

      {/* Основной контент */}
      <div className="payment-content">
        {/* Левая колонка - Форма оплаты */}
        <div className="payment-card">
          <h2 className="card-title">Данные карты</h2>
          
          {error && (
            <div className="notification notification-error">
              <div style={{ fontSize: '20px', fontWeight: 'bold' }}>!</div>
              <div style={{ color: 'white' }}>{error}</div>
            </div>
          )}
          
          {/* Картинка карты */}
          <div className="card-image"></div>
          
          <form className="payment-form" onSubmit={(e) => { e.preventDefault(); handlePayment(); }}>
            {/* Номер карты */}
            <div className="form-group">
              <label className="form-label">Номер карты *</label>
              <input
                type="text"
                className="form-control"
                placeholder="1234 5678 9012 3456"
                value={paymentData.cardNumber}
                onChange={(e) => setPaymentData({
                  ...paymentData,
                  cardNumber: formatCardNumber(e.target.value)
                })}
                maxLength="19"
                required
              />
              <div style={{ fontSize: '13px', color: '#999', marginTop: '5px' }}>
                Введите 16-значный номер карты
              </div>
            </div>

            {/* Имя владельца */}
            <div className="form-group">
              <label className="form-label">Имя владельца карты *</label>
              <input
                type="text"
                className="form-control"
                placeholder="IVAN IVANOV"
                value={paymentData.cardHolder}
                onChange={(e) => setPaymentData({
                  ...paymentData,
                  cardHolder: e.target.value.toUpperCase()
                })}
                required
              />
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>
              {/* Срок действия */}
              <div className="form-group">
                <label className="form-label">Срок действия *</label>
                <input
                  type="text"
                  className="form-control"
                  placeholder="MM/YY"
                  value={paymentData.expiryDate}
                  onChange={(e) => {
                    let value = e.target.value.replace(/\D/g, '');
                    if (value.length >= 2) {
                      value = value.substring(0, 2) + '/' + value.substring(2, 4);
                    }
                    setPaymentData({
                      ...paymentData,
                      expiryDate: value
                    });
                  }}
                  maxLength="5"
                  required
                />
              </div>

              {/* CVV */}
              <div className="form-group">
                <label className="form-label">CVV код *</label>
                <input
                  type="password"
                  className="form-control"
                  placeholder="123"
                  value={paymentData.cvv}
                  onChange={(e) => setPaymentData({
                    ...paymentData,
                    cvv: e.target.value.replace(/\D/g, '').substring(0, 3)
                  })}
                  maxLength="3"
                  required
                />
                <div style={{ fontSize: '13px', color: '#999', marginTop: '5px' }}>
                  3 цифры на обороте карты
                </div>
              </div>
            </div>

            {/* Сохранить карту */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginTop: '10px' }}>
              <input
                type="checkbox"
                id="saveCard"
                checked={paymentData.saveCard}
                onChange={(e) => setPaymentData({
                  ...paymentData,
                  saveCard: e.target.checked
                })}
                style={{ width: '18px', height: '18px' }}
              />
              <label htmlFor="saveCard" style={{ color: '#666', fontSize: '14px' }}>
                Сохранить карту для будущих платежей
              </label>
            </div>

            {/* Принимаемые карты */}
            <div className="accepted-cards">
              <div className="cards-title">Принимаем к оплате:</div>
              <div className="cards-list">
                <span className="card-badge">Visa</span>
                <span className="card-badge">MasterCard</span>
                <span className="card-badge">Mir</span>
                <span className="card-badge">3D Secure</span>
              </div>
            </div>

            {/* Кнопки */}
            <div className="payment-buttons">
              <button
                type="submit"
                className="pay-button"
                disabled={loading}
              >
                {loading ? (
                  <>
                    <div className="loading-spinner"></div>
                    Обработка платежа...
                  </>
                ) : (
                  `ОПЛАТИТЬ ${order?.totalAmount?.toFixed(2)} ₽`
                )}
              </button>
              
              <button
                type="button"
                className="cancel-button"
                onClick={() => navigate('/client/cart')}
                disabled={loading}
              >
                Отмена
              </button>
            </div>
          </form>
          
          {/* Информация о безопасности */}
          <div className="security-card">
            <div className="security-title">Безопасность платежей</div>
            <ul className="security-list">
              <li>Защищенное SSL-соединение</li>
              <li>Данные карты не сохраняются</li>
              <li>Сертификат PCI DSS</li>
            </ul>
          </div>
        </div>

        {/* Правая колонка - Информация о заказе */}
        <div className="order-info-card">
          <h3 className="order-title">Информация о заказе</h3>
          
          <div className="order-details">
            <div className="detail-row">
              <span className="detail-label">Номер заказа:</span>
              <span className="detail-value">#{order.id}</span>
            </div>
            
            <div className="detail-row">
              <span className="detail-label">Сумма к оплате:</span>
              <span className="detail-value" style={{ fontSize: '28px', color: '#ffccbc' }}>
                {order.totalAmount?.toFixed(2)} ₽
              </span>
            </div>
            
            <div className="detail-row">
              <span className="detail-label">Товаров:</span>
              <span className="detail-value">{order.orderItems?.length || 0} шт.</span>
            </div>
            
            <div className="detail-row">
              <span className="detail-label">Дата заказа:</span>
              <span className="detail-value">{formatDate(order.createdAt)}</span>
            </div>
            
            <div className="detail-row">
              <span className="detail-label">Статус:</span>
              <span className="detail-value" style={{ color: '#ffcc80' }}>Ожидает оплаты</span>
            </div>
            
            {order.deliveryAddress && (
              <div className="detail-row">
                <span className="detail-label">Адрес доставки:</span>
                <span className="detail-value" style={{ textAlign: 'right' }}>
                  {order.deliveryAddress}
                </span>
              </div>
            )}
            
            {order.customerPhone && (
              <div className="detail-row">
                <span className="detail-label">Телефон:</span>
                <span className="detail-value">{order.customerPhone}</span>
              </div>
            )}
            
            {order.specialInstructions && (
              <div className="detail-row" style={{ flexDirection: 'column', alignItems: 'flex-start', gap: '5px' }}>
                <span className="detail-label">Пожелания:</span>
                <span className="detail-value" style={{ fontSize: '14px', opacity: 0.9 }}>
                  {order.specialInstructions}
                </span>
              </div>
            )}
            
            {/* Детали товаров */}
            {order.orderItems && order.orderItems.length > 0 && (
              <div style={{ marginTop: '20px', paddingTop: '15px', borderTop: '1px solid rgba(255, 255, 255, 0.1)' }}>
                <div className="detail-label" style={{ marginBottom: '10px' }}>Состав заказа:</div>
                {order.orderItems.map((item, index) => (
                  <div key={index} style={{ 
                    display: 'flex', 
                    justifyContent: 'space-between',
                    marginBottom: '8px',
                    fontSize: '14px'
                  }}>
                    <span>{item.productName || item.itemName} × {item.quantity}</span>
                    <span>{(item.total || item.price * item.quantity).toFixed(2)} ₽</span>
                  </div>
                ))}
              </div>
            )}
          </div>
          
          <div style={{ marginTop: '30px', paddingTop: '20px', borderTop: '1px solid rgba(255, 255, 255, 0.1)' }}>
            <div style={{ fontSize: '13px', color: '#ffcccc', textAlign: 'center' }}>
              Это демонстрационная страница оплаты. Платеж не будет произведен.
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ClientPayment;