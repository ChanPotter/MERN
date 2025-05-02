import express from 'express';
import {
	getMessages,
	getChatUsers,
} from '../controllers/message.controller.js';

const router = express.Router();

// Lấy tin nhắn giữa admin và 1 người dùng
router.get('/:userId', getMessages);

// Lấy danh sách người đã từng nhắn tin với admin
router.get('/chat-users/list', getChatUsers);

export default router;
