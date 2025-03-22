import axios from "axios";

const API_URL = "http://localhost:5000/api/auth";  // Change this to match your backend URL

const authApi = {
  login: (credentials) => axios.post(`${API_URL}/login`, credentials),
  signup: (credentials) => axios.post(`${API_URL}/signup`, credentials),
};

export default authApi;
