import { create } from 'zustand';
import toast from 'react-hot-toast';
import axios from '../lib/axios';

export const useChatStore = create((set, get) => ({
	chats: [],
	users: [],
	selectedUserId: null,
	loading: false,
	message: '',

	setSelectedUserId: (userId) => set({ selectedUserId: userId }),

	setMessage: (msg) => set({ message: msg }),

	// Gọi API: lấy tin nhắn giữa admin và user đã chọn
	fetchMessages: async (adminId, userId) => {
		set({ loading: true });
		try {
			const response = await axios.get(
				`/messages/${userId}?adminId=${adminId}`
			);
			set({ chats: response.data.messages, loading: false });
		} catch {
			set({ loading: false });
			toast.error('Không thể tải tin nhắn');
		}
	},
	// Gọi API: lấy tất cả người dùng từng nhắn tin với admin
	fetchChatUsers: async (adminId) => {
		try {
			const response = await axios.get(
				`/messages/chat-users/list?adminId=${adminId}`
			);
			set({ users: response.data.users });
		} catch {
			toast.error('Không thể tải danh sách người dùng');
		}
	},
}));
