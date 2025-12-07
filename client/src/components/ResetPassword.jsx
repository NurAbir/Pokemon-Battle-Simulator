import React, { useState } from 'react';
import { useNavigate, useSearchParams, Link } from 'react-router-dom';
import { resetPassword } from '../services/api';
import '../styles/auth.css';

export default function ResetPassword() {
    const [searchParams] = useSearchParams();
    const email = searchParams.get('email');
    const [formData, setFormData] = useState({ password: '', confirmPassword: '' });
    const [error, setError] = useState(null);
    const [loading, setLoading] = useState(false);
    const navigate = useNavigate();

    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData({ ...formData, [name]: value });
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError(null);
        setLoading(true);

        try {
            await resetPassword({ email, ...formData });
            navigate('/login');
        } catch (err) {
            setError(err.response?.data?.error || 'Password reset failed');
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

                <h1>Reset Password</h1>

                {error && <div className="error-message">{error}</div>}

                <form onSubmit={handleSubmit}>
                    <div className="form-group">
                        <label htmlFor="password">New Password</label>
                        <input
                            type="password"
                            id="password"
                            name="password"
                            value={formData.password}
                            onChange={handleChange}
                            placeholder="Enter new password"
                            required
                        />
                    </div>

                    <div className="form-group">
                        <label htmlFor="confirmPassword">Confirm Password</label>
                        <input
                            type="password"
                            id="confirmPassword"
                            name="confirmPassword"
                            value={formData.confirmPassword}
                            onChange={handleChange}
                            placeholder="Confirm password"
                            required
                        />
                    </div>

                    <button type="submit" className="btn" disabled={loading}>
                        {loading ? 'Resetting...' : 'Reset Password'}
                    </button>
                </form>

                <div className="signup-link">
                    <Link to="/login">Back to login</Link>
                </div>
            </div>
        </div>
    );
}