import { useState } from "react";
import { registerUser } from "../api";

const Register = () => {
    const [form, setForm] = useState({ username: "", email: "", passwordHash: "" });
    const [message, setMessage] = useState("");

    const handleChange = (e) => {
        const { name, value } = e.target;
        setForm(prev => ({ ...prev, [name]: value }));
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        try {
            const data = await registerUser(form);
            setMessage(data.message);
            setForm({ username: "", email: "", passwordHash: "" });
        } catch (err) {
            setMessage(err.response.data);
        }
    };

    return (
        <div>
            <h2>Register</h2>
            <form onSubmit={handleSubmit}>
                <input name="username" placeholder="Username" value={form.username} onChange={handleChange} />
                <input name="email" placeholder="Email" value={form.email} onChange={handleChange} />
                <input name="passwordHash" type="password" placeholder="Password" value={form.passwordHash} onChange={handleChange} />
                <button type="submit">Register</button>
            </form>
            {message && <p>{message}</p>}
        </div>
    );
};

export default Register;