import React, { useState } from 'react';
import { useNavigate, useSearchParams, Link } from 'react-router-dom';
import { verifyCode } from '../services/api';
import '../styles/auth.css';

export default function VerifyCode() {
    const [searchParams] = useSearchParams();
    const email = searchParams.get('email');
    const [formData, setFormData] = useState({ code: '', favoritePokemon: '' });
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
            await verifyCode({ email, ...formData });
            navigate(`/reset-password?email=${email}`);
        } catch (err) {
            setError(err.response?.data?.error || 'Verification failed');
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

                <h1>Verify Code</h1>

                {error && <div className="error-message">{error}</div>}

                <form onSubmit={handleSubmit}>
                    <div className="form-group">
                        <label htmlFor="code">Reset Code</label>
                        <input
                            type="text"
                            id="code"
                            name="code"
                            value={formData.code}
                            onChange={handleChange}
                            placeholder="Enter 6-digit code"
                            required
                        />
                    </div>

                    <div className="form-group">
                        <label htmlFor="favoritePokemon">Favorite Pokemon</label>
                        <input
                            type="text"
                            id="favoritePokemon"
                            name="favoritePokemon"
                            value={formData.favoritePokemon}
                            onChange={handleChange}
                            placeholder="e.g., Pikachu"
                            required
                        />
                    </div>

                    <button type="submit" className="btn" disabled={loading}>
                        {loading ? 'Verifying...' : 'Verify'}
                    </button>
                </form>

                <div className="signup-link">
                    <Link to="/forgot-password">Request new code</Link>
                </div>
            </div>
        </div>
    );
}