import React, { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import axios from "axios";
import { FaUser, FaLock } from "react-icons/fa";

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
        <div style={styles.container}>
            <div style={styles.form}>
                <div style={styles.logo}>
                    <h1 style={styles.logoText}>Граф Суворов</h1>
                    <p style={styles.logoSubtitle}>Вход в систему</p>
                </div>
                
                {error && (
                    <div style={styles.error}>
                        <div style={styles.errorIcon}>!</div>
                        <div style={styles.errorText}>{error}</div>
                    </div>
                )}
                
                {message && (
                    <div style={styles.success}>
                        <div style={styles.successIcon}>✓</div>
                        <div style={styles.successText}>{message}</div>
                    </div>
                )}
                
                <form onSubmit={handleSubmit} style={styles.formContent}>
                    <div style={styles.formGroup}>
                        <label htmlFor="email" style={styles.label}>
                            <FaUser style={styles.labelIcon} />
                            Email
                        </label>
                        <input
                            type="email"
                            id="email"
                            name="email"
                            value={form.email}
                            onChange={handleChange}
                            required
                            placeholder="example@mail.ru"
                            style={styles.input}
                        />
                    </div>

                    <div style={styles.formGroup}>
                        <label htmlFor="password" style={styles.label}>
                            <FaLock style={styles.labelIcon} />
                            Пароль
                        </label>
                        <input
                            type="password"
                            id="password"
                            name="password"
                            value={form.password}
                            onChange={handleChange}
                            required
                            placeholder="Введите пароль"
                            style={styles.input}
                        />
                    </div>
                    
                    <button 
                        type="submit" 
                        style={{
                            ...styles.button,
                            ...(loading ? styles.buttonDisabled : {})
                        }}
                        disabled={loading}
                    >
                        {loading ? 'Вход...' : 'Войти'}
                    </button>
                </form>
                
                <div style={styles.links}>
                    <p style={styles.linkText}>
                        Нет аккаунта?{' '}
                        <Link to="/register" style={styles.link}>
                            Зарегистрироваться
                        </Link>
                    </p>
                    <p style={styles.linkText}>
                        <Link to="/" style={styles.link}>
                            ← Вернуться на главную
                        </Link>
                    </p>
                </div>
            </div>
            
            <div style={styles.footer}>
                <p style={styles.footerText}>
                    Вход в систему подтверждает ваше согласие с правилами использования
                </p>
            </div>
        </div>
    );
};

const styles = {
    container: {
        minHeight: '100vh',
        background: 'linear-gradient(135deg, #8B4513 0%, #D2691E 100%)',
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'center',
        alignItems: 'center',
        padding: '20px',
        fontFamily: "'Segoe UI', Tahoma, Geneva, Verdana, sans-serif"
    },
    form: {
        background: 'white',
        padding: '40px',
        borderRadius: '20px',
        boxShadow: '0 20px 60px rgba(0, 0, 0, 0.3)',
        width: '100%',
        maxWidth: '400px',
        border: '2px solid #FFD700'
    },
    logo: {
        textAlign: 'center',
        marginBottom: '30px'
    },
    logoText: {
        color: '#8B4513',
        fontSize: '2.5rem',
        fontWeight: 'bold',
        margin: '0 0 10px 0'
    },
    logoSubtitle: {
        color: '#666',
        fontSize: '1rem',
        margin: 0
    },
    formContent: {
        marginBottom: '20px'
    },
    formGroup: {
        marginBottom: '20px'
    },
    label: {
        display: 'flex',
        alignItems: 'center',
        marginBottom: '8px',
        color: '#8B4513',
        fontWeight: '600',
        fontSize: '14px'
    },
    labelIcon: {
        marginRight: '8px',
        fontSize: '16px'
    },
    input: {
        width: '100%',
        padding: '14px 16px',
        border: '2px solid #FFE4B5',
        borderRadius: '10px',
        fontSize: '1rem',
        transition: 'all 0.3s ease',
        background: '#fff',
        color: '#333'
    },
    button: {
        width: '100%',
        background: 'linear-gradient(135deg, #8B4513, #D2691E)',
        color: 'white',
        border: 'none',
        padding: '16px',
        borderRadius: '10px',
        fontSize: '1.1rem',
        fontWeight: 'bold',
        cursor: 'pointer',
        transition: 'all 0.3s ease',
        marginTop: '10px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center'
    },
    buttonDisabled: {
        opacity: 0.7,
        cursor: 'not-allowed'
    },
    error: {
        background: 'linear-gradient(135deg, #ff4444, #cc0000)',
        color: 'white',
        padding: '15px',
        borderRadius: '10px',
        marginBottom: '25px',
        display: 'flex',
        alignItems: 'center',
    },
    errorIcon: {
        background: 'white',
        color: '#ff4444',
        width: '24px',
        height: '24px',
        borderRadius: '50%',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        fontWeight: 'bold',
        marginRight: '12px',
        fontSize: '14px'
    },
    errorText: {
        flex: 1,
        fontWeight: '500'
    },
    success: {
        background: 'linear-gradient(135deg, #4CAF50, #2E7D32)',
        color: 'white',
        padding: '15px',
        borderRadius: '10px',
        marginBottom: '25px',
        display: 'flex',
        alignItems: 'center',
    },
    successIcon: {
        background: 'white',
        color: '#4CAF50',
        width: '24px',
        height: '24px',
        borderRadius: '50%',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        fontWeight: 'bold',
        marginRight: '12px',
        fontSize: '14px'
    },
    successText: {
        flex: 1,
        fontWeight: '500'
    },
    links: {
        textAlign: 'center',
        marginTop: '20px',
        paddingTop: '20px',
        borderTop: '1px solid #eee'
    },
    linkText: {
        color: '#666',
        fontSize: '0.95rem',
        margin: '0 0 10px 0'
    },
    link: {
        color: '#8B4513',
        fontWeight: '600',
        textDecoration: 'none',
        transition: 'color 0.3s ease'
    },
    footer: {
        marginTop: '30px',
        textAlign: 'center',
        color: 'rgba(255, 255, 255, 0.8)',
        fontSize: '0.8rem',
        maxWidth: '500px',
        padding: '0 20px'
    },
    footerText: {
        margin: 0
    }
};

export default Login;