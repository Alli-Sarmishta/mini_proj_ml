const { exec } = require('child_process');
const util = require('util');
const axios = require('axios');

// Promisify exec
const execAsync = util.promisify(exec);

// JWT token configuration
const JWT_TOKEN = process.env.JWT_TOKEN || 'your-jwt-token-here';
const API_BASE_URL = 'https://miniprojectfinal.onrender.com';

// Function to fetch users from the backend
async function fetchUsers() {
    try {
        const response = await axios.get(`${API_BASE_URL}/resumes`, {
            headers: {
                'Authorization': `Bearer ${JWT_TOKEN}`
            }
        });
        return response.data;
    } catch (error) {
        console.error('Error fetching users:', error);
        return [];
    }
}

module.exports = {
    execAsync,
    fetchUsers
}; 