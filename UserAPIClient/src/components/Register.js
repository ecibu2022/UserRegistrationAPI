import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom'; // To navigate after register
import { registerUser } from '../Api'; // Import API function

import 'bootstrap/dist/css/bootstrap.min.css';

const Register = () => {
    const [fullname, setFullname] = useState('');
    const [email, setEmail] = useState('');
    const [username, setUsername] = useState('');
    const [password, setPassword] = useState('');
    const [avatar, setAvatar] = useState(null);
    const [coverImage, setCoverImage] = useState(null);
    const [error, setError] = useState('');
    const navigate = useNavigate();

    const handleRegister = async (e) => {
        e.preventDefault();

        const formData = new FormData();
        formData.append('fullname', fullname);
        formData.append('email', email);
        formData.append('username', username);
        formData.append('password', password);
        if (avatar) formData.append('avatar', avatar);
        if (coverImage) formData.append('coverImage', coverImage);

        try {
            // Call API function to register user
            const data = await registerUser(formData);
            console.log('User registered:', data);
            // Redirect to login page after successful registration
            navigate('/');
        } catch (err) {
            setError('Registration failed. Please try again.');
        }
    };

    return (
        <div className="container-fluid bg-light">
            <div className="row justify-content-center">
                <div className="col-md-6">
                    <div className="card p-4 m-4">
                        <h4 className="text-center mb-2 text-primary">Register</h4>
                        <form onSubmit={handleRegister}>
                            <div className="form-group mb-2">
                                <label>Fullname</label>
                                <input
                                    type="text"
                                    className="form-control"
                                    value={fullname}
                                    onChange={(e) => setFullname(e.target.value)}
                                    required
                                />
                            </div>
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
                                <label>Username</label>
                                <input
                                    type="text"
                                    className="form-control"
                                    value={username}
                                    onChange={(e) => setUsername(e.target.value)}
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
                            <div className="form-group mb-2">
                                <label>Avatar</label>
                                <input
                                    type="file"
                                    className="form-control"
                                    accept="image/*"
                                    onChange={(e) => setAvatar(e.target.files[0])}
                                    required
                                />
                            </div>
                            <div className="form-group mb-2">
                                <label>Cover Image (Optional)</label>
                                <input
                                    type="file"
                                    className="form-control"
                                    accept="image/*"
                                    onChange={(e) => setCoverImage(e.target.files[0])}
                                />
                            </div>
                            {error && <p className="text-danger">{error}</p>}
                            <button type="submit" className="btn btn-primary btn-block w-100">Register</button>
                            <p className="text-center mt-2">
                                Already have an account? <a href="/">Login here</a>
                            </p>
                        </form>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default Register;
