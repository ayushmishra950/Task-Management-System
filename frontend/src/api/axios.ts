import axios, {
  AxiosError,
  InternalAxiosRequestConfig,
} from "axios";

const API_URL = import.meta.env.VITE_API_URL;

export const api = axios.create({
  baseURL: API_URL,
  withCredentials: true,
});

let isRefreshing = false;

let failedQueue: {
  resolve: () => void;
  reject: (error: unknown) => void;
}[] = [];

const processQueue = (error: unknown = null) => {
  failedQueue.forEach(({ resolve, reject }) => {
    if (error) {
      reject(error);
    } else {
      resolve();
    }
  });

  failedQueue = [];
};

api.interceptors.response.use(
  (response) => {
    return response;
  },

  async (error: AxiosError) => {
    const originalRequest =
      error.config as InternalAxiosRequestConfig & {
        _retry?: boolean;
      };

    // Sirf 401 ko handle karna hai
    if (error.response?.status !== 401) {
      return Promise.reject(error);
    }

    // Agar refresh request khud 401 de rahi hai
    // to infinite loop nahi chalna chahiye
    if (originalRequest?.url?.includes("/api/session/token/refresh-token")) {
      window.location.href = "/login";
      return Promise.reject(error);
    }

    // Same request ko dobara refresh nahi karna
    if (originalRequest?._retry) {
      window.location.href = "/login";
      return Promise.reject(error);
    }

    originalRequest._retry = true;

    // Agar already refresh chal raha hai
    // to current request queue mein wait karegi
    if (isRefreshing) {
      return new Promise<void>((resolve, reject) => {
        failedQueue.push({
          resolve,
          reject,
        });
      }).then(() => {
        return api(originalRequest);
      });
    }

    isRefreshing = true;

    try {
      // Refresh token HttpOnly cookie se automatically jayega
      await api.post("/auth/refresh");

      // Jo requests wait kar rahi thi unko release karo
      processQueue();

      // Original request ko new accessToken cookie ke saath retry karo
      return api(originalRequest);
    } catch (refreshError) {
      processQueue(refreshError);

      // Refresh token bhi invalid/expired/revoked hai
      window.location.href = "/login";

      return Promise.reject(refreshError);
    } finally {
      isRefreshing = false;
    }
  }
);
