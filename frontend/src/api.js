import axios from "axios";
import { API_BASE_URL } from "./services/apiBase";

const api = axios.create({
  baseURL: API_BASE_URL,
  withCredentials: true,
});

export default api;
