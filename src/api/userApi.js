import axios from "axios";

const API_URL = "http://localhost:5000/api/user";

const userApi = {
  getProfile: () => axios.get(`${API_URL}/profile`),
  updateProfile: (data) => axios.put(`${API_URL}/update`, data),
  getExclusiveContent: () => axios.get(`${API_URL}/exclusive`),
};

export default userApi;
