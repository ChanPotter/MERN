import { create } from 'zustand';
import axios from '../lib/axios';
import { toast } from 'react-hot-toast';

/*
		Store for managing user authentication and profile data.
		- `user` : bien nay la thong tin nguoi dung dang nhap
		- `loading`: Boolean indicating if a request is in progress.
		- `checkingAuth`: Boolean indicating if the authentication status is being checked.
		- `signup`: Function to handle user signup.
		- `login`: Function to handle user login.
		- `logout`: Function to handle user logout.
		- `checkAuth`: Function to check if the user is authenticated.
		- `refreshToken`: Function to refresh the user's authentication token.
	*/
	// create(set, get) la hàm tạo store trong zustand
	// set là hàm để cập nhật state trong zustand
	// get là hàm để lấy state trong zustand 
export const useUserStore = create((set, get) => ({
	user: null,
	loading: false,
	checkingAuth: true,

	/**
	 * Handles user signup.
	 * @param {object} data - Signup form data
	 * @param {string} data.name - User's full name
	 * @param {string} data.email - User's email address
	 * @param {string} data.password - User's password
	 * @param {string} data.confirmPassword - User's password confirmation
	 */
	signup: async ({ name, email, password, confirmPassword }) => {
		set({ loading: true });

		if (password !== confirmPassword) {
			set({ loading: false });
			return toast.error('Passwords do not match');
		}

		try {
			const res = await axios.post('/auth/signup', { name, email, password }); // Send signup request to the server
			set({ user: res.data, loading: false });
		} catch (error) {
			set({ loading: false });
			toast.error(error.response.data.message || 'An error occurred');
		}
	},
	login: async (email, password) => {
		set({ loading: true });

		try {
			const res = await axios.post('/auth/login', { email, password });
			// data ở đây la thông tin nguoi dung
			set({ user: res.data, loading: false });
		} catch (error) {
			set({ loading: false });
			toast.error(error.response.data.message || 'An error occurred');
		}
	},

	logout: async () => {
		try {
			await axios.post('/auth/logout');
			set({ user: null });
		} catch (error) {
			toast.error(
				error.response?.data?.message || 'An error occurred during logout'
			);
		}
	},

	checkAuth: async () => {
		set({ checkingAuth: true });
		try {
			const response = await axios.get('/auth/profile');
			set({ user: response.data, checkingAuth: false });
		} catch (error) {
			console.log(error.message);
			set({ checkingAuth: false, user: null });
		}
	},

	refreshToken: async () => {
		// Prevent multiple simultaneous refresh attempts
		if (get().checkingAuth) return;

		set({ checkingAuth: true });
		try {
			const response = await axios.post('/auth/refresh-token');
			set({ checkingAuth: false });
			return response.data;
		} catch (error) {
			set({ user: null, checkingAuth: false });
			throw error;
		}
	},
}));

// TODO: Implement the axios interceptors for refreshing access token

// Axios interceptor for token refresh
let refreshPromise = null;

axios.interceptors.response.use(
	(response) => response,
	async (error) => {
		const originalRequest = error.config;
		if (error.response?.status === 401 && !originalRequest._retry) {
			originalRequest._retry = true;

			try {
				// If a refresh is already in progress, wait for it to complete
				if (refreshPromise) {
					await refreshPromise;
					return axios(originalRequest);
				}

				// Start a new refresh process
				refreshPromise = useUserStore.getState().refreshToken();
				await refreshPromise;
				refreshPromise = null;

				return axios(originalRequest);
			} catch (refreshError) {
				// If refresh fails, redirect to login or handle as needed
				useUserStore.getState().logout();
				return Promise.reject(refreshError);
			}
		}
		return Promise.reject(error);
	}
);
