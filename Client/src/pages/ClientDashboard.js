import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';

const API_BASE_URL = 'http://localhost:5110/api';

const ClientDashboard = () => {
  const [user, setUser] = useState(null);
  const [menuItems, setMenuItems] = useState([]);
  const [categories, setCategories] = useState([]);
  const [cart, setCart] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeCategory, setActiveCategory] = useState('all');
  const navigate = useNavigate();

  useEffect(() => {
    const userData = localStorage.getItem('user');
    const token = localStorage.getItem('token');
    
    if (!userData || !token) {
      navigate('/login');
      return;
    }

    const userObj = JSON.parse(userData);
    if (userObj.role !== 'Client') {
      navigate('/admin');
      return;
    }

    setUser(userObj);
    loadMenu();
    
    // Загружаем корзину из localStorage
    const savedCart = localStorage.getItem(`cart_${userObj.id}`);
    if (savedCart) {
      setCart(JSON.parse(savedCart));
    }
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

  const loadMenu = async () => {
    try {
      setLoading(true);
      
      // Загружаем категории
      const categoriesRes = await axios.get(`${API_BASE_URL}/menu/categories`);
      setCategories(categoriesRes.data || []);
      
      // Загружаем доступные товары
      const itemsRes = await axios.get(`${API_BASE_URL}/menu/items`);
      const availableItems = (itemsRes.data || []).filter(item => item.isAvailable);
      setMenuItems(availableItems);
      
    } catch (error) {
      console.error('Ошибка загрузки меню:', error);
    } finally {
      setLoading(false);
    }
  };

  const addToCart = (item) => {
    const newCart = [...cart];
    const existingItemIndex = newCart.findIndex(cartItem => cartItem.id === item.id);
    
    if (existingItemIndex >= 0) {
      newCart[existingItemIndex].quantity += 1;
    } else {
      newCart.push({
        id: item.id,
        name: item.name,
        description: item.description,
        price: item.price,
        imageUrl: item.imageUrl,
        quantity: 1
      });
    }
    
    setCart(newCart);
    localStorage.setItem(`cart_${user.id}`, JSON.stringify(newCart));
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

  const filteredItems = activeCategory === 'all' 
    ? menuItems
    : menuItems.filter(item => item.categoryId == activeCategory);

  if (loading) {
    return (
      <div style={styles.loadingContainer}>
        <div style={styles.spinner}></div>
        <p>Загрузка меню...</p>
      </div>
    );
  }

  return (
    <div style={styles.container}>
      {/* Шапка */}
      <div style={styles.header}>
        <div style={styles.headerLeft}>
          <h1 style={styles.logo}>🍕 Доставка еды</h1>
          <div style={styles.userInfo}>
            <span style={styles.userName}>{user?.firstName} {user?.lastName}</span>
            <span style={styles.userEmail}>{user?.email}</span>
          </div>
        </div>
        
        <div style={styles.headerRight}>
          <button 
            style={styles.cartButton}
            onClick={() => navigate('/client/cart')}
          >
            🛒 Корзина
            {cart.length > 0 && (
              <span style={styles.cartBadge}>{cart.length}</span>
            )}
          </button>
          
          <button 
            style={styles.ordersButton}
            onClick={() => navigate('/client/orders')}
          >
            📋 Мои заказы
          </button>
          
          <button 
            style={styles.logoutButton}
            onClick={() => {
              localStorage.removeItem('token');
              localStorage.removeItem('user');
              navigate('/login');
            }}
          >
            Выйти
          </button>
        </div>
      </div>

      {/* Категории */}
      <div style={styles.categories}>
        <button
          style={{
            ...styles.categoryButton,
            ...(activeCategory === 'all' ? styles.categoryButtonActive : {})
          }}
          onClick={() => setActiveCategory('all')}
        >
          Все
        </button>
        
        {categories.map(category => (
          <button
            key={category.id}
            style={{
              ...styles.categoryButton,
              ...(activeCategory === category.id.toString() ? styles.categoryButtonActive : {})
            }}
            onClick={() => setActiveCategory(category.id.toString())}
          >
            {category.name}
          </button>
        ))}
      </div>

      {/* Меню */}
      <div style={styles.menuGrid}>
        {filteredItems.map(item => (
          <div key={item.id} style={styles.menuItem}>
            <div style={styles.itemImage}>
              {item.imageUrl ? (
                <img src={item.imageUrl} alt={item.name} style={styles.image} />
              ) : (
                <div style={styles.imagePlaceholder}>
                  {item.name?.charAt(0)}
                </div>
              )}
              {item.isPopular && (
                <div style={styles.popularBadge}>🔥 Популярное</div>
              )}
            </div>
            
            <div style={styles.itemInfo}>
              <h3 style={styles.itemName}>{item.name}</h3>
              <p style={styles.itemDescription}>
                {item.description || 'Описание отсутствует'}
              </p>
              
              {item.composition && (
                <div style={styles.composition}>
                  <small>Состав: {item.composition}</small>
                </div>
              )}
              
              <div style={styles.itemBottom}>
                <div>
                  <span style={styles.itemPrice}>
                    {item.price} ₽
                  </span>
                  {item.weight && (
                    <span style={styles.itemWeight}> • {item.weight}г</span>
                  )}
                </div>
                <button 
                  style={styles.addButton}
                  onClick={() => addToCart(item)}
                >
                  Добавить
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Плавающая кнопка корзины для мобильных */}
      {cart.length > 0 && (
        <button 
          style={styles.floatingCartButton}
          onClick={() => navigate('/client/cart')}
        >
          🛒 {cart.length} товаров • {getTotal()} ₽
        </button>
      )}
    </div>
  );
};

const styles = {
  container: {
    minHeight: '100vh',
    background: '#f5f5f5',
  },
  loadingContainer: {
    display: 'flex',
    flexDirection: 'column',
    justifyContent: 'center',
    alignItems: 'center',
    height: '100vh',
  },
  spinner: {
    width: '50px',
    height: '50px',
    border: '3px solid #f3f3f3',
    borderTop: '3px solid #780505',
    borderRadius: '50%',
    animation: 'spin 1s linear infinite',
  },
  header: {
    background: 'linear-gradient(135deg, #780505 0%, #a50606 100%)',
    color: 'white',
    padding: '20px 40px',
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    boxShadow: '0 4px 12px rgba(0,0,0,0.1)',
  },
  headerLeft: {
    display: 'flex',
    alignItems: 'center',
    gap: '30px',
  },
  logo: {
    margin: 0,
    fontSize: '28px',
    fontWeight: 'bold',
  },
  userInfo: {
    display: 'flex',
    flexDirection: 'column',
    fontSize: '14px',
  },
  userName: {
    fontWeight: 'bold',
  },
  userEmail: {
    opacity: 0.8,
  },
  headerRight: {
    display: 'flex',
    gap: '15px',
    alignItems: 'center',
  },
  cartButton: {
    background: 'white',
    color: '#780505',
    border: 'none',
    padding: '12px 24px',
    borderRadius: '50px',
    fontSize: '16px',
    fontWeight: 'bold',
    cursor: 'pointer',
    display: 'flex',
    alignItems: 'center',
    gap: '10px',
    position: 'relative',
    transition: 'all 0.3s ease',
  },
  cartBadge: {
    background: '#ff4444',
    color: 'white',
    borderRadius: '50%',
    width: '24px',
    height: '24px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontSize: '12px',
    position: 'absolute',
    top: '-8px',
    right: '-8px',
  },
  ordersButton: {
    background: 'transparent',
    color: 'white',
    border: '2px solid white',
    padding: '10px 20px',
    borderRadius: '50px',
    fontSize: '16px',
    cursor: 'pointer',
    transition: 'all 0.3s ease',
  },
  logoutButton: {
    background: 'transparent',
    color: 'white',
    border: 'none',
    padding: '10px 20px',
    fontSize: '16px',
    cursor: 'pointer',
    opacity: 0.8,
  },
  categories: {
    display: 'flex',
    gap: '10px',
    padding: '20px 40px',
    background: 'white',
    overflowX: 'auto',
    borderBottom: '1px solid #eee',
  },
  categoryButton: {
    padding: '12px 24px',
    border: '1px solid #ddd',
    background: 'white',
    borderRadius: '50px',
    cursor: 'pointer',
    whiteSpace: 'nowrap',
    fontSize: '14px',
    transition: 'all 0.3s ease',
  },
  categoryButtonActive: {
    background: '#780505',
    color: 'white',
    borderColor: '#780505',
  },
  menuGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))',
    gap: '30px',
    padding: '40px',
  },
  menuItem: {
    background: 'white',
    borderRadius: '15px',
    overflow: 'hidden',
    boxShadow: '0 4px 12px rgba(0,0,0,0.08)',
    transition: 'transform 0.3s ease',
    display: 'flex',
    flexDirection: 'column',
  },
  itemImage: {
    height: '180px',
    background: '#f0f0f0',
    overflow: 'hidden',
    position: 'relative',
  },
  image: {
    width: '100%',
    height: '100%',
    objectFit: 'cover',
  },
  imagePlaceholder: {
    width: '100%',
    height: '100%',
    background: 'linear-gradient(135deg, #ffcccc 0%, #ff9999 100%)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontSize: '48px',
    color: '#780505',
    fontWeight: 'bold',
  },
  popularBadge: {
    position: 'absolute',
    top: '10px',
    left: '10px',
    background: 'rgba(255, 87, 34, 0.9)',
    color: 'white',
    padding: '5px 10px',
    borderRadius: '20px',
    fontSize: '12px',
    fontWeight: 'bold',
  },
  itemInfo: {
    padding: '20px',
    flexGrow: 1,
    display: 'flex',
    flexDirection: 'column',
  },
  itemName: {
    margin: '0 0 10px 0',
    fontSize: '18px',
    color: '#333',
  },
  itemDescription: {
    color: '#666',
    fontSize: '14px',
    lineHeight: 1.5,
    margin: '0 0 10px 0',
    flexGrow: 1,
  },
  composition: {
    color: '#888',
    fontSize: '12px',
    marginBottom: '10px',
    fontStyle: 'italic',
  },
  itemBottom: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  itemPrice: {
    fontSize: '20px',
    fontWeight: 'bold',
    color: '#780505',
  },
  itemWeight: {
    fontSize: '14px',
    color: '#666',
  },
  addButton: {
    background: '#780505',
    color: 'white',
    border: 'none',
    padding: '10px 20px',
    borderRadius: '8px',
    cursor: 'pointer',
    fontWeight: 'bold',
    transition: 'background 0.3s ease',
  },
  floatingCartButton: {
    position: 'fixed',
    bottom: '30px',
    right: '30px',
    background: '#780505',
    color: 'white',
    border: 'none',
    padding: '16px 32px',
    borderRadius: '50px',
    fontSize: '16px',
    fontWeight: 'bold',
    cursor: 'pointer',
    boxShadow: '0 6px 20px rgba(120, 5, 5, 0.3)',
    zIndex: 100,
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

export default ClientDashboard;