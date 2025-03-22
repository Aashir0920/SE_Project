import axios from "axios";

const API_URL = "http://localhost:5000/api/subscriptions";

const subscriptionApi = {
  getSubscription: () => axios.get(API_URL),
  cancelSubscription: () => axios.post(`${API_URL}/cancel`),
};

export default subscriptionApi;
