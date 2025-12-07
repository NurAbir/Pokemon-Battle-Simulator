import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { forgotPassword } from '../services/api';
import '../styles/auth.css';

export default function ForgotPassword() {
    const [email, setEmail] = useState('');
    const [error, setError] = useState(null);
    const [loading, setLoading] = useState(false);
    const navigate = useNavigate();

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError(null);
        setLoading(true);

        try {
            await forgotPassword({ email });
            navigate(`/verify-code?email=${email}`);
        } catch (err) {
            setError(err.response?.data?.error || 'Failed to send code');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div>
            <Link to="/" className="home-btn"> Home</Link>

            <div className="container">
                <div className="logo">
                    <img src="/images/logo.png" alt="Logo" />
                </div>

                <h1>Forgot Password</h1>

                {error && <div className="error-message">{error}</div>}

                <form onSubmit={handleSubmit}>
                    <div className="form-group">
                        <label htmlFor="email">Email Address</label>
                        <input
                            type="email"
                            id="email"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            placeholder="Enter your email"
                            required
                        />
                    </div>

                    <button type="submit" className="btn" disabled={loading}>
                        {loading ? 'Sending...' : 'Send Reset Code'}
                    </button>
                </form>

                <div className="signup-link">
                    Remember password? <Link to="/login">Log in here</Link>
                </div>
            </div>
        </div>
    );
}