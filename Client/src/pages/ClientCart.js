import React, { useState } from 'react';
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

  React.useEffect(() => {
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
      deliveryAddress: userObj.address || '',
      customerName: `${userObj.firstName} ${userObj.lastName}`,
      customerEmail: userObj.email
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
      
      const orderData = {
        userId: user.id,
        status: 'Pending',
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

      const response = await axios.post(
        `${API_BASE_URL}/orders/create`,
        orderData,
        getAuthHeaders()
      );

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
      console.error('Детали ошибки:', error.response?.data);
      alert(`Ошибка оформления заказа: ${error.response?.data?.message || error.message}`);
    } finally {
      setLoading(false);
    }
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
        <h1 style={styles.title}>Корзина</h1>
        <div style={{ width: '80px' }}></div>
      </div>

      {cart.length === 0 ? (
        <div style={styles.emptyCart}>
          <div style={styles.emptyIcon}>🛒</div>
          <h3>Корзина пуста</h3>
          <p>Добавьте товары из меню</p>
          <button 
            style={styles.menuButton}
            onClick={() => navigate('/client')}
          >
            Перейти в меню
          </button>
        </div>
      ) : (
        <div style={styles.content}>
          <div style={styles.cartSection}>
            <h2 style={styles.sectionTitle}>Товары в корзине</h2>
            
            <div style={styles.cartItems}>
              {cart.map(item => (
                <div key={item.id} style={styles.cartItem}>
                  <div style={styles.itemImage}>
                    {item.imageUrl ? (
                      <img src={item.imageUrl} alt={item.name} style={styles.itemImageImg} />
                    ) : (
                      <div style={styles.itemImagePlaceholder}>
                        {item.name?.charAt(0)}
                      </div>
                    )}
                  </div>
                  
                  <div style={styles.itemDetails}>
                    <h3 style={styles.itemName}>{item.name}</h3>
                    <p style={styles.itemDescription}>
                      {item.description || ''}
                    </p>
                    <div style={styles.itemPrice}>
                      {item.price} ₽
                    </div>
                  </div>
                  
                  <div style={styles.itemControls}>
                    <div style={styles.quantityControl}>
                      <button 
                        style={styles.quantityButton}
                        onClick={() => updateQuantity(item.id, item.quantity - 1)}
                      >
                        -
                      </button>
                      <span style={styles.quantityValue}>{item.quantity}</span>
                      <button 
                        style={styles.quantityButton}
                        onClick={() => updateQuantity(item.id, item.quantity + 1)}
                      >
                        +
                      </button>
                    </div>
                    <div style={styles.itemTotal}>
                      {item.price * item.quantity} ₽
                    </div>
                    <button 
                      style={styles.removeButton}
                      onClick={() => removeFromCart(item.id)}
                    >
                      Удалить
                    </button>
                  </div>
                </div>
              ))}
            </div>
            
            <div style={styles.cartSummary}>
              <div style={styles.summaryRow}>
                <span>Количество товаров:</span>
                <span>{cart.reduce((sum, item) => sum + item.quantity, 0)} шт.</span>
              </div>
              <div style={styles.summaryRow}>
                <span>Общая стоимость:</span>
                <span style={styles.totalPrice}>{getTotal()} ₽</span>
              </div>
            </div>
          </div>

          <div style={styles.checkoutSection}>
            <h2 style={styles.sectionTitle}>Оформление заказа</h2>
            
            <div style={styles.checkoutForm}>
              <div style={styles.formGroup}>
                <label style={styles.label}>Телефон *</label>
                <input
                  type="tel"
                  style={styles.input}
                  value={formData.customerPhone}
                  onChange={(e) => setFormData({...formData, customerPhone: e.target.value})}
                  placeholder="+7 (999) 123-45-67"
                  required
                />
              </div>
              
              <div style={styles.formGroup}>
                <label style={styles.label}>Адрес доставки</label>
                <input
                  type="text"
                  style={styles.input}
                  value={formData.deliveryAddress}
                  onChange={(e) => setFormData({...formData, deliveryAddress: e.target.value})}
                  placeholder="Улица, дом, квартира (оставьте пустым для самовывоза)"
                />
              </div>
              
              <div style={styles.formGroup}>
                <label style={styles.label}>Особые пожелания</label>
                <textarea
                  style={{...styles.input, minHeight: '80px', resize: 'vertical'}}
                  value={formData.specialInstructions}
                  onChange={(e) => setFormData({...formData, specialInstructions: e.target.value})}
                  placeholder="Дополнительные пожелания по заказу..."
                />
              </div>
              
              <div style={styles.formGroup}>
                <label style={styles.label}>Способ оплаты</label>
                <div style={styles.paymentMethods}>
                  <label style={styles.paymentMethod}>
                    <input
                      type="radio"
                      name="paymentMethod"
                      value="cash"
                      checked={formData.paymentMethod === 'cash'}
                      onChange={(e) => setFormData({...formData, paymentMethod: e.target.value})}
                    />
                    <span>💵 Наличными при получении</span>
                  </label>
                  <label style={styles.paymentMethod}>
                    <input
                      type="radio"
                      name="paymentMethod"
                      value="card"
                      checked={formData.paymentMethod === 'card'}
                      onChange={(e) => setFormData({...formData, paymentMethod: e.target.value})}
                    />
                    <span>💳 Картой онлайн</span>
                  </label>
                </div>
              </div>
              
              <button 
                style={{
                  ...styles.checkoutButton,
                  ...(loading ? styles.checkoutButtonDisabled : {})
                }}
                onClick={handleCheckout}
                disabled={loading}
              >
                {loading ? 'Оформление...' : `Оформить заказ • ${getTotal()} ₽`}
              </button>
              
              <button 
                style={styles.continueButton}
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
  emptyCart: {
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
    display: 'grid',
    gridTemplateColumns: '1fr 400px',
    gap: '40px',
    padding: '40px',
    maxWidth: '1400px',
    margin: '0 auto',
  },
  cartSection: {
    background: 'white',
    borderRadius: '15px',
    padding: '30px',
    boxShadow: '0 4px 12px rgba(0,0,0,0.08)',
  },
  sectionTitle: {
    margin: '0 0 20px 0',
    color: '#333',
    fontSize: '20px',
    borderBottom: '2px solid #f0f0f0',
    paddingBottom: '10px',
  },
  cartItems: {
    marginBottom: '30px',
  },
  cartItem: {
    display: 'grid',
    gridTemplateColumns: '80px 1fr auto',
    gap: '20px',
    padding: '20px 0',
    borderBottom: '1px solid #f0f0f0',
    alignItems: 'center',
  },
  itemImage: {
    width: '80px',
    height: '80px',
    borderRadius: '8px',
    overflow: 'hidden',
    background: '#f0f0f0',
  },
  itemImageImg: {
    width: '100%',
    height: '100%',
    objectFit: 'cover',
  },
  itemImagePlaceholder: {
    width: '100%',
    height: '100%',
    background: 'linear-gradient(135deg, #ffcccc 0%, #ff9999 100%)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontSize: '24px',
    color: '#780505',
    fontWeight: 'bold',
  },
  itemDetails: {
    flexGrow: 1,
  },
  itemName: {
    margin: '0 0 5px 0',
    fontSize: '16px',
    color: '#333',
  },
  itemDescription: {
    margin: '0 0 10px 0',
    fontSize: '14px',
    color: '#666',
    lineHeight: 1.4,
  },
  itemPrice: {
    fontSize: '16px',
    fontWeight: 'bold',
    color: '#780505',
  },
  itemControls: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'flex-end',
    gap: '10px',
  },
  quantityControl: {
    display: 'flex',
    alignItems: 'center',
    gap: '10px',
    background: '#f5f5f5',
    borderRadius: '8px',
    padding: '5px',
  },
  quantityButton: {
    background: 'white',
    border: '1px solid #ddd',
    width: '30px',
    height: '30px',
    borderRadius: '6px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    cursor: 'pointer',
    fontSize: '16px',
  },
  quantityValue: {
    minWidth: '30px',
    textAlign: 'center',
    fontWeight: 'bold',
  },
  itemTotal: {
    fontSize: '18px',
    fontWeight: 'bold',
    color: '#333',
  },
  removeButton: {
    background: 'transparent',
    color: '#ff4444',
    border: '1px solid #ff4444',
    padding: '5px 15px',
    borderRadius: '6px',
    cursor: 'pointer',
    fontSize: '14px',
    transition: 'all 0.3s ease',
  },
  cartSummary: {
    background: '#f9f9f9',
    padding: '20px',
    borderRadius: '10px',
    border: '1px solid #eee',
  },
  summaryRow: {
    display: 'flex',
    justifyContent: 'space-between',
    marginBottom: '10px',
    fontSize: '16px',
  },
  totalPrice: {
    fontSize: '24px',
    fontWeight: 'bold',
    color: '#780505',
  },
  checkoutSection: {
    background: 'white',
    borderRadius: '15px',
    padding: '30px',
    boxShadow: '0 4px 12px rgba(0,0,0,0.08)',
    height: 'fit-content',
    position: 'sticky',
    top: '100px',
  },
  checkoutForm: {
    display: 'flex',
    flexDirection: 'column',
    gap: '20px',
  },
  formGroup: {
    display: 'flex',
    flexDirection: 'column',
    gap: '8px',
  },
  label: {
    fontSize: '14px',
    fontWeight: '600',
    color: '#333',
  },
  input: {
    padding: '12px 15px',
    border: '2px solid #eee',
    borderRadius: '8px',
    fontSize: '14px',
    transition: 'border-color 0.3s ease',
    fontFamily: 'inherit',
  },
  paymentMethods: {
    display: 'flex',
    flexDirection: 'column',
    gap: '10px',
  },
  paymentMethod: {
    display: 'flex',
    alignItems: 'center',
    gap: '10px',
    padding: '15px',
    border: '2px solid #eee',
    borderRadius: '8px',
    cursor: 'pointer',
    transition: 'all 0.3s ease',
  },
  checkoutButton: {
    background: 'linear-gradient(135deg, #780505, #b71c1c)',
    color: 'white',
    border: 'none',
    padding: '18px',
    borderRadius: '10px',
    fontSize: '16px',
    fontWeight: 'bold',
    cursor: 'pointer',
    transition: 'all 0.3s ease',
    marginTop: '10px',
  },
  checkoutButtonDisabled: {
    opacity: 0.7,
    cursor: 'not-allowed',
  },
  continueButton: {
    background: 'transparent',
    color: '#666',
    border: '1px solid #ddd',
    padding: '15px',
    borderRadius: '10px',
    fontSize: '16px',
    cursor: 'pointer',
    transition: 'all 0.3s ease',
  },
};

export default ClientCart;