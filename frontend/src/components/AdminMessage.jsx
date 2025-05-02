import { useEffect, useRef, useState } from 'react';
import { useChatStore } from '../stores/useChatStore';
import { useUserStore } from '../stores/useUserStore';
import { io } from 'socket.io-client';

const socket = io('http://localhost:5000');

const AdminMessage = () => {
	const { user } = useUserStore();
	const { users, chats, fetchMessages, fetchChatUsers } = useChatStore();
	const [chatUsers, setChatUsers] = useState([]);

	const [selectedUser, setSelectedUser] = useState(null);
	const [message, setMessage] = useState('');
	const bottomRef = useRef(null);
	const [visibleCount, setVisibleCount] = useState(10); // ban đầu hiện 20 tin
	const messagesRef = useRef(null);

	const handleScroll = () => {
		const container = messagesRef.current;
		if (container.scrollTop === 0) {
			// Người dùng kéo lên trên cùng, tăng thêm số tin hiển thị
			setVisibleCount((prev) => prev + 10);
		}
	};

	useEffect(() => {
		if (user && selectedUser) {
			fetchMessages(user._id, selectedUser._id);
		}
	}, [selectedUser]);

	useEffect(() => {
		socket.on('receiveMessage', (msg) => {
			if (
				(msg.senderId === selectedUser?._id && msg.receiverId === user?._id) ||
				(msg.senderId === user?._id && msg.receiverId === selectedUser?._id)
			) {
				fetchMessages(user._id, selectedUser._id);
			}
		});
		return () => socket.off('receiveMessage');
	}, [selectedUser]);

	useEffect(() => {
		if (bottomRef.current) {
			bottomRef.current.scrollIntoView({ behavior: 'smooth' });
		}
	}, [chats]);

	const sendMessage = () => {
		if (!message.trim() || !selectedUser) return;
		const newMsg = {
			senderId: user._id,
			receiverId: selectedUser._id,
			message,
		};
		socket.emit('sendMessage', newMsg);
		setMessage('');
	};

	useEffect(() => {
		if (user) {
			fetchChatUsers(user._id).then((res) => setChatUsers(res));
		}
	}, []);

	return (
		<div className="admin-message max-w-screen-lg flex justify-center mx-auto">
			{/* Sidebar người dùng */}
			<div className="w-1/3 bg-gray-100 p-4 overflow-y-auto rounded-l-xl shadow-lg text-gray-900">
				<h2 className="font-bold text-lg mb-4">Người dùng</h2>
				<ul>
					{users.map((u) => (
						<li
							key={u._id}
							onClick={() => setSelectedUser(u)}
							className={`p-2 rounded cursor-pointer ${
								selectedUser?._id === u._id
									? 'bg-violet-300'
									: 'hover:bg-gray-200'
							}`}
						>
							{u.name || u.email}
						</li>
					))}
				</ul>
			</div>

			{/* Nội dung tin nhắn */}
			<div className="w-2/3 flex flex-col">
				<div className="p-4 bg-violet-500 text-white font-semibold">
					{selectedUser
						? `Đoạn chat với ${selectedUser.name || selectedUser.email}`
						: 'Chọn người dùng để bắt đầu chat'}
				</div>

				{/* Hiển thị tin nhắn */}
				<div
					ref={messagesRef}
					onScroll={handleScroll}
					className="flex-1 p-4 overflow-y-auto bg-gray-50 text-gray-900"
				>
					{selectedUser &&
						chats.slice(-visibleCount).map((msg, index) => {
							const isSender = msg.senderId === user._id;
							return (
								<div
									key={index}
									className={`mb-2 ${isSender ? 'text-right' : 'text-left'}`}
								>
									<div
										className={`p-2 rounded-xl shadow w-fit max-w-[70%] ${
											isSender ? 'bg-emerald-200 ml-auto' : 'bg-white'
										}`}
									>
										{msg.message}
									</div>
								</div>
							);
						})}
					<div ref={bottomRef} />
				</div>

				{selectedUser && (
					<div className="p-2 bg-white border-t flex">
						<input
							type="text"
							placeholder="Nhập tin nhắn..."
							className="flex-1 px-2 py-1 border rounded text-gray-900 text-sm"
							value={message}
							onChange={(e) => setMessage(e.target.value)}
						/>
						<button
							className="ml-2 bg-emerald-500 text-white px-3 py-1 rounded"
							onClick={sendMessage}
						>
							Gửi
						</button>
					</div>
				)}
			</div>
		</div>
	);
};

export default AdminMessage;
