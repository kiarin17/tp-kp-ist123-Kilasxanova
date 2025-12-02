import React, { useState, useEffect } from 'react';
import axios from 'axios';
import '../styles/admin.css';

const CategoryModal = ({ show, onClose, category, onSave }) => {
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    imageUrl: ''
  });

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (category) {
      setFormData({
        name: category.name || '',
        description: category.description || '',
        imageUrl: category.imageUrl || ''
      });
    } else {
      setFormData({
        name: '',
        description: '',
        imageUrl: ''
      });
    }
  }, [category]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const token = localStorage.getItem('token');
      
      if (!formData.name) {
        throw new Error('Введите название категории');
      }

      if (category) {
        // Редактирование существующей категории
        await axios.put(`http://localhost:5110/api/menu/categories/${category.id}`, formData, {
          headers: { Authorization: `Bearer ${token}` }
        });
      } else {
        // Создание новой категории
        await axios.post('http://localhost:5110/api/menu/categories', formData, {
          headers: { Authorization: `Bearer ${token}` }
        });
      }

      onSave();
      onClose();
    } catch (error) {
      console.error('Ошибка сохранения категории:', error);
      setError(error.response?.data?.message || error.message || 'Ошибка сохранения');
    } finally {
      setLoading(false);
    }
  };

  if (!show) return null;

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" onClick={(e) => e.stopPropagation()}>
        <h3>{category ? 'Редактировать категорию' : 'Добавить категорию'}</h3>
        
        {error && (
          <div className="error-message" style={{
            background: '#ffebee',
            color: '#d32f2f',
            padding: '12px',
            borderRadius: '8px',
            marginBottom: '20px',
            border: '1px solid #ffcdd2'
          }}>
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label>Название категории *</label>
            <input
              type="text"
              value={formData.name}
              onChange={(e) => setFormData({...formData, name: e.target.value})}
              required
              placeholder="Например: Основные блюда"
            />
          </div>

          <div className="form-group">
            <label>Описание</label>
            <textarea
              value={formData.description}
              onChange={(e) => setFormData({...formData, description: e.target.value})}
              placeholder="Описание категории..."
              rows="3"
            />
          </div>

          <div className="form-group">
            <label>URL изображения</label>
            <input
              type="text"
              value={formData.imageUrl}
              onChange={(e) => setFormData({...formData, imageUrl: e.target.value})}
              placeholder="https://example.com/image.jpg"
            />
          </div>

          <div className="form-buttons">
            <button type="submit" className="save-btn" disabled={loading}>
              {loading ? 'Сохранение...' : (category ? 'Сохранить' : 'Добавить')}
            </button>
            <button 
              type="button" 
              className="cancel-btn"
              onClick={onClose}
              disabled={loading}
            >
              Отмена
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default CategoryModal;