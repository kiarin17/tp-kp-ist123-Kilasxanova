import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import '../styles/menu.css';
import axios from 'axios';

// Импортируем изображения
import dish1Image from '../img/dish1Image.png';

const Menu = () => {
  const [menuItems, setMenuItems] = useState([]);
  const [categories, setCategories] = useState([]);
  const [selectedCategory, setSelectedCategory] = useState(null);
  const [loading, setLoading] = useState(true);
  const [isAdmin, setIsAdmin] = useState(false);
  const [showAddForm, setShowAddForm] = useState(false);
  const [editingItem, setEditingItem] = useState(null);
  const [showDeletedItems, setShowDeletedItems] = useState(false); // Новое состояние
  const [deletedItems, setDeletedItems] = useState([]); // Новое состояние

  // Форма для добавления/редактирования
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    price: '',
    categoryId: '',
    preparationTime: '',
    weight: '',
    composition: '',
    imageUrl: ''
  });

  useEffect(() => {
    fetchMenuData();
    checkAdminStatus();
    fetchDeletedItems(); // Загружаем удаленные блюда
  }, []);

  const fetchMenuData = async () => {
    try {
      setLoading(true);
      const [categoriesRes, itemsRes] = await Promise.all([
        axios.get('http://localhost:5110/api/menu/categories'),
        axios.get('http://localhost:5110/api/menu/items')
      ]);
      
      setCategories(categoriesRes.data);
      setMenuItems(itemsRes.data);
    } catch (error) {
      console.error('Ошибка загрузки меню:', error);
      showNotification('Ошибка загрузки меню', 'error');
    } finally {
      setLoading(false);
    }
  };

  const fetchDeletedItems = async () => {
    try {
      const token = localStorage.getItem('token');
      // Создаем отдельный endpoint для получения всех блюд (включая неактивные)
      const response = await axios.get('http://localhost:5110/api/menu/all-items', {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      // Фильтруем только неактивные блюда
      const inactiveItems = response.data.filter(item => !item.isAvailable);
      setDeletedItems(inactiveItems);
    } catch (error) {
      console.error('Ошибка загрузки удаленных блюд:', error);
      // Если endpoint не существует, игнорируем
    }
  };

  const checkAdminStatus = () => {
    const userData = localStorage.getItem('user');
    if (userData) {
      try {
        const userObj = JSON.parse(userData);
        setIsAdmin(userObj.role === 'Admin');
      } catch (e) {
        console.error('Ошибка чтения пользователя:', e);
      }
    }
  };

  const showNotification = (message, type) => {
    const notification = document.createElement('div');
    notification.className = `notification notification-${type}`;
    notification.textContent = message;
    notification.style.cssText = `
      position: fixed;
      top: 20px;
      right: 20px;
      padding: 16px 24px;
      background: ${type === 'success' ? '#388e3c' : '#d32f2f'};
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

  // ============ УПРАВЛЕНИЕ БЛЮДАМИ ============
  const handleAddItem = async (e) => {
    e.preventDefault();
    try {
      const token = localStorage.getItem('token');
      await axios.post('http://localhost:5110/api/menu/items', {
        ...formData,
        price: parseFloat(formData.price),
        categoryId: parseInt(formData.categoryId),
        preparationTime: formData.preparationTime ? parseInt(formData.preparationTime) : null,
        weight: formData.weight || null,
        composition: formData.composition || ''
      }, {
        headers: { Authorization: `Bearer ${token}` }
      });

      setShowAddForm(false);
      setFormData({ 
        name: '', 
        description: '', 
        price: '', 
        categoryId: '', 
        preparationTime: '', 
        weight: '',
        composition: '',
        imageUrl: '' 
      });
      
      fetchMenuData();
      fetchDeletedItems(); // Обновляем список удаленных
      showNotification('Блюдо добавлено', 'success');
    } catch (error) {
      console.error('Ошибка добавления:', error);
      showNotification(error.response?.data?.message || 'Ошибка добавления блюда', 'error');
    }
  };

  const handleEditItem = (item) => {
    setEditingItem(item);
    setFormData({
      name: item.name,
      description: item.description,
      price: item.price.toString(),
      categoryId: item.categoryId.toString(),
      preparationTime: item.preparationTime?.toString() || '',
      weight: item.weight || '',
      composition: item.composition || '',
      imageUrl: item.imageUrl || ''
    });
    setShowAddForm(true);
  };

  const handleUpdateItem = async (e) => {
    e.preventDefault();
    try {
      const token = localStorage.getItem('token');
      await axios.put(`http://localhost:5110/api/menu/items/${editingItem.id}`, {
        ...formData,
        price: parseFloat(formData.price),
        categoryId: parseInt(formData.categoryId),
        preparationTime: formData.preparationTime ? parseInt(formData.preparationTime) : null,
        weight: formData.weight || null,
        composition: formData.composition || '',
        isAvailable: true // Убедимся что блюдо остается активным
      }, {
        headers: { Authorization: `Bearer ${token}` }
      });

      setShowAddForm(false);
      setEditingItem(null);
      setFormData({ 
        name: '', 
        description: '', 
        price: '', 
        categoryId: '', 
        preparationTime: '', 
        weight: '',
        composition: '',
        imageUrl: '' 
      });
      
      // Обновляем данные и показываем уведомление
      await fetchMenuData();
      showNotification('Блюдо обновлено', 'success');
    } catch (error) {
      console.error('Ошибка редактирования:', error);
      showNotification(error.response?.data?.message || 'Ошибка обновления блюда', 'error');
    }
  };

  const handleDeleteItem = async (itemId) => {
    if (window.confirm('Вы уверены что хотите скрыть это блюдо? Его можно будет восстановить позже.')) {
      try {
        const token = localStorage.getItem('token');
        await axios.delete(`http://localhost:5110/api/menu/items/${itemId}`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        
        await fetchMenuData();
        await fetchDeletedItems(); // Обновляем список удаленных
        showNotification('Блюдо скрыто (можно восстановить)', 'success');
      } catch (error) {
        console.error('Ошибка удаления:', error);
        showNotification('Ошибка скрытия блюда', 'error');
      }
    }
  };

  // ============ ВОССТАНОВЛЕНИЕ УДАЛЕННЫХ БЛЮД ============
  const handleRestoreItem = async (itemId) => {
    try {
      const token = localStorage.getItem('token');
      await axios.put(`http://localhost:5110/api/menu/items/${itemId}/restore`, {}, {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      await fetchMenuData();
      await fetchDeletedItems();
      showNotification('Блюдо восстановлено', 'success');
    } catch (error) {
      console.error('Ошибка восстановления:', error);
      showNotification('Ошибка восстановления блюда', 'error');
    }
  };

  // ============ КОРЗИНА ============
  const handleAddToCart = (item) => {
    // Логика добавления в корзину
    const cart = JSON.parse(localStorage.getItem('cart')) || [];
    const existingItem = cart.find(cartItem => cartItem.id === item.id);
    
    if (existingItem) {
      existingItem.quantity += 1;
    } else {
      cart.push({
        id: item.id,
        name: item.name,
        price: item.price,
        quantity: 1,
        image: item.imageUrl
      });
    }
    
    localStorage.setItem('cart', JSON.stringify(cart));
    showNotification(`${item.name} добавлен в корзину!`, 'success');
    
    // Можно обновить счетчик корзины в header
    const event = new CustomEvent('cartUpdated');
    window.dispatchEvent(event);
  };

  const filteredItems = selectedCategory 
    ? menuItems.filter(item => item.categoryId === selectedCategory)
    : menuItems;

  if (loading) {
    return (
      <>
      
        <div className="menu-container">
          <div className="loading">Загрузка меню...</div>
        </div>
      </>
    );
  }

  return (
    <>
      
      <div className="menu-container">
        <div className="menu-header">
          <h1 className="menu-title">Меню</h1>
        </div>

        {/* Кнопка просмотра удаленных блюд для админа */}
        {isAdmin && deletedItems.length > 0 && (
          <div className="deleted-items-control" style={{ textAlign: 'center', marginBottom: '20px' }}>
            <button 
              className="show-deleted-btn"
              onClick={() => setShowDeletedItems(!showDeletedItems)}
              style={{
                background: '#6c757d',
                color: 'white',
                border: 'none',
                padding: '10px 20px',
                borderRadius: '8px',
                cursor: 'pointer',
                fontSize: '14px',
                fontWeight: '600'
              }}
            >
              {showDeletedItems ? 'Скрыть удаленные блюда' : `Показать удаленные блюда (${deletedItems.length})`}
            </button>
          </div>
        )}

        {/* Фильтр по категориям - БЕЗ иконок */}
        <div className="categories-filter">
          <button 
            className={`category-btn ${selectedCategory === null ? 'active' : ''}`}
            onClick={() => setSelectedCategory(null)}
          >
            Все блюда
          </button>
          {categories.map(category => (
            <button
              key={category.id}
              className={`category-btn ${selectedCategory === category.id ? 'active' : ''}`}
              onClick={() => setSelectedCategory(category.id)}
            >
              {category.name}
            </button>
          ))}
        </div>

        {/* ТОЛЬКО кнопка добавления блюда для админа */}
        {isAdmin && (
          <div className="admin-controls">
            <button 
              className="add-item-btn"
              onClick={() => {
                setEditingItem(null);
                setFormData({ 
                  name: '', 
                  description: '', 
                  price: '', 
                  categoryId: categories.length > 0 ? categories[0].id.toString() : '', 
                  preparationTime: '', 
                  weight: '',
                  composition: '',
                  imageUrl: '' 
                });
                setShowAddForm(true);
              }}
            >
              Добавить блюдо
            </button>
          </div>
        )}

        {/* Список удаленных блюд (только для админа) */}
        {isAdmin && showDeletedItems && deletedItems.length > 0 && (
          <div className="deleted-items-section">
            <h3 style={{ 
              color: '#780505', 
              textAlign: 'center', 
              marginBottom: '20px',
              borderBottom: '2px solid #ffeaea',
              paddingBottom: '10px'
            }}>
              Удаленные блюда (можно восстановить)
            </h3>
            <div className="deleted-items-list">
              {deletedItems.map(item => (
                <div key={item.id} className="deleted-item-card">
                  <div style={{ display: 'flex', alignItems: 'center', gap: '15px' }}>
                    <img 
                      src={item.imageUrl || dish1Image} 
                      alt={item.name}
                      style={{ 
                        width: '80px', 
                        height: '80px', 
                        objectFit: 'cover',
                        borderRadius: '8px'
                      }}
                    />
                    <div>
                      <h4 style={{ margin: '0 0 5px 0', color: '#333' }}>{item.name}</h4>
                      <p style={{ margin: '0 0 5px 0', color: '#666', fontSize: '14px' }}>
                        {item.description?.substring(0, 100)}...
                      </p>
                      <p style={{ margin: 0, color: '#780505', fontWeight: 'bold' }}>
                        {item.price} ₽
                      </p>
                    </div>
                  </div>
                  <div style={{ display: 'flex', gap: '10px' }}>
                    <button 
                      onClick={() => handleRestoreItem(item.id)}
                      style={{
                        background: '#4caf50',
                        color: 'white',
                        border: 'none',
                        padding: '8px 16px',
                        borderRadius: '6px',
                        cursor: 'pointer',
                        fontSize: '14px'
                      }}
                    >
                      Восстановить
                    </button>
                    <button 
                      onClick={() => handleEditItem(item)}
                      style={{
                        background: '#2196f3',
                        color: 'white',
                        border: 'none',
                        padding: '8px 16px',
                        borderRadius: '6px',
                        cursor: 'pointer',
                        fontSize: '14px'
                      }}
                    >
                      Редактировать
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Форма добавления/редактирования блюда */}
        {showAddForm && (
          <div className="modal-overlay" onClick={() => setShowAddForm(false)}>
            <div className="modal-content" onClick={(e) => e.stopPropagation()}>
              <h3>{editingItem ? 'Редактировать блюдо' : 'Добавить новое блюдо'}</h3>
              <form onSubmit={editingItem ? handleUpdateItem : handleAddItem}>
                <div className="form-row">
                  <div className="form-group">
                    <label>Название блюда *</label>
                    <input
                      type="text"
                      value={formData.name}
                      onChange={(e) => setFormData({...formData, name: e.target.value})}
                      required
                      placeholder="Введите название"
                    />
                  </div>
                  <div className="form-group">
                    <label>Цена (₽) *</label>
                    <input
                      type="number"
                      value={formData.price}
                      onChange={(e) => setFormData({...formData, price: e.target.value})}
                      step="0.01"
                      required
                      placeholder="0.00"
                    />
                  </div>
                </div>

                <div className="form-group">
                  <label>Описание *</label>
                  <textarea
                    value={formData.description}
                    onChange={(e) => setFormData({...formData, description: e.target.value})}
                    required
                    placeholder="Описание блюда..."
                    rows="3"
                  />
                </div>

                <div className="form-row">
                  <div className="form-group">
                    <label>Состав</label>
                    <input
                      type="text"
                      value={formData.composition}
                      onChange={(e) => setFormData({...formData, composition: e.target.value})}
                      placeholder="Ингредиенты через запятую"
                    />
                  </div>
                  <div className="form-group">
                    <label>Вес/порция</label>
                    <input
                      type="text"
                      value={formData.weight}
                      onChange={(e) => setFormData({...formData, weight: e.target.value})}
                      placeholder="Например: 430г"
                    />
                  </div>
                </div>

                <div className="form-row">
                  <div className="form-group">
                    <label>Категория *</label>
                    <select
                      value={formData.categoryId}
                      onChange={(e) => setFormData({...formData, categoryId: e.target.value})}
                      required
                    >
                      <option value="">Выберите категорию</option>
                      {categories.map(cat => (
                        <option key={cat.id} value={cat.id}>{cat.name}</option>
                      ))}
                    </select>
                  </div>
                  <div className="form-group">
                    <label>Время приготовления (мин)</label>
                    <input
                      type="number"
                      value={formData.preparationTime}
                      onChange={(e) => setFormData({...formData, preparationTime: e.target.value})}
                      placeholder="Например: 30"
                    />
                  </div>
                </div>

                <div className="form-group">
                  <label>URL изображения</label>
                  <input
                    type="text"
                    value={formData.imageUrl}
                    onChange={(e) => setFormData({...formData, imageUrl: e.target.value})}
                    placeholder="https://example.com/image.jpg"
                  />
                  {formData.imageUrl && (
                    <div className="image-preview" style={{
                      marginTop: '10px',
                      width: '100px',
                      height: '100px',
                      borderRadius: '8px',
                      overflow: 'hidden',
                      border: '2px solid #ffeaea'
                    }}>
                      <img 
                        src={formData.imageUrl} 
                        alt="Preview" 
                        style={{width: '100%', height: '100%', objectFit: 'cover'}}
                        onError={(e) => {
                          e.target.style.display = 'none';
                          e.target.parentElement.innerHTML = '<div style="width: 100%; height: 100%; background: #ffebee; display: flex; align-items: center; justify-content: center; color: #780505; font-size: 12px;">Нет изображения</div>';
                        }}
                      />
                    </div>
                  )}
                </div>

                <div className="form-buttons">
                  <button type="submit" className="save-btn">
                    {editingItem ? 'Сохранить изменения' : 'Добавить блюдо'}
                  </button>
                  <button 
                    type="button" 
                    className="cancel-btn"
                    onClick={() => setShowAddForm(false)}
                  >
                    Отмена
                  </button>
                  {editingItem && (
                    <button 
                      type="button" 
                      className="delete-btn"
                      onClick={() => {
                        if (window.confirm('Скрыть это блюдо? Его можно будет восстановить позже.')) {
                          handleDeleteItem(editingItem.id);
                          setShowAddForm(false);
                        }
                      }}
                    >
                      Скрыть блюдо
                    </button>
                  )}
                </div>
              </form>
            </div>
          </div>
        )}

        {/* Список активных блюд */}
        <div className="menu-items">
          {filteredItems.map(item => (
            <div key={item.id} className="menu-item">
              {/* Кнопки админа */}
              {isAdmin && (
                <div className="admin-actions">
                  <button 
                    className="edit-btn"
                    onClick={() => handleEditItem(item)}
                    title="Редактировать"
                  >
                    Ред.
                  </button>
                  <button 
                    className="delete-btn"
                    onClick={() => handleDeleteItem(item.id)}
                    title="Скрыть блюдо"
                  >
                    Удалить
                  </button>
                </div>
              )}

              {/* Изображение и бейджи */}
              <div className="item-image-container">
                <img 
                  src={item.imageUrl || dish1Image}
                  alt={item.name}
                  className="item-image"
                  onError={(e) => {
                    e.target.src = dish1Image;
                  }}
                />
                {item.preparationTime && (
                  <div className="preparation-time">
                    {item.preparationTime} мин
                  </div>
                )}
                {item.weight && (
                  <div className="weight-badge">
                    {item.weight}
                  </div>
                )}
              </div>

              {/* Детали блюда */}
              <div className="item-details">
                <div className="item-header">
                  <h3 className="item-name">{item.name}</h3>
                  <p className="item-description">{item.description}</p>
                  {item.composition && (
                    <p className="item-composition">
                      <strong>Состав:</strong> {item.composition}
                    </p>
                  )}
                </div>
                <div className="item-footer">
                  <span className="item-category">
                    {categories.find(c => c.id === item.categoryId)?.name || 'Без категории'}
                  </span>
                  <span className="item-price">{Math.round(item.price)} ₽</span>
                </div>
              </div>

              {/* Кнопка корзины для клиентов */}
              {!isAdmin && (
                <button 
                  className="add-to-cart-btn"
                  onClick={() => handleAddToCart(item)}
                >
                  В корзину
                </button>
              )}
            </div>
          ))}
        </div>

        {filteredItems.length === 0 && !showDeletedItems && (
          <div className="empty-message">
            В этой категории пока нет блюд
            {isAdmin && selectedCategory && (
              <button 
                className="add-item-btn"
                onClick={() => {
                  setEditingItem(null);
                  setFormData(prev => ({...prev, categoryId: selectedCategory.toString()}));
                  setShowAddForm(true);
                }}
                style={{marginTop: '20px'}}
              >
                Добавить блюдо в эту категорию
              </button>
            )}
          </div>
        )}
      </div>
    </>
  );
};

export default Menu;