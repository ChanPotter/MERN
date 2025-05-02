import User from '../models/user.model.js';
import Message from '../models/message.model.js';

let io; // Khai báo biến io để sử dụng trong hàm sendMessage
export const setSocketIO = (_io) => {
	io = _io; // Gán biến io với socket.io instance
};

// Lấy tin nhắn giữa admin và 1 người dùng
export const getMessages = async (req, res) => {
	const { userId } = req.params;
	const adminId = req.query.adminId;

	try {
		const messages = await Message.find({
			$or: [
				{ senderId: userId, receiverId: adminId },
				{ senderId: adminId, receiverId: userId },
			],
		}).sort('createdAt');

		res.json({ messages });
	} catch (err) {
		res.status(500).json({ error: 'Không thể lấy tin nhắn' });
	}
};

// Lấy danh sách người đã từng nhắn tin với admin
export const getChatUsers = async (req, res) => {
	const adminId = req.query.adminId;
	try {
		// Lấy tất cả các tin nhắn có liên quan đến admin
		const messages = await Message.find({
			$or: [{ senderId: adminId }, { receiverId: adminId }],
		});

		// Thu thập tất cả userId có liên quan (gồm sender lẫn receiver)
		const userIdSet = new Set();

		messages.forEach((msg) => {
			if (msg.senderId.toString() !== adminId) {
				userIdSet.add(msg.senderId.toString());
			}
			if (msg.receiverId.toString() !== adminId) {
				userIdSet.add(msg.receiverId.toString());
			}
		});

		// Chuyển thành mảng
		const filteredUserIds = Array.from(userIdSet);

		// Tìm user tương ứng
		const users = await User.find({ _id: { $in: filteredUserIds } });

		res.json({ users });
	} catch (err) {
		console.error(err);
		res.status(500).json({ error: 'Không thể lấy danh sách người dùng' });
	}
};
