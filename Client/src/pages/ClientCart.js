import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';


const API_BASE_URL = 'http://localhost:5110/api';

const ClientCart = () => {
  const [user, setUser] = useState(null);
  const [cart, setCart] = useState([]);
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    deliveryAddress: '',
    customerPhone: '',
    paymentMethod: 'cash',
    specialInstructions: ''
  });
  const navigate = useNavigate();

  useEffect(() => {
    const userData = localStorage.getItem('user');
    const token = localStorage.getItem('token');
    
    if (!userData || !token) {
      navigate('/login');
      return;
    }

    const userObj = JSON.parse(userData);
    setUser(userObj);
    
    // Загружаем корзину
    const savedCart = localStorage.getItem(`cart_${userObj.id}`);
    if (savedCart) {
      setCart(JSON.parse(savedCart));
    }
    
    // Заполняем данные пользователя
    setFormData(prev => ({
      ...prev,
      customerPhone: userObj.phoneNumber || '',
      deliveryAddress: userObj.address || ''
    }));
  }, [navigate]);

  const getAuthHeaders = () => {
    const token = localStorage.getItem('token');
    return {
      headers: { 
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    };
  };

  const removeFromCart = (itemId) => {
    const newCart = cart.filter(item => item.id !== itemId);
    setCart(newCart);
    localStorage.setItem(`cart_${user.id}`, JSON.stringify(newCart));
  };

  const updateQuantity = (itemId, newQuantity) => {
    if (newQuantity < 1) {
      removeFromCart(itemId);
      return;
    }
    
    const newCart = cart.map(item => 
      item.id === itemId ? { ...item, quantity: newQuantity } : item
    );
    
    setCart(newCart);
    localStorage.setItem(`cart_${user.id}`, JSON.stringify(newCart));
  };

  const getTotal = () => {
    return cart.reduce((sum, item) => sum + (item.price * item.quantity), 0);
  };

  const handleCheckout = async () => {
    if (cart.length === 0) {
      alert('Корзина пуста!');
      return;
    }

    if (!formData.customerPhone) {
      alert('Пожалуйста, укажите телефон');
      return;
    }

    try {
      setLoading(true);
      
      // Подготавливаем данные для заказа
      const orderData = {
        totalAmount: getTotal(),
        deliveryAddress: formData.deliveryAddress || 'Самовывоз',
        customerName: `${user.firstName} ${user.lastName}`,
        customerPhone: formData.customerPhone,
        customerEmail: user.email,
        specialInstructions: formData.specialInstructions || '',
        paymentMethod: formData.paymentMethod,
        orderItems: cart.map(item => ({
          menuItemId: item.id,
          quantity: item.quantity,
          unitPrice: item.price,
          itemName: item.name
        }))
      };

      console.log('Отправка заказа:', orderData);

      // Используем правильный эндпоинт с обработкой ошибок
      const response = await axios.post(
        `${API_BASE_URL}/client/ClientOrders/create`,
        orderData,
        getAuthHeaders()
      ).catch(error => {
        console.error('Ошибка при отправке запроса:', error);
        console.error('Детали ошибки:', error.response?.data);
        throw error;
      });

      console.log('Ответ от сервера:', response.data);

      // Очищаем корзину
      setCart([]);
      localStorage.removeItem(`cart_${user.id}`);
      
      if (formData.paymentMethod === 'card') {
        navigate(`/client/payment/${response.data.id}`);
      } else {
        navigate('/client/orders', { 
          state: { 
            message: 'Заказ успешно оформлен! Ожидайте подтверждения.' 
          } 
        });
      }
      
    } catch (error) {
      console.error('Ошибка оформления заказа:', error);
      
      let errorMessage = 'Ошибка оформления заказа';
      
      if (error.response?.data?.message) {
        errorMessage = error.response.data.message;
      } else if (error.response?.data?.errors) {
        const errors = error.response.data.errors;
        errorMessage = Object.values(errors).flat().join(', ');
      } else if (error.message === 'Network Error') {
        errorMessage = 'Ошибка сети. Проверьте подключение к серверу';
      }
      
      alert(`Ошибка: ${errorMessage}`);
      
      // Если ошибка 401, перенаправляем на логин
      if (error.response?.status === 401) {
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        navigate('/login');
      }
    } finally {
      setLoading(false);
    }
  };

  if (!user) return null;

  return (
    <div className="client-container">
      <div className="client-header">
        <button 
          style={{
            background: 'transparent',
            color: 'white',
            border: 'none',
            fontSize: '16px',
            cursor: 'pointer',
            padding: '10px',
            borderRadius: '8px',
            display: 'flex',
            alignItems: 'center'
          }}
          onClick={() => navigate('/client')}
        >
          ← Назад в меню
        </button>
        <h1 style={{ margin: 0, fontSize: '24px', fontWeight: 'bold' }}>Корзина</h1>
        <div style={{ width: '80px' }}></div>
      </div>

      {cart.length === 0 ? (
        <div style={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          padding: '80px 20px',
          textAlign: 'center'
        }}>
          <div style={{ fontSize: '80px', marginBottom: '20px', opacity: 0.3 }}>🛒</div>
          <h3>Корзина пуста</h3>
          <p>Добавьте товары из меню</p>
          <button 
            style={{
              background: '#d32f2f',
              color: 'white',
              border: 'none',
              padding: '12px 32px',
              borderRadius: '8px',
              fontSize: '16px',
              cursor: 'pointer',
              marginTop: '20px'
            }}
            onClick={() => navigate('/client')}
          >
            Перейти в меню
          </button>
        </div>
      ) : (
        <div style={{
          display: 'grid',
          gridTemplateColumns: '1fr 400px',
          gap: '40px',
          padding: '40px',
          maxWidth: '1400px',
          margin: '0 auto'
        }}>
          <div style={{
            background: 'white',
            borderRadius: '15px',
            padding: '30px',
            boxShadow: '0 4px 12px rgba(0,0,0,0.08)'
          }}>
            <h2 style={{
              margin: '0 0 20px 0',
              color: '#333',
              fontSize: '20px',
              borderBottom: '2px solid #f0f0f0',
              paddingBottom: '10px'
            }}>Товары в корзине</h2>
            
            <div style={{ marginBottom: '30px' }}>
              {cart.map(item => (
                <div key={item.id} style={{
                  display: 'grid',
                  gridTemplateColumns: '80px 1fr auto',
                  gap: '20px',
                  padding: '20px 0',
                  borderBottom: '1px solid #f0f0f0',
                  alignItems: 'center'
                }}>
                  <div style={{
                    width: '80px',
                    height: '80px',
                    borderRadius: '8px',
                    overflow: 'hidden',
                    background: '#f0f0f0'
                  }}>
                    {item.imageUrl ? (
                      <img src={item.imageUrl} alt={item.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                    ) : (
                      <div style={{
                        width: '100%',
                        height: '100%',
                        background: 'linear-gradient(135deg, #ffcdd2 0%, #ffebee 100%)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        fontSize: '24px',
                        color: '#d32f2f',
                        fontWeight: 'bold'
                      }}>
                        {item.name?.charAt(0)}
                      </div>
                    )}
                  </div>
                  
                  <div style={{ flexGrow: 1 }}>
                    <h3 style={{ margin: '0 0 5px 0', fontSize: '16px', color: '#333' }}>{item.name}</h3>
                    <p style={{ margin: '0 0 10px 0', fontSize: '14px', color: '#666', lineHeight: 1.4 }}>
                      {item.description || ''}
                    </p>
                    <div style={{ fontSize: '16px', fontWeight: 'bold', color: '#d32f2f' }}>
                      {item.price} ₽
                    </div>
                  </div>
                  
                  <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: '10px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px', background: '#f5f5f5', borderRadius: '8px', padding: '5px' }}>
                      <button 
                        style={{
                          background: 'white',
                          border: '1px solid #ddd',
                          width: '30px',
                          height: '30px',
                          borderRadius: '6px',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          cursor: 'pointer',
                          fontSize: '16px'
                        }}
                        onClick={() => updateQuantity(item.id, item.quantity - 1)}
                      >
                        -
                      </button>
                      <span style={{ minWidth: '30px', textAlign: 'center', fontWeight: 'bold' }}>{item.quantity}</span>
                      <button 
                        style={{
                          background: 'white',
                          border: '1px solid #ddd',
                          width: '30px',
                          height: '30px',
                          borderRadius: '6px',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          cursor: 'pointer',
                          fontSize: '16px'
                        }}
                        onClick={() => updateQuantity(item.id, item.quantity + 1)}
                      >
                        +
                      </button>
                    </div>
                    <div style={{ fontSize: '18px', fontWeight: 'bold', color: '#333' }}>
                      {item.price * item.quantity} ₽
                    </div>
                    <button 
                      style={{
                        background: 'transparent',
                        color: '#ff4444',
                        border: '1px solid #ff4444',
                        padding: '5px 15px',
                        borderRadius: '6px',
                        cursor: 'pointer',
                        fontSize: '14px'
                      }}
                      onClick={() => removeFromCart(item.id)}
                    >
                      Удалить
                    </button>
                  </div>
                </div>
              ))}
            </div>
            
            <div style={{ background: '#f9f9f9', padding: '20px', borderRadius: '10px', border: '1px solid #eee' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '10px', fontSize: '16px' }}>
                <span>Количество товаров:</span>
                <span>{cart.reduce((sum, item) => sum + item.quantity, 0)} шт.</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '16px' }}>
                <span>Общая стоимость:</span>
                <span style={{ fontSize: '24px', fontWeight: 'bold', color: '#d32f2f' }}>{getTotal()} ₽</span>
              </div>
            </div>
          </div>

          <div style={{
            background: 'white',
            borderRadius: '15px',
            padding: '30px',
            boxShadow: '0 4px 12px rgba(0,0,0,0.08)',
            height: 'fit-content',
            position: 'sticky',
            top: '100px'
          }}>
            <h2 style={{
              margin: '0 0 20px 0',
              color: '#333',
              fontSize: '20px',
              borderBottom: '2px solid #f0f0f0',
              paddingBottom: '10px'
            }}>Оформление заказа</h2>
            
            <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                <label style={{ fontSize: '14px', fontWeight: '600', color: '#333' }}>Телефон *</label>
                <input
                  type="tel"
                  style={{
                    padding: '12px 15px',
                    border: '2px solid #eee',
                    borderRadius: '8px',
                    fontSize: '14px',
                    fontFamily: 'inherit'
                  }}
                  value={formData.customerPhone}
                  onChange={(e) => setFormData({...formData, customerPhone: e.target.value})}
                  placeholder="+7 (999) 123-45-67"
                  required
                />
              </div>
              
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                <label style={{ fontSize: '14px', fontWeight: '600', color: '#333' }}>Адрес доставки</label>
                <input
                  type="text"
                  style={{
                    padding: '12px 15px',
                    border: '2px solid #eee',
                    borderRadius: '8px',
                    fontSize: '14px',
                    fontFamily: 'inherit'
                  }}
                  value={formData.deliveryAddress}
                  onChange={(e) => setFormData({...formData, deliveryAddress: e.target.value})}
                  placeholder="Улица, дом, квартира (оставьте пустым для самовывоза)"
                />
              </div>
              
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                <label style={{ fontSize: '14px', fontWeight: '600', color: '#333' }}>Особые пожелания</label>
                <textarea
                  style={{
                    padding: '12px 15px',
                    border: '2px solid #eee',
                    borderRadius: '8px',
                    fontSize: '14px',
                    fontFamily: 'inherit',
                    minHeight: '80px',
                    resize: 'vertical'
                  }}
                  value={formData.specialInstructions}
                  onChange={(e) => setFormData({...formData, specialInstructions: e.target.value})}
                  placeholder="Дополнительные пожелания по заказу..."
                />
              </div>
              
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                <label style={{ fontSize: '14px', fontWeight: '600', color: '#333' }}>Способ оплаты</label>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                  <label style={{ display: 'flex', alignItems: 'center', gap: '10px', padding: '15px', border: '2px solid #eee', borderRadius: '8px', cursor: 'pointer' }}>
                    <input
                      type="radio"
                      name="paymentMethod"
                      value="cash"
                      checked={formData.paymentMethod === 'cash'}
                      onChange={(e) => setFormData({...formData, paymentMethod: e.target.value})}
                    />
                    <span>Наличными при получении</span>
                  </label>
                  <label style={{ display: 'flex', alignItems: 'center', gap: '10px', padding: '15px', border: '2px solid #eee', borderRadius: '8px', cursor: 'pointer' }}>
                    <input
                      type="radio"
                      name="paymentMethod"
                      value="card"
                      checked={formData.paymentMethod === 'card'}
                      onChange={(e) => setFormData({...formData, paymentMethod: e.target.value})}
                    />
                    <span> Картой онлайн</span>
                  </label>
                </div>
              </div>
              
              <button 
                style={{
                  background: 'linear-gradient(135deg, #d32f2f, #b71c1c)',
                  color: 'white',
                  border: 'none',
                  padding: '18px',
                  borderRadius: '10px',
                  fontSize: '16px',
                  fontWeight: 'bold',
                  cursor: 'pointer',
                  marginTop: '10px',
                  opacity: loading ? 0.7 : 1
                }}
                onClick={handleCheckout}
                disabled={loading}
              >
                {loading ? 'Оформление...' : `Оформить заказ • ${getTotal()} ₽`}
              </button>
              
              <button 
                style={{
                  background: 'transparent',
                  color: '#666',
                  border: '1px solid #ddd',
                  padding: '15px',
                  borderRadius: '10px',
                  fontSize: '16px',
                  cursor: 'pointer'
                }}
                onClick={() => navigate('/client')}
              >
                ← Продолжить покупки
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ClientCart;