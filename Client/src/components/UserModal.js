import React, { useState, useEffect } from 'react';
import axios from 'axios';
import '../styles/admin.css';

const UserModal = ({ show, onClose, user, onSave }) => {
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    email: '',
    phoneNumber: '',
    role: 'Client',
    password: ''
  });

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (user) {
      setFormData({
        firstName: user.firstName || '',
        lastName: user.lastName || '',
        email: user.email || '',
        phoneNumber: user.phoneNumber || '',
        role: user.role || 'Client',
        password: '' // Не показываем пароль при редактировании
      });
    } else {
      setFormData({
        firstName: '',
        lastName: '',
        email: '',
        phoneNumber: '',
        role: 'Client',
        password: ''
      });
    }
  }, [user]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const token = localStorage.getItem('token');
      
      // Проверка обязательных полей
      if (!formData.email || !formData.firstName || !formData.lastName) {
        throw new Error('Заполните обязательные поля');
      }

      // Если добавляем нового пользователя, нужен пароль
      if (!user && !formData.password) {
        throw new Error('Введите пароль для нового пользователя');
      }

      const dataToSend = { ...formData };
      // Если редактируем существующего, убираем пароль если он пустой
      if (user && !dataToSend.password) {
        delete dataToSend.password;
      }

      if (user) {
        // Редактирование существующего пользователя
        await axios.put(`http://localhost:5110/api/admin/users/${user.id}`, dataToSend, {
          headers: { Authorization: `Bearer ${token}` }
        });
      } else {
        // Создание нового пользователя
        await axios.post('http://localhost:5110/api/admin/users', dataToSend, {
          headers: { Authorization: `Bearer ${token}` }
        });
      }

      onSave();
      onClose();
    } catch (error) {
      console.error('Ошибка сохранения пользователя:', error);
      setError(error.response?.data?.message || error.message || 'Ошибка сохранения');
    } finally {
      setLoading(false);
    }
  };

  if (!show) return null;

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" onClick={(e) => e.stopPropagation()}>
        <h3>{user ? 'Редактировать пользователя' : 'Добавить пользователя'}</h3>
        
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
          <div className="form-row">
            <div className="form-group">
              <label>Имя *</label>
              <input
                type="text"
                value={formData.firstName}
                onChange={(e) => setFormData({...formData, firstName: e.target.value})}
                required
                placeholder="Введите имя"
              />
            </div>
            <div className="form-group">
              <label>Фамилия *</label>
              <input
                type="text"
                value={formData.lastName}
                onChange={(e) => setFormData({...formData, lastName: e.target.value})}
                required
                placeholder="Введите фамилию"
              />
            </div>
          </div>

          <div className="form-group">
            <label>Email *</label>
            <input
              type="email"
              value={formData.email}
              onChange={(e) => setFormData({...formData, email: e.target.value})}
              required
              placeholder="example@mail.ru"
            />
          </div>

          <div className="form-group">
            <label>Телефон</label>
            <input
              type="tel"
              value={formData.phoneNumber}
              onChange={(e) => setFormData({...formData, phoneNumber: e.target.value})}
              placeholder="+7 (999) 123-45-67"
            />
          </div>

          <div className="form-group">
            <label>Роль</label>
            <select
              value={formData.role}
              onChange={(e) => setFormData({...formData, role: e.target.value})}
            >
              <option value="Client">Клиент</option>
              <option value="Courier">Курьер</option>
              <option value="Admin">Администратор</option>
              <option value="Cook">Повар</option>
            </select>
          </div>

          {(!user || formData.password) && (
            <div className="form-group">
              <label>
                {user ? 'Новый пароль (оставьте пустым чтобы не менять)' : 'Пароль *'}
              </label>
              <input
                type="password"
                value={formData.password}
                onChange={(e) => setFormData({...formData, password: e.target.value})}
                required={!user}
                placeholder="Введите пароль"
              />
            </div>
          )}

          <div className="form-buttons">
            <button type="submit" className="save-btn" disabled={loading}>
              {loading ? 'Сохранение...' : (user ? 'Сохранить' : 'Добавить')}
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

export default UserModal;