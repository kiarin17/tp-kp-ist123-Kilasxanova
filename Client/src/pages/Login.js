import React, { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import axios from "axios";
import { FaUser, FaLock, FaArrowLeft, FaCrown } from "react-icons/fa";
import '../styles/login.css';

const Login = () => {
    const [form, setForm] = useState({ 
        email: "", 
        password: ""
    });
    const [message, setMessage] = useState("");
    const [error, setError] = useState("");
    const [loading, setLoading] = useState(false);
    const navigate = useNavigate();

    const handleChange = (e) => {
        const { name, value } = e.target;
        setForm(prev => ({ ...prev, [name]: value }));
        setError("");
        setMessage("");
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        
        if (!form.email || !form.password) {
            setError("Заполните все поля");
            return;
        }

        setLoading(true);
        setError("");
        setMessage("");

        try {
            const response = await axios.post('http://localhost:5110/api/auth/login', form);
            
            localStorage.setItem('token', response.data.token);
            localStorage.setItem('user', JSON.stringify(response.data.user));
            
            setMessage('Вход выполнен успешно! Перенаправляем...');
            
            // Перенаправляем в зависимости от роли
            setTimeout(() => {
                const user = response.data.user;
                if (user.role === 'Admin') {
                    navigate('/admin');
                } else if (user.role === 'Client') {
                    navigate('/client');
                } else {
                    navigate('/');
                }
            }, 1000);
            
        } catch (err) {
            console.error('Ошибка входа:', err);
            
            if (err.response?.status === 400 || err.response?.status === 401) {
                setError('Неверный email или пароль');
            } else if (err.response?.data?.message) {
                setError(err.response.data.message);
            } else if (err.message === 'Network Error') {
                setError('Ошибка сети. Проверьте подключение к серверу');
            } else {
                setError('Ошибка сервера. Попробуйте позже');
            }
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="login-container">
            <div className="login-content">
                <div className="login-header">
                    <div className="login-logo">
                        <h1 className="logo-title">Граф Суворов</h1>
                    </div>
                    <p className="login-subtitle">Вход в систему</p>
                    <div className="header-divider">
                        <div className="divider-line"></div>
                        <div className="divider-icon"></div>
                        <div className="divider-line"></div>
                    </div>
                </div>
                
                <div className="login-form-wrapper">
                    {error && (
                        <div className="login-error">
                            <div className="error-icon">!</div>
                            <div className="error-text">{error}</div>
                        </div>
                    )}
                    
                    {message && (
                        <div className="login-success">
                            <div className="success-icon">✓</div>
                            <div className="success-text">{message}</div>
                        </div>
                    )}
                    
                    <form onSubmit={handleSubmit} className="login-form">
                        <div className="form-group">
                            <div className="input-wrapper">
                                <div className="input-icon">
                                    <FaUser />
                                </div>
                                <input
                                    type="email"
                                    id="email"
                                    name="email"
                                    value={form.email}
                                    onChange={handleChange}
                                    required
                                    className="form-input"
                                />
                                <label htmlFor="email" className="floating-label">
                                    Email
                                </label>
                            </div>
                        </div>

                        <div className="form-group">
                            <div className="input-wrapper">
                                <div className="input-icon">
                                    <FaLock />
                                </div>
                                <input
                                    type="password"
                                    id="password"
                                    name="password"
                                    value={form.password}
                                    onChange={handleChange}
                                    required
                                    className="form-input"
                                />
                                <label htmlFor="password" className="floating-label">
                                    Пароль
                                </label>
                            </div>
                        </div>
                        
                        <button 
                            type="submit" 
                            className={`login-button ${loading ? 'loading' : ''}`}
                            disabled={loading}
                        >
                            {loading ? (
                                <>
                                    <span className="spinner"></span>
                                    <span>Вход...</span>
                                </>
                            ) : (
                                'Войти'
                            )}
                        </button>
                    </form>
                    
                    <div className="login-links">
                        <Link to="/register" className="register-link">
                            <span>Нет аккаунта?</span>
                            <span className="link-arrow">→</span>
                        </Link>
                        
                        <Link to="/" className="back-link">
                            <FaArrowLeft />
                            <span>Вернуться на главную</span>
                        </Link>
                    </div>
                </div>
                
                <div className="login-footer">
                    <p className="footer-text">
                        Вход в систему подтверждает ваше согласие с правилами использования
                    </p>
                </div>
            </div>
            
            <div className="login-decoration">
                <div className="decoration-ornament ornament-1"></div>
                <div className="decoration-ornament ornament-2"></div>
                <div className="decoration-ornament ornament-3"></div>
            </div>
        </div>
    );
};

export default Login;