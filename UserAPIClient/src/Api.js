import axios from 'axios';

// Set up Axios instance
const Api = axios.create({
    baseURL: 'http://localhost:7000/api/v1', // Replace with your API's base URL
    headers: {
        'Content-Type': 'application/json', //Accept only json data
    },
});

// Register user
export const registerUser = async (formData) => {
    try {
        const response = await Api.post('/users/register', formData, {
            headers: {
                'Content-Type': 'multipart/form-data',
            },
        });
        return response.data;
    } catch (error) {
        console.error('Error registering user:', error.response ? error.response.data : error.message);
        throw error;
    }
};

// Login user
export const loginUser = async (email, password) => {
    try {
        const response = await Api.post('/users/login', { email, password });
        return response.data;
    } catch (error) {
        console.error('Error logging in:', error.response ? error.response.data : error.message);
        throw error;
    }
};

// Add more API functions as needed
