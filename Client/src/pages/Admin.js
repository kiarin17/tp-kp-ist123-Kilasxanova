import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import '../styles/admin.css';

const API_BASE_URL = 'http://localhost:5110/api';

const Admin = () => {
  const [user, setUser] = useState(null);
  const [stats, setStats] = useState({});
  const [orders, setOrders] = useState([]);
  const [users, setUsers] = useState([]);
  const [categories, setCategories] = useState([]);
  const [reservations, setReservations] = useState([]);
  const [reservationsStats, setReservationsStats] = useState({});
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('dashboard');
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [selectedReservation, setSelectedReservation] = useState(null);
  const [showOrderModal, setShowOrderModal] = useState(false);
  const [showReservationModal, setShowReservationModal] = useState(false);
  const [couriers, setCouriers] = useState([]);
  const [filters, setFilters] = useState({
    status: 'all',
    date: 'today'
  });
  
  // Фильтры для бронирований
  const [reservationFilters, setReservationFilters] = useState({
    status: 'all',
    date: 'all'
  });
  
  // Модальные окна
  const [showUserModal, setShowUserModal] = useState(false);
  const [showCategoryModal, setShowCategoryModal] = useState(false);
  const [selectedUser, setSelectedUser] = useState(null);
  const [selectedCategory, setSelectedCategory] = useState(null);
  const [userFormData, setUserFormData] = useState({
    firstName: '',
    lastName: '',
    email: '',
    phoneNumber: '',
    role: 'Client',
    password: ''
  });
  const [categoryFormData, setCategoryFormData] = useState({
    name: '',
    description: '',
    imageUrl: '',
    displayOrder: 0
  });
  const [error, setError] = useState('');

  const navigate = useNavigate();

  useEffect(() => {
    const userData = localStorage.getItem('user');
    const token = localStorage.getItem('token');
    
    if (!userData || !token) {
      navigate('/login');
      return;
    }

    const userObj = JSON.parse(userData);
    if (userObj.role !== 'Admin') {
      navigate('/');
      return;
    }

    setUser(userObj);
    fetchAdminData();
  }, [navigate]);

  // Загрузка данных при изменении активной вкладки
  useEffect(() => {
    if (user && activeTab === 'reservations') {
      fetchReservations();
      fetchReservationsStats();
    }
  }, [activeTab, reservationFilters, user]);

  const getAuthHeaders = () => {
    const token = localStorage.getItem('token');
    return {
      headers: { 
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    };
  };

  const fetchAdminData = async () => {
    try {
      setLoading(true);
      setError('');
      
      // Запросы с правильными endpoint'ами
      try {
        const statsRes = await axios.get(`${API_BASE_URL}/admin/dashboard`, getAuthHeaders());
        setStats(statsRes.data || {});
      } catch (error) {
        console.log('Статистика недоступна');
        setStats({
          orders: { total: 0, pending: 0, today: 0 },
          revenue: { today: 0 },
          users: { total: 0, availableCouriers: 0 }
        });
      }

      try {
        const ordersRes = await axios.get(`${API_BASE_URL}/admin/orders`, getAuthHeaders());
        setOrders(Array.isArray(ordersRes.data) ? ordersRes.data : []);
      } catch (error) {
        console.log('Заказы недоступны');
        setOrders([]);
      }

      try {
        const usersRes = await axios.get(`${API_BASE_URL}/admin/users`, getAuthHeaders());
        setUsers(Array.isArray(usersRes.data) ? usersRes.data : []);
      } catch (error) {
        console.log('Пользователи недоступны');
        setUsers([]);
      }

      try {
        const couriersRes = await axios.get(`${API_BASE_URL}/admin/couriers/available`, getAuthHeaders());
        setCouriers(Array.isArray(couriersRes.data) ? couriersRes.data : []);
      } catch (error) {
        console.log('Курьеры недоступны');
        setCouriers([]);
      }

      try {
        const categoriesRes = await axios.get(`${API_BASE_URL}/menu/categories`);
        setCategories(Array.isArray(categoriesRes.data) ? categoriesRes.data : []);
      } catch (error) {
        console.log('Категории недоступны');
        setCategories([]);
      }

      // Загрузка бронирований если активна вкладка
      if (activeTab === 'reservations') {
        await fetchReservations();
        await fetchReservationsStats();
      }

    } catch (error) {
      console.error('Общая ошибка загрузки данных:', error);
      setError('Ошибка загрузки данных');
      showNotification('Ошибка загрузки данных', 'error');
    } finally {
      setLoading(false);
    }
  };

  // УПРАВЛЕНИЕ БРОНИРОВАНИЯМИ 
  const fetchReservations = async () => {
    try {
      const response = await axios.get(`${API_BASE_URL}/reservations`, {
        params: reservationFilters,
        ...getAuthHeaders()
      });
      setReservations(Array.isArray(response.data) ? response.data : []);
    } catch (error) {
      console.error('Ошибка загрузки бронирований:', error);
      setReservations([]);
    }
  };

  const fetchReservationsStats = async () => {
    try {
      const response = await axios.get(`${API_BASE_URL}/reservations/stats`, getAuthHeaders());
      setReservationsStats(response.data || {});
    } catch (error) {
      console.error('Ошибка загрузки статистики бронирований:', error);
      setReservationsStats({});
    }
  };

  const handleConfirmReservation = async (reservationId) => {
    try {
      await axios.put(
        `${API_BASE_URL}/reservations/${reservationId}/status`,
        { 
          status: 'confirmed', 
          notes: 'Подтверждено администратором по телефону' 
        },
        getAuthHeaders()
      );
      
      showNotification('Бронь подтверждена', 'success');
      fetchReservations();
      fetchReservationsStats();
      
      if (selectedReservation?.id === reservationId) {
        setSelectedReservation({...selectedReservation, status: 'confirmed'});
      }
    } catch (error) {
      const errorMessage = error.response?.data?.message || error.response?.data?.error || 'Ошибка подтверждения';
      showNotification(errorMessage, 'error');
    }
  };

  const handleCancelReservation = async (reservationId) => {
    const reason = prompt('Причина отмены бронирования:');
    if (reason) {
      try {
        await axios.put(
          `${API_BASE_URL}/reservations/${reservationId}/status`,
          { 
            status: 'cancelled', 
            notes: reason 
          },
          getAuthHeaders()
        );
        
        showNotification('Бронь отменена', 'success');
        fetchReservations();
        fetchReservationsStats();
        
        if (selectedReservation?.id === reservationId) {
          setSelectedReservation({...selectedReservation, status: 'cancelled'});
        }
      } catch (error) {
        const errorMessage = error.response?.data?.message || error.response?.data?.error || 'Ошибка отмены';
        showNotification(errorMessage, 'error');
      }
    }
  };

  const handleDeleteReservation = async (reservationId) => {
    if (window.confirm('Вы уверены что хотите удалить это бронирование?')) {
      try {
        await axios.delete(
          `${API_BASE_URL}/reservations/${reservationId}`,
          getAuthHeaders()
        );
        
        showNotification('Бронирование удалено', 'success');
        fetchReservations();
        fetchReservationsStats();
        setShowReservationModal(false);
      } catch (error) {
        const errorMessage = error.response?.data?.message || error.response?.data?.error || 'Ошибка удаления';
        showNotification(errorMessage, 'error');
      }
    }
  };

  const handleCallReservationCustomer = (reservation) => {
    window.location.href = `tel:${reservation.customerPhone}`;
  };

  const handleReservationClick = (reservation) => {
    setSelectedReservation(reservation);
    setShowReservationModal(true);
  };

  const getReservationStatusText = (status) => {
    const statusMap = {
      'pending': 'Ожидает',
      'confirmed': 'Подтверждено',
      'cancelled': 'Отменено',
      'completed': 'Завершено',
      'noshow': 'Не явился'
    };
    return statusMap[status] || status;
  };

  const getReservationStatusBadge = (status) => {
    const statusConfig = {
      'pending': { text: 'Ожидает', color: '#ff9800', bg: '#fff3e0' },
      'confirmed': { text: 'Подтверждено', color: '#4caf50', bg: '#e8f5e9' },
      'cancelled': { text: 'Отменено', color: '#f44336', bg: '#ffebee' },
      'completed': { text: 'Завершено', color: '#2196f3', bg: '#e3f2fd' },
      'noshow': { text: 'Не явился', color: '#757575', bg: '#f5f5f5' }
    };
    
    return statusConfig[status] || { text: status, color: '#666', bg: '#f5f5f5' };
  };

  const handleReservationStatusChange = async (reservationId, newStatus) => {
    try {
      const notes = prompt('Заметки по изменению статуса:');
      await axios.put(
        `${API_BASE_URL}/reservations/${reservationId}/status`,
        { 
          status: newStatus, 
          notes: notes || `Статус изменен на ${getReservationStatusText(newStatus)}` 
        },
        getAuthHeaders()
      );
      
      showNotification(`Статус брони #${reservationId} обновлен`, 'success');
      fetchReservations();
      
      if (selectedReservation?.id === reservationId) {
        setSelectedReservation({...selectedReservation, status: newStatus});
      }
    } catch (error) {
      const errorMessage = error.response?.data?.message || error.response?.data?.error || 'Ошибка обновления статуса';
      showNotification(errorMessage, 'error');
    }
  };

  //  УПРАВЛЕНИЕ ПОЛЬЗОВАТЕЛЯМИ 
  const handleAddUser = () => {
    setSelectedUser(null);
    setUserFormData({
      firstName: '',
      lastName: '',
      email: '',
      phoneNumber: '',
      role: 'Client',
      password: ''
    });
    setError('');
    setShowUserModal(true);
  };

  const handleEditUser = (user) => {
    setSelectedUser(user);
    setUserFormData({
      firstName: user.firstName || '',
      lastName: user.lastName || '',
      email: user.email || '',
      phoneNumber: user.phoneNumber || '',
      role: user.role || 'Client',
      password: ''
    });
    setError('');
    setShowUserModal(true);
  };

  const handleSaveUser = async (e) => {
    e.preventDefault();
    setError('');
    
    try {
      if (selectedUser) {
        await axios.put(
          `${API_BASE_URL}/admin/users/${selectedUser.id}`,
          userFormData,
          getAuthHeaders()
        );
        showNotification('Пользователь обновлен', 'success');
      } else {
        await axios.post(
          `${API_BASE_URL}/admin/users`,
          userFormData,
          getAuthHeaders()
        );
        showNotification('Пользователь добавлен', 'success');
      }
      
      setShowUserModal(false);
      fetchAdminData();
    } catch (error) {
      const errorMessage = error.response?.data?.message || error.response?.data?.error || 'Ошибка сохранения';
      setError(errorMessage);
      showNotification(errorMessage, 'error');
    }
  };

  const handleDeleteUser = async (userId) => {
    if (window.confirm('Вы уверены что хотите удалить этого пользователя?')) {
      try {
        await axios.delete(
          `${API_BASE_URL}/admin/users/${userId}`,
          getAuthHeaders()
        );
        
        showNotification('Пользователь удален', 'success');
        fetchAdminData();
      } catch (error) {
        const errorMessage = error.response?.data?.message || error.response?.data?.error || 'Ошибка удаления';
        showNotification(errorMessage, 'error');
      }
    }
  };

  // УПРАВЛЕНИЕ КАТЕГОРИЯМИ 
  const handleAddCategory = () => {
    setSelectedCategory(null);
    setCategoryFormData({
      name: '',
      description: '',
      imageUrl: '',
      displayOrder: categories.length + 1
    });
    setError('');
    setShowCategoryModal(true);
  };

  const handleEditCategory = (category) => {
    setSelectedCategory(category);
    setCategoryFormData({
      name: category.name || '',
      description: category.description || '',
      imageUrl: category.imageUrl || '',
      displayOrder: category.displayOrder || 0
    });
    setError('');
    setShowCategoryModal(true);
  };

  const handleSaveCategory = async (e) => {
    e.preventDefault();
    setError('');
    
    try {
      if (selectedCategory) {
        await axios.put(
          `${API_BASE_URL}/menu/categories/${selectedCategory.id}`,
          {
            ...categoryFormData,
            isActive: selectedCategory.isActive !== false
          },
          getAuthHeaders()
        );
        showNotification('Категория обновлена', 'success');
      } else {
        await axios.post(
          `${API_BASE_URL}/menu/categories`,
          categoryFormData,
          getAuthHeaders()
        );
        showNotification('Категория добавлена', 'success');
      }
      
      setShowCategoryModal(false);
      fetchAdminData();
    } catch (error) {
      const errorMessage = error.response?.data?.message || error.response?.data?.error || 'Ошибка сохранения';
      setError(errorMessage);
      showNotification(errorMessage, 'error');
    }
  };

  const handleDeleteCategory = async (categoryId) => {
    if (window.confirm('Вы уверены что хотите удалить эту категорию?')) {
      try {
        await axios.delete(
          `${API_BASE_URL}/menu/categories/${categoryId}`,
          getAuthHeaders()
        );
        
        showNotification('Категория удалена', 'success');
        fetchAdminData();
      } catch (error) {
        const errorMessage = error.response?.data?.message || error.response?.data?.error || 'Ошибка удаления';
        showNotification(errorMessage, 'error');
      }
    }
  };

  //  УПРАВЛЕНИЕ ЗАКАЗАМИ 
  const handleStatusChange = async (orderId, newStatus) => {
    try {
      await axios.put(
        `${API_BASE_URL}/admin/orders/${orderId}/status`, 
        { 
          status: newStatus,
          notes: `Статус изменен на ${getStatusText(newStatus)}` 
        },
        getAuthHeaders()
      );
      
      showNotification(`Статус заказа #${orderId} обновлен`, 'success');
      fetchAdminData();
      
      if (selectedOrder?.id === orderId) {
        setSelectedOrder({...selectedOrder, status: newStatus});
      }
    } catch (error) {
      const errorMessage = error.response?.data?.message || error.response?.data?.error || 'Ошибка обновления статуса';
      showNotification(errorMessage, 'error');
    }
  };

  const handleAssignCourier = async (orderId, courierId) => {
    try {
      await axios.put(
        `${API_BASE_URL}/admin/orders/${orderId}/assign-courier`, 
        { courierId: parseInt(courierId) },
        getAuthHeaders()
      );
      
      showNotification(`Курьер назначен на заказ #${orderId}`, 'success');
      fetchAdminData();
      
      if (selectedOrder?.id === orderId) {
        const courier = couriers.find(c => c.id === parseInt(courierId));
        setSelectedOrder({
          ...selectedOrder, 
          status: 'AssignedToCourier',
          courier: courier ? { firstName: courier.Name?.split(' ')[0], lastName: courier.Name?.split(' ')[1] } : null
        });
      }
    } catch (error) {
      const errorMessage = error.response?.data?.message || error.response?.data?.error || 'Ошибка назначения курьера';
      showNotification(errorMessage, 'error');
    }
  };

  const handleDeleteOrder = async (orderId) => {
    if (window.confirm('Вы уверены что хотите удалить этот заказ?')) {
      try {
        await axios.delete(
          `${API_BASE_URL}/admin/orders/${orderId}`,
          getAuthHeaders()
        );
        
        showNotification('Заказ удален', 'success');
        fetchAdminData();
        setShowOrderModal(false);
      } catch (error) {
        const errorMessage = error.response?.data?.message || error.response?.data?.error || 'Ошибка удаления заказа';
        showNotification(errorMessage, 'error');
      }
    }
  };

  const handleCancelOrder = async (orderId) => {
    if (window.confirm('Вы уверены что хотите отменить этот заказ?')) {
      await handleStatusChange(orderId, 'Cancelled');
    }
  };

  const handleOrderClick = (order) => {
    setSelectedOrder(order);
    setShowOrderModal(true);
  };

  // ВСПОМОГАТЕЛЬНЫЕ ФУНКЦИИ 
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

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('ru-RU', {
      style: 'currency',
      currency: 'RUB',
      minimumFractionDigits: 0
    }).format(amount || 0);
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

  const getRoleText = (role) => {
    const roleMap = {
      'Admin': 'Администратор',
      'Courier': 'Курьер',
      'Client': 'Клиент'
    };
    return roleMap[role] || role;
  };

  const getStatusBadge = (status) => {
    const statusConfig = {
      'Pending': { text: 'Ожидание', color: '#ff9800', bg: '#fff3e0' },
      'Confirmed': { text: 'Подтвержден', color: '#2196f3', bg: '#e3f2fd' },
      'Cooking': { text: 'Готовится', color: '#ff5722', bg: '#fbe9e7' },
      'AssignedToCourier': { text: 'Курьер назначен', color: '#9c27b0', bg: '#f3e5f5' },
      'OnTheWay': { text: 'В пути', color: '#3f51b5', bg: '#e8eaf6' },
      'Delivered': { text: 'Доставлен', color: '#4caf50', bg: '#e8f5e8' },
      'Cancelled': { text: 'Отменен', color: '#f44336', bg: '#ffebee' }
    };
    
    return statusConfig[status] || { text: status, color: '#666', bg: '#f5f5f5' };
  };

  const filteredOrders = orders.filter(order => {
    if (filters.status !== 'all' && order.status !== filters.status) return false;
    
    if (filters.date === 'today') {
      const today = new Date().toDateString();
      const orderDate = new Date(order.createdAt).toDateString();
      return today === orderDate;
    }
    
    return true;
  });

  //  RENDER 
  if (loading && !user) {
    return (
      <div className="loading-screen">
        <div className="loading-spinner"></div>
        <div className="loading-text">Загрузка админ-панели...</div>
      </div>
    );
  }

  if (!user) {
    return null;
  }

  return (
    <div className="admin-container">
      {/* Стили для уведомлений и модальных окон */}
      <style>{`
        @keyframes slideIn {
          from { transform: translateX(100%); opacity: 0; }
          to { transform: translateX(0); opacity: 1; }
        }
        @keyframes slideOut {
          from { transform: translateX(0); opacity: 1; }
          to { transform: translateX(100%); opacity: 0; }
        }
        .loading-screen {
          display: flex;
          flex-direction: column;
          justify-content: center;
          align-items: center;
          height: 100vh;
          background: linear-gradient(135deg, #8b0000 0%, #d32f2f 100%);
        }
        .loading-spinner {
          width: 50px;
          height: 50px;
          border: 3px solid rgba(255,255,255,0.3);
          border-radius: 50%;
          border-top-color: white;
          animation: spin 1s ease-in-out infinite;
          margin-bottom: 20px;
        }
        @keyframes spin {
          to { transform: rotate(360deg); }
        }
        .loading-text {
          color: white;
          font-size: 18px;
          font-weight: 500;
        }
        
        /* Стили для модальных окон */
        .modal-overlay {
          position: fixed;
          top: 0;
          left: 0;
          right: 0;
          bottom: 0;
          background: rgba(0, 0, 0, 0.7);
          display: flex;
          justify-content: center;
          align-items: center;
          z-index: 1000;
          backdrop-filter: blur(5px);
        }
        
        .modal-content {
          background: white;
          padding: 40px;
          border-radius: 20px;
          width: 90%;
          max-width: 500px;
          max-height: 90vh;
          overflow-y: auto;
          box-shadow: 0 20px 60px rgba(0, 0, 0, 0.3);
          border: 2px solid #ffeaea;
        }
        
        .form-row {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 15px;
          margin-bottom: 15px;
        }
        
        .form-group {
          margin-bottom: 20px;
        }
        
        .form-group label {
          display: block;
          margin-bottom: 8px;
          font-weight: 600;
          color: #780505;
          font-size: 14px;
        }
        
        .form-group input,
        .form-group select,
        .form-group textarea {
          width: 100%;
          padding: 12px 15px;
          border: 2px solid #ffeaea;
          border-radius: 8px;
          font-size: 14px;
          transition: all 0.3s ease;
          background: white;
        }
        
        .form-group input:focus,
        .form-group select:focus,
        .form-group textarea:focus {
          outline: none;
          border-color: #780505;
          box-shadow: 0 0 0 3px rgba(120, 5, 5, 0.1);
        }
        
        .form-buttons {
          display: flex;
          gap: 15px;
          justify-content: flex-end;
          margin-top: 30px;
        }
        
        .save-btn {
          background: linear-gradient(135deg, #780505, #b71c1c);
          color: white;
          border: none;
          padding: 15px 30px;
          border-radius: 15px;
          font-size: 16px;
          font-weight: 700;
          cursor: pointer;
          transition: all 0.3s ease;
          min-width: 140px;
          text-align: center;
        }
        
        .save-btn:hover {
          background: linear-gradient(135deg, #b71c1c, #780505);
          transform: translateY(-2px);
        }
        
        .cancel-btn {
          background: linear-gradient(135deg, #666, #888);
          color: white;
          border: none;
          padding: 15px 30px;
          border-radius: 15px;
          font-size: 16px;
          font-weight: 700;
          cursor: pointer;
          transition: all 0.3s ease;
          min-width: 140px;
          text-align: center;
        }
        
        .cancel-btn:hover {
          background: linear-gradient(135deg, #888, #666);
          transform: translateY(-2px);
        }
        
        .error-message {
          background: #ffebee;
          color: #d32f2f;
          padding: 12px;
          border-radius: 8px;
          margin-bottom: 20px;
          border: 1px solid #ffcdd2;
          font-size: 14px;
        }
        
        /* Модальное окно заказа */
        .order-modal-overlay,
        .reservation-modal-overlay {
          position: fixed;
          top: 0;
          left: 0;
          right: 0;
          bottom: 0;
          background: rgba(0, 0, 0, 0.7);
          display: flex;
          justify-content: center;
          align-items: center;
          z-index: 1000;
          backdrop-filter: blur(5px);
        }
        
        .order-modal,
        .reservation-modal {
          background: white;
          border-radius: 20px;
          padding: 40px;
          width: 90%;
          max-width: 800px;
          max-height: 90vh;
          overflow-y: auto;
          box-shadow: 0 25px 50px rgba(0, 0, 0, 0.3);
          border: 2px solid #ffeaea;
        }
        
        .order-modal-header,
        .reservation-modal-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 30px;
          padding-bottom: 20px;
          border-bottom: 2px solid #ffeaea;
        }
        
        .order-modal-title,
        .reservation-modal-title {
          font-size: 28px;
          color: #780505;
          font-weight: 800;
          margin: 0;
          display: flex;
          align-items: center;
          gap: 15px;
        }
        
        .close-modal-btn {
          background: #ffebee;
          border: none;
          width: 40px;
          height: 40px;
          border-radius: 50%;
          font-size: 20px;
          cursor: pointer;
          color: #780505;
          transition: all 0.3s ease;
        }
        
        .close-modal-btn:hover {
          background: #780505;
          color: white;
          transform: rotate(90deg);
        }
        
        .status-badge {
          display: inline-block;
          padding: 8px 16px;
          border-radius: 50px;
          font-size: 14px;
          font-weight: 700;
          margin-left: 10px;
        }
        
        .order-details-grid,
        .reservation-details-grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
          gap: 30px;
          margin-bottom: 40px;
        }
        
        .order-section,
        .reservation-section {
          background: #fff;
          padding: 25px;
          border-radius: 15px;
          border: 1px solid #ffeaea;
        }
        
        .section-title {
          font-size: 18px;
          color: #780505;
          font-weight: 700;
          margin-bottom: 20px;
          padding-bottom: 10px;
          border-bottom: 2px solid #ffebee;
        }
        
        .detail-row {
          display: flex;
          justify-content: space-between;
          margin-bottom: 15px;
          padding-bottom: 10px;
          border-bottom: 1px solid #f5f5f5;
        }
        
        .detail-label {
          color: #666;
          font-weight: 500;
        }
        
        .detail-value {
          color: #333;
          font-weight: 600;
          text-align: right;
        }
        
        .items-list {
          margin-top: 20px;
        }
        
        .item-row {
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding: 12px 0;
          border-bottom: 1px solid #f5f5f5;
        }
        
        .item-name {
          flex: 1;
          color: #333;
        }
        
        .item-quantity {
          margin: 0 20px;
          color: #666;
        }
        
        .item-price {
          color: #780505;
          font-weight: 700;
          min-width: 100px;
          text-align: right;
        }
        
        .total-row {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-top: 20px;
          padding: 20px;
          background: #ffebee;
          border-radius: 10px;
          border: 2px solid #ffcdd2;
        }
        
        .total-label {
          font-size: 18px;
          font-weight: 700;
          color: #333;
        }
        
        .total-value {
          font-size: 24px;
          font-weight: 900;
          color: #780505;
        }
        
        .modal-actions {
          display: flex;
          justify-content: flex-end;
          gap: 15px;
          margin-top: 30px;
          padding-top: 30px;
          border-top: 2px solid #ffeaea;
        }
        
        .courier-select {
          padding: 10px 15px;
          border: 2px solid #ffeaea;
          border-radius: 10px;
          background: white;
          color: #333;
          font-size: 14px;
          cursor: pointer;
          min-width: 200px;
        }
        
        .courier-select:focus {
          outline: none;
          border-color: #780505;
        }
        
        .assign-btn {
          background: linear-gradient(135deg, #780505, #b71c1c);
          color: white;
          border: none;
          padding: 12px 24px;
          border-radius: 10px;
          font-weight: 600;
          cursor: pointer;
          transition: all 0.3s ease;
        }
        
        .assign-btn:hover {
          background: linear-gradient(135deg, #b71c1c, #780505);
          transform: translateY(-2px);
        }
      `}</style>

      {/* Модальное окно пользователя */}
      {showUserModal && (
        <div className="modal-overlay" onClick={() => setShowUserModal(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <h3>{selectedUser ? 'Редактировать пользователя' : 'Добавить пользователя'}</h3>
            
            {error && (
              <div className="error-message">
                {error}
              </div>
            )}
            
            <form onSubmit={handleSaveUser}>
              <div className="form-row">
                <div className="form-group">
                  <label>Имя *</label>
                  <input
                    type="text"
                    value={userFormData.firstName}
                    onChange={(e) => setUserFormData({...userFormData, firstName: e.target.value})}
                    required
                    placeholder="Введите имя"
                  />
                </div>
                <div className="form-group">
                  <label>Фамилия *</label>
                  <input
                    type="text"
                    value={userFormData.lastName}
                    onChange={(e) => setUserFormData({...userFormData, lastName: e.target.value})}
                    required
                    placeholder="Введите фамилию"
                  />
                </div>
              </div>

              <div className="form-group">
                <label>Email *</label>
                <input
                  type="email"
                  value={userFormData.email}
                  onChange={(e) => setUserFormData({...userFormData, email: e.target.value})}
                  required
                  placeholder="example@mail.ru"
                />
              </div>

              <div className="form-group">
                <label>Телефон</label>
                <input
                  type="tel"
                  value={userFormData.phoneNumber}
                  onChange={(e) => setUserFormData({...userFormData, phoneNumber: e.target.value})}
                  placeholder="+7 (999) 123-45-67"
                />
              </div>

              <div className="form-group">
                <label>Роль</label>
                <select
                  value={userFormData.role}
                  onChange={(e) => setUserFormData({...userFormData, role: e.target.value})}
                >
                  <option value="Client">Клиент</option>
                  <option value="Courier">Курьер</option>
                  <option value="Admin">Администратор</option>
                </select>
              </div>

              <div className="form-group">
                <label>
                  {selectedUser ? 'Новый пароль (оставьте пустым чтобы не менять)' : 'Пароль *'}
                </label>
                <input
                  type="password"
                  value={userFormData.password}
                  onChange={(e) => setUserFormData({...userFormData, password: e.target.value})}
                  required={!selectedUser}
                  placeholder="Введите пароль"
                />
              </div>

              <div className="form-buttons">
                <button type="submit" className="save-btn">
                  {selectedUser ? 'Сохранить' : 'Добавить'}
                </button>
                <button 
                  type="button" 
                  className="cancel-btn"
                  onClick={() => setShowUserModal(false)}
                >
                  Отмена
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Модальное окно категории */}
      {showCategoryModal && (
        <div className="modal-overlay" onClick={() => setShowCategoryModal(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <h3>{selectedCategory ? 'Редактировать категорию' : 'Добавить категорию'}</h3>
            
            {error && (
              <div className="error-message">
                {error}
              </div>
            )}
            
            <form onSubmit={handleSaveCategory}>
              <div className="form-group">
                <label>Название категории *</label>
                <input
                  type="text"
                  value={categoryFormData.name}
                  onChange={(e) => setCategoryFormData({...categoryFormData, name: e.target.value})}
                  required
                  placeholder="Например: Основные блюда"
                />
              </div>

              <div className="form-group">
                <label>Описание</label>
                <textarea
                  value={categoryFormData.description}
                  onChange={(e) => setCategoryFormData({...categoryFormData, description: e.target.value})}
                  placeholder="Описание категории..."
                  rows="3"
                />
              </div>

              <div className="form-group">
                <label>URL изображения</label>
                <input
                  type="text"
                  value={categoryFormData.imageUrl}
                  onChange={(e) => setCategoryFormData({...categoryFormData, imageUrl: e.target.value})}
                  placeholder="https://example.com/image.jpg"
                />
              </div>

              <div className="form-group">
                <label>Порядок отображения</label>
                <input
                  type="number"
                  value={categoryFormData.displayOrder}
                  onChange={(e) => setCategoryFormData({...categoryFormData, displayOrder: parseInt(e.target.value) || 0})}
                  placeholder="0"
                  min="0"
                />
              </div>

              <div className="form-buttons">
                <button type="submit" className="save-btn">
                  {selectedCategory ? 'Сохранить' : 'Добавить'}
                </button>
                <button 
                  type="button" 
                  className="cancel-btn"
                  onClick={() => setShowCategoryModal(false)}
                >
                  Отмена
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Модальное окно заказа */}
      {showOrderModal && selectedOrder && (
        <div className="order-modal-overlay" onClick={() => setShowOrderModal(false)}>
          <div className="order-modal" onClick={(e) => e.stopPropagation()}>
            <div className="order-modal-header">
              <h2 className="order-modal-title">
                Заказ #{selectedOrder.id}
                <span className="status-badge" style={{
                  background: getStatusBadge(selectedOrder.status).bg,
                  color: getStatusBadge(selectedOrder.status).color
                }}>
                  {getStatusText(selectedOrder.status)}
                </span>
              </h2>
              <button className="close-modal-btn" onClick={() => setShowOrderModal(false)}>
                ×
              </button>
            </div>
            
            <div className="order-details-grid">
              <div className="order-section">
                <h3 className="section-title">Информация о клиенте</h3>
                <div className="detail-row">
                  <span className="detail-label">Имя:</span>
                  <span className="detail-value">{selectedOrder.customerName || 'Не указано'}</span>
                </div>
                <div className="detail-row">
                  <span className="detail-label">Телефон:</span>
                  <span className="detail-value">{selectedOrder.customerPhone || 'Не указано'}</span>
                </div>
                <div className="detail-row">
                  <span className="detail-label">Email:</span>
                  <span className="detail-value">{selectedOrder.customerEmail || 'Не указано'}</span>
                </div>
                <div className="detail-row">
                  <span className="detail-label">Адрес доставки:</span>
                  <span className="detail-value">{selectedOrder.deliveryAddress || 'Не указано'}</span>
                </div>
              </div>
              
              <div className="order-section">
                <h3 className="section-title">Информация о заказе</h3>
                <div className="detail-row">
                  <span className="detail-label">Дата заказа:</span>
                  <span className="detail-value">{formatDate(selectedOrder.createdAt)}</span>
                </div>
                <div className="detail-row">
                  <span className="detail-label">Статус:</span>
                  <span className="detail-value">
                    <select 
                      value={selectedOrder.status}
                      onChange={(e) => handleStatusChange(selectedOrder.id, e.target.value)}
                      className="courier-select"
                      style={{width: '100%'}}
                    >
                      <option value="Pending">Ожидание</option>
                      <option value="Confirmed">Подтвержден</option>
                      <option value="Cooking">Готовится</option>
                      <option value="AssignedToCourier">Курьер назначен</option>
                      <option value="OnTheWay">В пути</option>
                      <option value="Delivered">Доставлен</option>
                      <option value="Cancelled">Отменен</option>
                    </select>
                  </span>
                </div>
                {selectedOrder.courier && (
                  <div className="detail-row">
                    <span className="detail-label">Курьер:</span>
                    <span className="detail-value">{selectedOrder.courier.firstName} {selectedOrder.courier.lastName}</span>
                  </div>
                )}
                {selectedOrder.estimatedDeliveryTime && (
                  <div className="detail-row">
                    <span className="detail-label">Примерное время доставки:</span>
                    <span className="detail-value">{formatDate(selectedOrder.estimatedDeliveryTime)}</span>
                  </div>
                )}
              </div>
              
              <div className="order-section" style={{gridColumn: '1 / -1'}}>
                <h3 className="section-title">Состав заказа</h3>
                <div className="items-list">
                  {selectedOrder.items && selectedOrder.items.length > 0 ? (
                    selectedOrder.items.map((item, index) => (
                      <div key={index} className="item-row">
                        <span className="item-name">{item.name || item.Name}</span>
                        <span className="item-quantity">× {item.quantity || item.Quantity}</span>
                        <span className="item-price">
                          {formatCurrency((item.price || item.Price || 0) * (item.quantity || item.Quantity || 1))}
                        </span>
                      </div>
                    ))
                  ) : (
                    <p>Информация о товарах недоступна</p>
                  )}
                </div>
                
                <div className="total-row">
                  <span className="total-label">Итого:</span>
                  <span className="total-value">{formatCurrency(selectedOrder.totalAmount)}</span>
                </div>
              </div>
              
              {couriers.length > 0 && selectedOrder.status === 'Confirmed' && (
                <div className="order-section" style={{gridColumn: '1 / -1'}}>
                  <h3 className="section-title">Назначение курьера</h3>
                  <div style={{display: 'flex', gap: '15px', alignItems: 'center'}}>
                    <select 
                      className="courier-select"
                      onChange={(e) => handleAssignCourier(selectedOrder.id, e.target.value)}
                      defaultValue=""
                    >
                      <option value="">Выберите курьера</option>
                      {couriers.map(courier => (
                        <option key={courier.id} value={courier.id}>
                          {courier.Name || `${courier.firstName} ${courier.lastName}`} ({courier.phoneNumber || courier.PhoneNumber})
                        </option>
                      ))}
                    </select>
                    <button 
                      className="assign-btn"
                      onClick={() => {
                        const select = document.querySelector('.courier-select');
                        if (select.value) {
                          handleAssignCourier(selectedOrder.id, select.value);
                        }
                      }}
                    >
                      Назначить
                    </button>
                  </div>
                </div>
              )}
            </div>
            
            <div className="modal-actions">
              <button 
                className="btn-danger" 
                onClick={() => handleCancelOrder(selectedOrder.id)}
                style={{
                  background: '#f44336',
                  color: 'white',
                  padding: '12px 24px',
                  border: 'none',
                  borderRadius: '8px',
                  cursor: 'pointer'
                }}
              >
                Отменить заказ
              </button>
              <button 
                className="btn-secondary" 
                onClick={() => setShowOrderModal(false)}
                style={{
                  background: '#6c757d',
                  color: 'white',
                  padding: '12px 24px',
                  border: 'none',
                  borderRadius: '8px',
                  cursor: 'pointer'
                }}
              >
                Закрыть
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Модальное окно бронирования */}
      {showReservationModal && selectedReservation && (
        <div className="reservation-modal-overlay" onClick={() => setShowReservationModal(false)}>
          <div className="reservation-modal" onClick={(e) => e.stopPropagation()}>
            <div className="reservation-modal-header">
              <h2 className="reservation-modal-title">
                Бронирование #{selectedReservation.id}
                <span className="status-badge" style={{
                  background: getReservationStatusBadge(selectedReservation.status).bg,
                  color: getReservationStatusBadge(selectedReservation.status).color
                }}>
                  {getReservationStatusText(selectedReservation.status)}
                </span>
              </h2>
              <button className="close-modal-btn" onClick={() => setShowReservationModal(false)}>
                ×
              </button>
            </div>
            
            <div className="reservation-details-grid">
              <div className="reservation-section">
                <h3 className="section-title">Информация о клиенте</h3>
                <div className="detail-row">
                  <span className="detail-label">Имя:</span>
                  <span className="detail-value">{selectedReservation.customerName || 'Не указано'}</span>
                </div>
                <div className="detail-row">
                  <span className="detail-label">Телефон:</span>
                  <span className="detail-value">
                    <a href={`tel:${selectedReservation.customerPhone}`} style={{color: '#780505', textDecoration: 'none'}}>
                      {selectedReservation.customerPhone || 'Не указано'}
                    </a>
                  </span>
                </div>
                <div className="detail-row">
                  <span className="detail-label">Email:</span>
                  <span className="detail-value">
                    <a href={`mailto:${selectedReservation.customerEmail}`} style={{color: '#780505', textDecoration: 'none'}}>
                      {selectedReservation.customerEmail || 'Не указано'}
                    </a>
                  </span>
                </div>
              </div>
              
              <div className="reservation-section">
                <h3 className="section-title">Информация о бронировании</h3>
                <div className="detail-row">
                  <span className="detail-label">Тип:</span>
                  <span className="detail-value">{selectedReservation.type}</span>
                </div>
                <div className="detail-row">
                  <span className="detail-label">Дата и время:</span>
                  <span className="detail-value">{formatDate(selectedReservation.reservationDateTime)}</span>
                </div>
                <div className="detail-row">
                  <span className="detail-label">Количество гостей:</span>
                  <span className="detail-value">{selectedReservation.guestsCount}</span>
                </div>
                <div className="detail-row">
                  <span className="detail-label">Статус:</span>
                  <span className="detail-value">
                    <select 
                      value={selectedReservation.status}
                      onChange={(e) => handleReservationStatusChange(selectedReservation.id, e.target.value)}
                      className="courier-select"
                      style={{width: '100%'}}
                    >
                      <option value="pending">Ожидает</option>
                      <option value="confirmed">Подтверждено</option>
                      <option value="cancelled">Отменено</option>
                      <option value="completed">Завершено</option>
                      <option value="noshow">Не явился</option>
                    </select>
                  </span>
                </div>
                <div className="detail-row">
                  <span className="detail-label">Дата создания:</span>
                  <span className="detail-value">{formatDate(selectedReservation.createdAt)}</span>
                </div>
              </div>
              
              <div className="reservation-section" style={{gridColumn: '1 / -1'}}>
                <h3 className="section-title">Дополнительные пожелания</h3>
                <div className="special-requests">
                  {selectedReservation.specialRequests ? (
                    <p style={{whiteSpace: 'pre-wrap', lineHeight: '1.5'}}>
                      {selectedReservation.specialRequests}
                    </p>
                  ) : (
                    <p style={{color: '#999', fontStyle: 'italic'}}>Пожеланий нет</p>
                  )}
                </div>
              </div>
            </div>
            
            <div className="modal-actions">
              <button 
                className="btn-danger" 
                onClick={() => handleDeleteReservation(selectedReservation.id)}
                style={{
                  background: '#f44336',
                  color: 'white',
                  padding: '12px 24px',
                  border: 'none',
                  borderRadius: '8px',
                  cursor: 'pointer'
                }}
              >
                Удалить
              </button>
              <button 
                className="btn-primary" 
                onClick={() => handleCallReservationCustomer(selectedReservation)}
                style={{
                  background: '#780505',
                  color: 'white',
                  padding: '12px 24px',
                  border: 'none',
                  borderRadius: '8px',
                  cursor: 'pointer'
                }}
              >
                📞 Позвонить
              </button>
              <button 
                className="btn-secondary" 
                onClick={() => setShowReservationModal(false)}
                style={{
                  background: '#6c757d',
                  color: 'white',
                  padding: '12px 24px',
                  border: 'none',
                  borderRadius: '8px',
                  cursor: 'pointer'
                }}
              >
                Закрыть
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Шапка */}
      <div className="admin-header">
        <h1>
          <span className="header-text"></span>
          Админ-панель
        </h1>
        <div className="admin-user">
          <div className="user-info">
            <div className="user-name">
              {user.firstName} {user.lastName}
            </div>
            <div className="user-email">{user.email}</div>
          </div>
          <button onClick={() => {
            localStorage.removeItem('token');
            localStorage.removeItem('user');
            navigate('/login');
          }} className="logout-btn">
            <span className="logout-text">Выйти</span>
          </button>
        </div>
      </div>

      {/* Навигационные вкладки */}
      <div className="admin-tabs">
        <button 
          className={`tab-btn ${activeTab === 'dashboard' ? 'active' : ''}`}
          onClick={() => setActiveTab('dashboard')}
        >
          <span className="tab-text">Дашборд</span>
        </button>
        <button 
          className={`tab-btn ${activeTab === 'orders' ? 'active' : ''}`}
          onClick={() => setActiveTab('orders')}
        >
          <span className="tab-text">Заказы</span>
          {stats.orders?.pending > 0 && (
            <span className="tab-badge">{stats.orders.pending}</span>
          )}
        </button>
        <button 
          className={`tab-btn ${activeTab === 'reservations' ? 'active' : ''}`}
          onClick={() => setActiveTab('reservations')}
        >
          <span className="tab-text">Бронирования</span>
          {reservationsStats?.pending > 0 && (
            <span className="tab-badge">{reservationsStats.pending}</span>
          )}
        </button>
        <button 
          className={`tab-btn ${activeTab === 'users' ? 'active' : ''}`}
          onClick={() => setActiveTab('users')}
        >
          <span className="tab-text">Пользователи</span>
          <span className="tab-badge">{stats.users?.total || 0}</span>
        </button>
        <button 
          className={`tab-btn ${activeTab === 'categories' ? 'active' : ''}`}
          onClick={() => setActiveTab('categories')}
        >
          <span className="tab-text">Категории</span>
        </button>
        <button 
          className="tab-btn"
          onClick={() => navigate('/menu')}
        >
          <span className="tab-text">Управление меню</span>
        </button>
      </div>

      {/* Основной контент */}
      <div className="admin-content">
        {activeTab === 'dashboard' && (
          <div className="dashboard">
            <div className="section-header">
              <h2>Обзор системы</h2>
              <button 
                className="refresh-btn"
                onClick={fetchAdminData}
              >
                 Обновить
              </button>
            </div>
            
            <div className="stats-grid">
              <div className="stat-card stat-primary" onClick={() => setActiveTab('orders')} style={{cursor: 'pointer'}}>
                <div className="stat-text"></div>
                <h3>Всего заказов</h3>
                <span className="stat-number">{stats.orders?.total || 0}</span>
              </div>
              
              <div className="stat-card stat-warning" onClick={() => {
                setActiveTab('orders');
                setFilters({...filters, status: 'Pending'});
              }} style={{cursor: 'pointer'}}>
                <div className="stat-text"></div>
                <h3>Ожидают подтверждения</h3>
                <span className="stat-number">{stats.orders?.pending || 0}</span>
              </div>
              
              <div className="stat-card stat-success">
                <div className="stat-text"></div>
                <h3>Заказов сегодня</h3>
                <span className="stat-number">{stats.orders?.today || 0}</span>
              </div>
              
              <div className="stat-card stat-revenue">
                <div className="stat-text"></div>
                <h3>Выручка сегодня</h3>
                <span className="stat-number">{formatCurrency(stats.revenue?.today || 0)}</span>
              </div>
              
              <div className="stat-card stat-users" onClick={() => setActiveTab('users')} style={{cursor: 'pointer'}}>
                <div className="stat-text"></div>
                <h3>Всего пользователей</h3>
                <span className="stat-number">{stats.users?.total || 0}</span>
              </div>
              
              <div className="stat-card stat-couriers">
                <div className="stat-text"></div>
                <h3>Свободных курьеров</h3>
                <span className="stat-number">{stats.users?.availableCouriers || 0}</span>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'orders' && (
          <div className="orders-section">
            <div className="section-header">
              <h2>Управление заказами</h2>
              <div className="order-filters">
                <select 
                  className="filter-select"
                  value={filters.status}
                  onChange={(e) => setFilters({...filters, status: e.target.value})}
                >
                  <option value="all">Все статусы</option>
                  <option value="Pending">Ожидание</option>
                  <option value="Confirmed">Подтвержденные</option>
                  <option value="Cooking">Готовятся</option>
                  <option value="AssignedToCourier">Курьер назначен</option>
                  <option value="OnTheWay">В пути</option>
                  <option value="Delivered">Доставленные</option>
                  <option value="Cancelled">Отмененные</option>
                </select>
                <select 
                  className="filter-select"
                  value={filters.date}
                  onChange={(e) => setFilters({...filters, date: e.target.value})}
                >
                  <option value="all">За все время</option>
                  <option value="today">Сегодня</option>
                  <option value="week">За неделю</option>
                  <option value="month">За месяц</option>
                </select>
              </div>
            </div>

            {loading ? (
              <div className="loading-state">
                <div className="loading-spinner small"></div>
                <p>Загрузка заказов...</p>
              </div>
            ) : filteredOrders.length === 0 ? (
              <div className="empty-state">
                <div className="empty-text"></div>
                <h3>Нет заказов</h3>
                <p>Здесь появятся заказы от клиентов</p>
                <button 
                  className="refresh-btn" 
                  onClick={fetchAdminData}
                  style={{marginTop: '20px'}}
                >
                  Обновить
                </button>
              </div>
            ) : (
              <div className="orders-list">
                {filteredOrders.map(order => {
                  const statusBadge = getStatusBadge(order.status);
                  return (
                    <div key={order.id} className="order-card" onClick={() => handleOrderClick(order)}>
                      <div className="order-header">
                        <div className="order-title">
                          <span className="order-id">Заказ #{order.id}</span>
                          <span className="order-customer">
                            {order.customerName} • {order.customerPhone}
                          </span>
                        </div>
                        <div className="order-status-group">
                          <span 
                            className="order-status"
                            style={{
                              background: statusBadge.bg,
                              color: statusBadge.color,
                              border: `2px solid ${statusBadge.color}`
                            }}
                          >
                            {getStatusText(order.status)}
                          </span>
                        </div>
                      </div>
                      
                      <div className="order-info">
                        <div className="info-row">
                          <div className="info-item">
                            <span className="info-label">Адрес:</span>
                            <span className="info-value">{order.deliveryAddress || 'Не указан'}</span>
                          </div>
                          <div className="info-item">
                            <span className="info-label">Дата:</span>
                            <span className="info-value">{formatDate(order.createdAt)}</span>
                          </div>
                        </div>
                        
                        <div className="info-row">
                          <div className="info-item">
                            <span className="info-label">Сумма:</span>
                            <span className="info-value amount">{formatCurrency(order.totalAmount)}</span>
                          </div>
                          <div className="info-item">
                            <span className="info-label">Товаров:</span>
                            <span className="info-value">{order.itemsCount || 0} шт.</span>
                          </div>
                        </div>
                      </div>
                      
                      <div className="order-actions">
                        <button className="btn-secondary" onClick={(e) => {
                          e.stopPropagation();
                          handleOrderClick(order);
                        }}>
                          <span className="btn-text">Подробнее</span>
                        </button>
                        <button 
                          className="btn-danger" 
                          onClick={(e) => {
                            e.stopPropagation();
                            handleDeleteOrder(order.id);
                          }}
                        >
                          <span className="btn-text">Удалить</span>
                        </button>
                        <button 
                          className="btn-warning" 
                          onClick={(e) => {
                            e.stopPropagation();
                            handleCancelOrder(order.id);
                          }}
                          style={{
                            background: '#ff9800',
                            color: 'white',
                            border: 'none',
                            padding: '10px 20px',
                            borderRadius: '8px',
                            cursor: 'pointer'
                          }}
                        >
                          Отменить
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}

        {activeTab === 'reservations' && (
          <div className="reservations-section">
            <div className="section-header">
              <h2>Управление бронированиями</h2>
              <div className="reservation-filters">
                <select 
                  className="filter-select"
                  value={reservationFilters.status}
                  onChange={(e) => setReservationFilters({...reservationFilters, status: e.target.value})}
                >
                  <option value="all">Все статусы</option>
                  <option value="pending">Ожидают подтверждения</option>
                  <option value="confirmed">Подтвержденные</option>
                  <option value="cancelled">Отмененные</option>
                  <option value="completed">Завершенные</option>
                  <option value="noshow">Не явились</option>
                </select>
                <select 
                  className="filter-select"
                  value={reservationFilters.date}
                  onChange={(e) => setReservationFilters({...reservationFilters, date: e.target.value})}
                >
                  <option value="all">Все даты</option>
                  <option value="today">Сегодня</option>
                  <option value="upcoming">Предстоящие</option>
                  <option value="past">Прошедшие</option>
                </select>
              </div>
            </div>

            {/* Статистика бронирований */}
            <div className="reservations-stats">
              <div className="stat-card" onClick={() => setReservationFilters({...reservationFilters, status: 'pending'})} style={{cursor: 'pointer'}}>
                <div className="stat-text"></div>
                <h3>Ожидают</h3>
                <span className="stat-number">{reservationsStats?.pending || 0}</span>
              </div>
              <div className="stat-card" onClick={() => setReservationFilters({...reservationFilters, date: 'today'})} style={{cursor: 'pointer'}}>
                <div className="stat-text"></div>
                <h3>Сегодня</h3>
                <span className="stat-number">{reservationsStats?.today || 0}</span>
              </div>
              <div className="stat-card" onClick={() => setReservationFilters({...reservationFilters, status: 'confirmed'})} style={{cursor: 'pointer'}}>
                <div className="stat-text"></div>
                <h3>Подтверждено</h3>
                <span className="stat-number">{reservationsStats?.upcoming || 0}</span>
              </div>
              <div className="stat-card" onClick={() => setReservationFilters({...reservationFilters, status: 'cancelled'})} style={{cursor: 'pointer'}}>
                <div className="stat-text"></div>
                <h3>Отменено</h3>
                <span className="stat-number">{reservationsStats?.cancelledToday || 0}</span>
              </div>
            </div>

            {/* Список бронирований */}
            {loading ? (
              <div className="loading-state">
                <div className="loading-spinner small"></div>
                <p>Загрузка бронирований...</p>
              </div>
            ) : reservations.length === 0 ? (
              <div className="empty-state">
                <div className="empty-text"></div>
                <h3>Нет бронирований</h3>
                <p>Здесь появятся бронирования клиентов</p>
                <button 
                  className="refresh-btn" 
                  onClick={() => {
                    fetchReservations();
                    fetchReservationsStats();
                  }}
                  style={{marginTop: '20px'}}
                >
                  Обновить
                </button>
              </div>
            ) : (
              <div className="reservations-table-container">
                <div className="reservations-table">
                  <table>
                    <thead>
                      <tr>
                        <th>ID</th>
                        <th>Клиент</th>
                        <th>Тип</th>
                        <th>Дата/Время</th>
                        <th>Гостей</th>
                        <th>Статус</th>
                        <th>Действия</th>
                      </tr>
                    </thead>
                    <tbody>
                      {reservations.map(reservation => {
                        const statusBadge = getReservationStatusBadge(reservation.status);
                        return (
                          <tr key={reservation.id} className="reservation-row">
                            <td className="reservation-id">#{reservation.id}</td>
                            <td className="reservation-customer">
                              <div className="customer-info">
                                <div className="customer-name">{reservation.customerName}</div>
                                <div className="customer-contacts">
                                  {reservation.customerPhone} {reservation.customerEmail && `• ${reservation.customerEmail}`}
                                </div>
                              </div>
                            </td>
                            <td className="reservation-type">{reservation.type}</td>
                            <td className="reservation-date">{formatDate(reservation.reservationDateTime)}</td>
                            <td className="reservation-guests">{reservation.guestsCount}</td>
                            <td className="reservation-status">
                              <span className="status-badge" style={{
                                background: statusBadge.bg,
                                color: statusBadge.color
                              }}>
                                {getReservationStatusText(reservation.status)}
                              </span>
                            </td>
                            <td className="reservation-actions">
                              <div className="action-buttons">
                                <button 
                                  className="action-text-btn" 
                                  title="Подробнее"
                                  onClick={() => handleReservationClick(reservation)}
                                >
                                  Подробнее
                                </button>
                                {reservation.status === 'pending' && (
                                  <button 
                                    className="action-text-btn confirm-btn" 
                                    title="Подтвердить"
                                    onClick={() => handleConfirmReservation(reservation.id)}
                                  >
                                    Подтвердить
                                  </button>
                                )}
                                <button 
                                  className="action-text-btn cancel-btn" 
                                  title="Отменить"
                                  onClick={() => handleCancelReservation(reservation.id)}
                                >
                                  Отменить
                                </button>
                                <button 
                                  className="action-text-btn call-btn" 
                                  title="Позвонить"
                                  onClick={() => handleCallReservationCustomer(reservation)}
                                >
                                  Позвонить
                                </button>
                              </div>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </div>
        )}

        {activeTab === 'users' && (
          <div className="users-section">
            <div className="section-header">
              <h2>Пользователи системы</h2>
              <button className="add-user-btn" onClick={handleAddUser}>
                <span className="btn-text">Добавить пользователя</span>
              </button>
            </div>

            {loading ? (
              <div className="loading-state">
                <div className="loading-spinner small"></div>
                <p>Загрузка пользователей...</p>
              </div>
            ) : users.length === 0 ? (
              <div className="empty-state">
                <div className="empty-text"></div>
                <h3>Нет пользователей</h3>
                <p>Здесь появятся пользователи системы</p>
                <button 
                  className="refresh-btn" 
                  onClick={fetchAdminData}
                  style={{marginTop: '20px'}}
                >
                   Обновить
                </button>
              </div>
            ) : (
              <div className="users-table-container">
                <div className="table-controls">
                  <input 
                    type="text" 
                    placeholder="Поиск пользователей..." 
                    className="search-input"
                    onChange={(e) => {
                    
                    }}
                  />
                  <select className="filter-select">
                    <option value="all">Все роли</option>
                    <option value="Admin">Администраторы</option>
                    <option value="Courier">Курьеры</option>
                    <option value="Client">Клиенты</option>
                  </select>
                </div>
                
                <div className="users-table">
                  <table>
                    <thead>
                      <tr>
                        <th>ID</th>
                        <th>Имя</th>
                        <th>Email</th>
                        <th>Роль</th>
                        <th>Телефон</th>
                        <th>Регистрация</th>
                        <th>Действия</th>
                      </tr>
                    </thead>
                    <tbody>
                      {users.map(user => (
                        <tr key={user.id} className="user-row">
                          <td className="user-id">#{user.id}</td>
                          <td className="user-name">
                            <div className="name-wrapper">
                              <div className="avatar">
                                {user.firstName?.[0]}{user.lastName?.[0]}
                              </div>
                              <div className="name-info">
                                <div className="full-name">{user.firstName} {user.lastName}</div>
                                <div className="user-email-mobile">{user.email}</div>
                              </div>
                            </div>
                          </td>
                          <td className="user-email">{user.email}</td>
                          <td className="user-role">
                            <span className={`role-badge role-${user.role.toLowerCase()}`}>
                              {getRoleText(user.role)}
                            </span>
                          </td>
                          <td className="user-phone">{user.phoneNumber}</td>
                          <td className="user-date">{formatDate(user.createdAt)}</td>
                          <td className="user-actions">
                            <button 
                              className="action-text-btn" 
                              title="Редактировать"
                              onClick={() => handleEditUser(user)}
                            >
                              Редактировать
                            </button>
                            <button 
                              className="action-text-btn" 
                              title="Удалить"
                              onClick={() => handleDeleteUser(user.id)}
                            >
                              Удалить
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </div>
        )}

        {activeTab === 'categories' && (
          <div className="categories-section">
            <div className="section-header">
              <h2>Управление категориями</h2>
              <button className="add-user-btn" onClick={handleAddCategory}>
                <span className="btn-text">Добавить категорию</span>
              </button>
            </div>

            {loading ? (
              <div className="loading-state">
                <div className="loading-spinner small"></div>
                <p>Загрузка категорий...</p>
              </div>
            ) : categories.length === 0 ? (
              <div className="empty-state">
                <div className="empty-text"></div>
                <h3>Нет категорий</h3>
                <p>Добавьте категории для организации меню</p>
                <button 
                  className="refresh-btn" 
                  onClick={fetchAdminData}
                  style={{marginTop: '20px'}}
                >
                  Обновить
                </button>
              </div>
            ) : (
              <div className="categories-grid">
                {categories.map(category => (
                  <div key={category.id} className="category-card">
                    <div className="category-image">
                      {category.imageUrl ? (
                        <img src={category.imageUrl} alt={category.name} />
                      ) : (
                        <div className="category-image-placeholder">
                          {category.name.charAt(0)}
                        </div>
                      )}
                    </div>
                    <div className="category-info">
                      <h3 className="category-name">{category.name}</h3>
                      {category.description && (
                        <p className="category-description">{category.description}</p>
                      )}
                      <div className="category-stats">
                        <span className="stat-item">
                          {category.itemsCount || 0} блюд
                        </span>
                      </div>
                    </div>
                    <div className="category-actions">
                      <button 
                        className="action-text-btn" 
                        title="Редактировать"
                        onClick={() => handleEditCategory(category)}
                      >
                        Редактировать
                      </button>
                      <button 
                        className="action-text-btn" 
                        title="Удалить"
                        onClick={() => handleDeleteCategory(category.id)}
                      >
                        Удалить
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>

      {/* Футер */}
      <div className="admin-footer">
        <div className="footer-content">
          <div className="footer-info">
            <div className="system-status">
              <span className="status-indicator active"></span>
              Система активна
            </div>
            <div className="server-time">
              Серверное время: {new Date().toLocaleTimeString('ru-RU')}
            </div>
          </div>
          <div className="footer-version">
            v1.0.0 • {new Date().getFullYear()} © Ресторан
          </div>
        </div>
      </div>
    </div>
  );
};

export default Admin;