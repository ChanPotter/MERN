import { io } from 'socket.io-client';
import { useEffect, useState, useRef } from 'react';
import { useUserStore } from '../stores/useUserStore';
import { useChatStore } from '../stores/useChatStore'; // Import useChatStore nếu cần thiết

const socket = io('http://localhost:5000'); // Đảm bảo đây là địa chỉ Socket.IO server
export default function Message({ closeModal }) {
	const { user, logout } = useUserStore(); // custom hook to manage user state
	const isAdmin = user?.role === 'admin';
	const { chats, fetchMessages } = useChatStore(); // custom hook to manage chat state
	const [message, setMessage] = useState('');
	const [messages, setMessages] = useState([]);

	const bottomRef = useRef(null);

	useEffect(() => {
		if (user) {
			fetchMessages(user._id, '67f77b57c98d45ebb5578aa0'); // receiverId có thể lấy động
		}
		// Lắng nghe sự kiện 'receiveMessage' từ server
		socket.on('receiveMessage', (newMessage) => {
			useChatStore.setState((state) => ({
				chats: [...state.chats, newMessage],
			}));
		});

		return () => {
			socket.off('receiveMessage');
		};
	}, []);
	useEffect(() => {
		if (bottomRef.current) {
			bottomRef.current.scrollIntoView({ behavior: 'smooth' });
		}
	}, [chats]);

	const sendMessage = () => {
		if (!message.trim() || !user) return;

		const newMsg = {
			senderId: user._id,
			receiverId: '67f77b57c98d45ebb5578aa0', // gán cứng hoặc chọn theo phòng
			message,
		};
		socket.emit('sendMessage', newMsg);
		setMessage('');
	};
	return (
		<div className="fixed bottom-20 right-4 w-80 h-96 bg-white rounded-2xl shadow-lg z-50 flex flex-col overflow-hidden">
			{/* Header */}
			<div className="bg-violet-500 p-3 text-white font-semibold flex justify-between items-center">
				<span>Messenger</span>
				<button onClick={closeModal}>✕</button>
			</div>

			{/* Nội dung chat */}
			<div className="flex-1 p-4 overflow-y-auto bg-gray-100 text-black">
				{user ? (
					<>
						{chats.map((msg, index) => {
							const isSender = msg.senderId === user._id;
							return (
								<div
									key={index}
									className={`mb-2 flex ${
										isSender ? 'justify-end' : 'justify-start'
									}`}
								>
									<div
										className={`p-2 rounded-xl shadow max-w-[70%] ${
											isSender
												? 'bg-emerald-500 text-white'
												: 'bg-white text-black'
										}`}
									>
										{msg.message}
									</div>
								</div>
							);
						})}
						<div ref={bottomRef} />
					</>
				) : (
					<div className="text-center text-gray-500 mt-10">
						Vui lòng đăng nhập để sử dụng chức năng chat.
					</div>
				)}
			</div>

			{user && (
				<div className="p-2 bg-white border-t flex">
					<input
						type="text"
						placeholder="Nhập tin nhắn..."
						className="flex-1 px-2 py-1 border rounded text-gray-800 text-sm"
						value={message}
						onChange={(e) => setMessage(e.target.value)}
					/>
					<button
						type="button"
						onClick={sendMessage} // Gọi hàm sendMessage khi nhấn gửi
						className="ml-2 bg-emerald-500 text-white px-3 py-1 rounded"
					>
						Gửi
					</button>
				</div>
			)}
		</div>
	);
}
