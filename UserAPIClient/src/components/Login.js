import React, { useState } from 'react';
import { loginUser } from '../Api'; // Import API function
import { useNavigate } from 'react-router-dom'; // To navigate after login

import 'bootstrap/dist/css/bootstrap.min.css';

const Login = () => {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    const navigate = useNavigate();

    const handleLogin = async (e) => {
        e.preventDefault();
        try {
            const data = await loginUser(email, password);
            console.log('Logged in successfully:', data);
            navigate('/dashboard'); // Navigate to dashboard after successful login
        } catch (err) {
            setError('Login failed. Please check your credentials and try again.');
        }
    };

    return (
        <div className="container mt-5">
            <div className="row justify-content-center">
                <div className="col-md-6">
                    <div className="card p-4 m-5">
                        <h4 className="text-center mb-2 text-primary">Login</h4>
                        <form onSubmit={handleLogin}>
                            <div className="form-group mb-2">
                                <label>Email</label>
                                <input
                                    type="email"
                                    className="form-control"
                                    value={email}
                                    onChange={(e) => setEmail(e.target.value)}
                                    required
                                />
                            </div>
                            <div className="form-group mb-2">
                                <label>Password</label>
                                <input
                                    type="password"
                                    className="form-control"
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                    required
                                />
                            </div>
                            {error && <p className="text-danger">{error}</p>}
                            <button type="submit" className="btn btn-primary btn-block w-100">
                                Login
                            </button>
                        </form>
                        <p className="text-center mt-2">
                            Don't have an account? <a href="/register">Register here</a>
                        </p>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default Login;
