import React, { useState, useEffect } from 'react';
import '../styles/menu.css';
import WelcomBlock from '../components/WelcomBlock';
import axios from 'axios';

// Импортируем изображения (замените на ваши реальные файлы)
import dish1Image from '../img/dish1Image.png';


const Menu = () => {
  const [menuItems, setMenuItems] = useState([]);
  const [categories, setCategories] = useState([]);
  const [selectedCategory, setSelectedCategory] = useState(null);
  const [loading, setLoading] = useState(true);
  const [isAdmin, setIsAdmin] = useState(false);
  const [showAddForm, setShowAddForm] = useState(false);
  const [editingItem, setEditingItem] = useState(null);

  // Форма для добавления/редактирования
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    price: '',
    categoryId: '',
    preparationTime: '',
    imageUrl: ''
  });

  useEffect(() => {
    fetchMenuData();
    checkAdminStatus();
  }, []);

  const fetchMenuData = async () => {
    try {
      const [categoriesRes, itemsRes] = await Promise.all([
        axios.get('http://localhost:5110/api/menu/categories'),
        axios.get('http://localhost:5110/api/menu/items')
      ]);
      
      setCategories(categoriesRes.data);
      setMenuItems(itemsRes.data);
      setLoading(false);
    } catch (error) {
      console.error('Ошибка загрузки меню:', error);
      setLoading(false);
    }
  };

  const checkAdminStatus = () => {
    const token = localStorage.getItem('token');
    if (token) {
      try {
        const userData = JSON.parse(atob(token.split('.')[1]));
        setIsAdmin(userData.role === 'Admin');
      } catch (e) {
        console.error('Ошибка чтения токена:', e);
      }
    }
  };

  const handleAddItem = async (e) => {
    e.preventDefault();
    try {
      const token = localStorage.getItem('token');
      await axios.post('http://localhost:5110/api/menu/items', {
        ...formData,
        price: parseFloat(formData.price),
        categoryId: parseInt(formData.categoryId),
        preparationTime: formData.preparationTime ? parseInt(formData.preparationTime) : null
      }, {
        headers: { Authorization: `Bearer ${token}` }
      });

      setShowAddForm(false);
      setFormData({ name: '', description: '', price: '', categoryId: '', preparationTime: '', imageUrl: '' });
      fetchMenuData(); // Обновляем список
    } catch (error) {
      console.error('Ошибка добавления:', error);
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
        preparationTime: formData.preparationTime ? parseInt(formData.preparationTime) : null
      }, {
        headers: { Authorization: `Bearer ${token}` }
      });

      setShowAddForm(false);
      setEditingItem(null);
      setFormData({ name: '', description: '', price: '', categoryId: '', preparationTime: '', imageUrl: '' });
      fetchMenuData();
    } catch (error) {
      console.error('Ошибка редактирования:', error);
    }
  };

  const handleDeleteItem = async (itemId) => {
    if (window.confirm('Вы уверены что хотите удалить это блюдо?')) {
      try {
        const token = localStorage.getItem('token');
        await axios.delete(`http://localhost:5110/api/menu/items/${itemId}`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        fetchMenuData();
      } catch (error) {
        console.error('Ошибка удаления:', error);
      }
    }
  };

  const filteredItems = selectedCategory 
    ? menuItems.filter(item => item.categoryId === selectedCategory)
    : menuItems;

  if (loading) {
    return (
      <>
        <WelcomBlock />
        <div className="menu-container">
          <div className="loading">Загрузка меню...</div>
        </div>
      </>
    );
  }

  return (
    <>
      <WelcomBlock />
      <div className="menu-container">
        <div className="menu-header">
          <h1 className="menu-title">Меню</h1>
        </div>

        {/* Фильтр по категориям */}
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

        {/* Кнопка добавления для админа */}
        {isAdmin && (
          <div className="admin-controls">
            <button 
              className="add-item-btn"
              onClick={() => {
                setEditingItem(null);
                setFormData({ name: '', description: '', price: '', categoryId: '', preparationTime: '', imageUrl: '' });
                setShowAddForm(true);
              }}
            >
              + Добавить блюдо
            </button>
          </div>
        )}

        {/* Форма добавления/редактирования */}
        {showAddForm && (
          <div className="modal-overlay">
            <div className="modal-content">
              <h3>{editingItem ? 'Редактировать блюдо' : 'Добавить новое блюдо'}</h3>
              <form onSubmit={editingItem ? handleUpdateItem : handleAddItem}>
                <input
                  type="text"
                  placeholder="Название блюда"
                  value={formData.name}
                  onChange={(e) => setFormData({...formData, name: e.target.value})}
                  required
                />
                <textarea
                  placeholder="Описание"
                  value={formData.description}
                  onChange={(e) => setFormData({...formData, description: e.target.value})}
                  required
                />
                <input
                  type="number"
                  placeholder="Цена"
                  value={formData.price}
                  onChange={(e) => setFormData({...formData, price: e.target.value})}
                  step="0.01"
                  required
                />
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
                <input
                  type="number"
                  placeholder="Время приготовления (минут)"
                  value={formData.preparationTime}
                  onChange={(e) => setFormData({...formData, preparationTime: e.target.value})}
                />
                <input
                  type="text"
                  placeholder="URL изображения"
                  value={formData.imageUrl}
                  onChange={(e) => setFormData({...formData, imageUrl: e.target.value})}
                />
                <div className="form-buttons">
                  <button type="submit" className="save-btn">
                    {editingItem ? 'Сохранить' : 'Добавить'}
                  </button>
                  <button 
                    type="button" 
                    className="cancel-btn"
                    onClick={() => setShowAddForm(false)}
                  >
                    Отмена
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* Список блюд */}
        <div className="menu-items">
          {filteredItems.map(item => (
            <div key={item.id} className="menu-item">
              <div className="item-content">
                <div className="item-image-container">
                  <img 
                    src={item.imageUrl || dish1Image} // Запасное изображение
                    alt={item.name}
                    className="item-image"
                  />
                  {item.preparationTime && (
                    <div className="preparation-time">
                      ⏱ {item.preparationTime} мин
                    </div>
                  )}
                </div>
                <div className="item-details">
                  <div className="item-header">
                    <h3 className="item-name">{item.name}</h3>
                    <p className="item-description">{item.description}</p>
                  </div>
                  <div className="item-footer">
                    <span className="item-category">{item.categoryName}</span>
                    <span className="item-price">{item.price} ₽</span>
                  </div>
                </div>

                {/* Кнопки админа */}
                {isAdmin && (
                  <div className="admin-actions">
                    <button 
                      className="edit-btn"
                      onClick={() => handleEditItem(item)}
                    >
                      ✏️
                    </button>
                    <button 
                      className="delete-btn"
                      onClick={() => handleDeleteItem(item.id)}
                    >
                      🗑️
                    </button>
                  </div>
                )}

                {/* Кнопка корзины для клиентов */}
                {!isAdmin && (
                  <button className="add-to-cart-btn">
                    В корзину
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>

        {filteredItems.length === 0 && (
          <div className="empty-message">
            В этой категории пока нет блюд
          </div>
        )}
      </div>
    </>
  );
};

export default Menu;