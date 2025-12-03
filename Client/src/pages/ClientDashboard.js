import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import '../styles/clientDashboard.css';

const API_BASE_URL = 'http://localhost:5110/api';

const ClientDashboard = () => {
  const [user, setUser] = useState(null);
  const [menuItems, setMenuItems] = useState([]);
  const [categories, setCategories] = useState([]);
  const [cart, setCart] = useState([]);
  const [loading, setLoading] = useState(true);
  const [menuLoading, setMenuLoading] = useState(true);
  const [activeCategory, setActiveCategory] = useState('all');
  const [error, setError] = useState('');
  const navigate = useNavigate();

  // Проверка авторизации и загрузка данных
  useEffect(() => {
    const checkAuthAndLoad = async () => {
      const userData = localStorage.getItem('user');
      const token = localStorage.getItem('token');
      
      if (!userData || !token) {
        navigate('/login');
        return;
      }

      try {
        const userObj = JSON.parse(userData);
        
        if (userObj.role === 'Admin') {
          navigate('/admin');
          return;
        } else if (userObj.role === 'Courier') {
          navigate('/courier');
          return;
        }
        
        setUser(userObj);
        
        // Загружаем корзину
        const cartKey = `cart_${userObj.id}`;
        const savedCart = localStorage.getItem(cartKey);
        
        if (savedCart) {
          try {
            const cartData = JSON.parse(savedCart);
            setCart(cartData);
          } catch (error) {
            console.error('Ошибка парсинга корзины:', error);
            setCart([]);
          }
        } else {
          setCart([]);
        }
        
        // Загружаем меню
        await loadMenu(token);
        
      } catch (error) {
        console.error('Ошибка инициализации:', error);
        setError('Ошибка загрузки данных');
      } finally {
        setLoading(false);
      }
    };

    checkAuthAndLoad();
  }, [navigate]);

  // Загрузка меню
  const loadMenu = async (token) => {
    try {
      setMenuLoading(true);
      setError('');
      
      const headers = token ? {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      } : {
        'Content-Type': 'application/json'
      };
      
      // Загружаем категории
      const categoriesRes = await axios.get(`${API_BASE_URL}/menu/categories`, { headers });
      setCategories(categoriesRes.data || []);
      
      // Загружаем товары
      let itemsRes;
      try {
        itemsRes = await axios.get(`${API_BASE_URL}/menu/items`, { headers });
      } catch (error) {
        try {
          itemsRes = await axios.get(`${API_BASE_URL}/menu/available-items`, { headers });
        } catch (error2) {
          itemsRes = await axios.get(`${API_BASE_URL}/menu/items`);
        }
      }
      
      console.log('Загруженные товары:', itemsRes.data);
      setMenuItems(itemsRes.data || []);
      
    } catch (error) {
      console.error('Ошибка загрузки меню:', error);
      
      if (error.response?.status === 403 || error.response?.status === 401) {
        setError('Ошибка авторизации. Пожалуйста, войдите снова.');
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        navigate('/login');
      } else {
        setError('Ошибка загрузки меню. Попробуйте обновить страницу.');
      }
      
      setMenuItems([]);
    } finally {
      setMenuLoading(false);
    }
  };

  // Обновление корзины в localStorage
  useEffect(() => {
    if (user?.id) {
      const cartKey = `cart_${user.id}`;
      localStorage.setItem(cartKey, JSON.stringify(cart));
    }
  }, [cart, user]);

  // Функция добавления в корзину
  const addToCart = (item) => {
    if (!user || !user.id) {
      alert('Пожалуйста, войдите в систему для добавления в корзину');
      navigate('/login');
      return;
    }

    if (!item || !item.id) {
      alert('Ошибка: неверный товар');
      return;
    }

    // Создаем новый элемент для корзины
    const cartItem = {
      id: item.id,
      name: item.name || 'Без названия',
      description: item.description || '',
      price: item.price || 0,
      imageUrl: item.imageUrl || '',
      categoryName: item.categoryName || '',
      quantity: 1
    };

    // Ищем товар в корзине
    const existingItemIndex = cart.findIndex(cartItem => cartItem.id === item.id);
    
    let newCart;
    if (existingItemIndex >= 0) {
      newCart = [...cart];
      newCart[existingItemIndex].quantity += 1;
    } else {
      newCart = [...cart, cartItem];
    }
    
    setCart(newCart);
    showNotification(`${item.name} добавлен в корзину!`);
  };

  const showNotification = (message) => {
    // Удаляем старые уведомления
    const oldNotifications = document.querySelectorAll('.notification');
    oldNotifications.forEach(notification => notification.remove());

    const notification = document.createElement('div');
    notification.className = 'notification';
    notification.style.cssText = `
      position: fixed;
      top: 100px;
      right: 20px;
      background: linear-gradient(135deg, #4CAF50, #2E7D32);
      color: white;
      padding: 15px 25px;
      border-radius: 10px;
      box-shadow: 0 4px 15px rgba(0,0,0,0.2);
      z-index: 1000;
      font-weight: bold;
      animation: slideIn 0.3s ease-out;
      max-width: 300px;
      display: flex;
      align-items: center;
      gap: 10px;
    `;
    
    notification.innerHTML = `
      <div style="font-size: 20px; background: white; color: #2E7D32; width: 30px; height: 30px; border-radius: 50%; display: flex; align-items: center; justify-content: center; font-weight: bold;">✓</div>
      <div>${message}</div>
    `;
    
    document.body.appendChild(notification);
    
    setTimeout(() => {
      notification.style.animation = 'slideOut 0.3s ease-in';
      setTimeout(() => {
        if (notification.parentNode) {
          notification.parentNode.removeChild(notification);
        }
      }, 300);
    }, 3000);
  };

  const removeFromCart = (itemId) => {
    const newCart = cart.filter(item => item.id !== itemId);
    setCart(newCart);
    showNotification('Товар удален из корзины');
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
  };

  const getTotal = () => {
    return cart.reduce((sum, item) => sum + (item.price * item.quantity), 0);
  };

  const getTotalItems = () => {
    return cart.reduce((sum, item) => sum + item.quantity, 0);
  };

  const filteredItems = activeCategory === 'all' 
    ? menuItems
    : menuItems.filter(item => item.categoryId == activeCategory);

  if (loading) {
    return (
      <div className="loading-container">
        <div className="spinner">
          <div className="spinner-icon"></div>
        </div>
        <p>Загрузка панели...</p>
      </div>
    );
  }

  if (!user) {
    return null;
  }

  return (
    <div className="client-container">
      {/* Сообщение об ошибке */}
      {error && (
        <div className="error-banner">
          <span className="error-icon">!</span>
          {error}
          <button 
            onClick={() => {
              const token = localStorage.getItem('token');
              if (token) loadMenu(token);
            }}
            className="retry-button"
          >
            Повторить
          </button>
        </div>
      )}

      {/* Категории */}
      <div className="categories-container">
        <div className="categories-list">
          <button
            className={`category-button ${activeCategory === 'all' ? 'active' : ''}`}
            onClick={() => setActiveCategory('all')}
          >
            Все
          </button>
          
          {categories.map(category => (
            <button
              key={category.id}
              className={`category-button ${activeCategory === category.id.toString() ? 'active' : ''}`}
              onClick={() => setActiveCategory(category.id.toString())}
            >
              {category.name}
            </button>
          ))}
        </div>
      </div>

      {/* Основной контент */}
      <div className="client-content">
        {/* Загрузка меню */}
        {menuLoading ? (
          <div className="loading-menu">
            <div className="spinner-icon large"></div>
            <p>Загрузка меню...</p>
          </div>
        ) : (
          /* Меню */
          <div className="menu-grid">
            {filteredItems.length === 0 ? (
              <div className="empty-menu">
                <div className="empty-menu-icon">🍽️</div>
                <h3>Нет доступных товаров</h3>
                <p>Попробуйте обновить страницу или выберите другую категорию</p>
                <button 
                  className="refresh-button"
                  onClick={() => {
                    const token = localStorage.getItem('token');
                    if (token) loadMenu(token);
                  }}
                >
                  Обновить меню
                </button>
              </div>
            ) : (
              filteredItems.map(item => {
                return (
                  <div key={item.id} className="menu-item">
                    <div className="item-image">
                      {item.imageUrl ? (
                        <img src={item.imageUrl} alt={item.name} />
                      ) : (
                        <div className="image-placeholder">
                          <span className="placeholder-text">ФОТО</span>
                        </div>
                      )}
                    </div>
                    
                    <div className="item-info">
                      <h3 className="item-name">{item.name}</h3>
                      <p className="item-description">
                        {item.description || 'Описание отсутствует'}
                      </p>
                      
                      {item.composition && (
                        <div className="composition">
                          <small>Состав: {item.composition}</small>
                        </div>
                      )}
                      
                      <div className="item-bottom">
                        <div>
                          <span className="item-price">
                            {item.price || 0} ₽
                          </span>
                          {item.weight && (
                            <span className="item-weight"> • {item.weight}г</span>
                          )}
                        </div>
                        <button 
                          className="add-button"
                          onClick={() => addToCart(item)}
                          disabled={item.isAvailable === false}
                          title={item.isAvailable === false ? 'Нет в наличии' : 'Добавить в корзину'}
                        >
                          {item.isAvailable === false ? 'Нет в наличии' : 'Добавить'}
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        )}
      </div>

      {/* Плавающая кнопка корзины */}
      {cart.length > 0 && (
        <button 
          className="floating-cart-button"
          onClick={() => navigate('/client/cart')}
        >
          <span className="cart-icon">🛒</span>
          {getTotalItems()} товаров • {getTotal()} ₽
        </button>
      )}
    </div>
  );
};

// Добавляем глобальные стили для уведомлений
if (typeof document !== 'undefined') {
  const style = document.createElement('style');
  style.textContent = `
    @keyframes spin {
      0% { transform: rotate(0deg); }
      100% { transform: rotate(360deg); }
    }
    
    @keyframes slideIn {
      from {
        transform: translateX(100%);
        opacity: 0;
      }
      to {
        transform: translateX(0);
        opacity: 1;
      }
    }
    
    @keyframes slideOut {
      from {
        transform: translateX(0);
        opacity: 1;
      }
      to {
        transform: translateX(100%);
        opacity: 0;
      }
    }
    
    .spinner-icon {
      width: 40px;
      height: 40px;
      border: 4px solid #ffeaea;
      border-top: 4px solid #8b0000;
      border-radius: 50%;
      animation: spin 1s linear infinite;
      margin: 0 auto;
    }
    
    .spinner-icon.large {
      width: 50px;
      height: 50px;
    }
    
    .error-icon {
      display: inline-flex;
      align-items: center;
      justify-content: center;
      width: 24px;
      height: 24px;
      background: white;
      color: #d32f2f;
      border-radius: 50%;
      font-weight: bold;
      margin-right: 10px;
    }
    
    .empty-menu-icon {
      font-size: 60px;
      opacity: 0.3;
      margin-bottom: 20px;
    }
    
    .placeholder-text {
      color: rgba(0, 0, 0, 0.2);
      font-size: 14px;
      font-weight: bold;
    }
    
    .cart-icon {
      margin-right: 8px;
    }
    
    .refresh-button {
      background: #d32f2f;
      color: white;
      border: none;
      padding: 12px 24px;
      border-radius: 8px;
      cursor: pointer;
      margin-top: 20px;
      font-size: 16px;
    }
    
    .refresh-button:hover {
      background: #b71c1c;
    }
  `;
  document.head.appendChild(style);
}

export default ClientDashboard;