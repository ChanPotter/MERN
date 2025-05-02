import express from 'express';
import dotenv from 'dotenv';
import cookieParser from 'cookie-parser';
import path from 'path';
import http from 'http';
import { Server } from 'socket.io';
import cors from 'cors';

import authRoutes from './routes/auth.route.js';
import productRoutes from './routes/product.route.js';
import cartRoutes from './routes/cart.route.js';
import couponRoutes from './routes/coupon.route.js';
import paymentRoutes from './routes/payment.route.js';
import analyticsRoutes from './routes/analytics.route.js';
import messageRoutes from './routes/message.route.js'

import Message from './models/message.model.js'; // Import model Message

import { connectDB } from './lib/db.js';

dotenv.config();

const app = express();
const server = http.createServer(app); // <--- dùng http server để kết nối socket
const io = new Server(server, {
	cors: {
		origin: '*',
		methods: ['GET', 'POST'],
	},
});

const PORT = process.env.PORT || 5000;

const __dirname = path.resolve();

app.use(express.json({ limit: '10mb' }));
app.use(cors());
app.use(cookieParser());

app.use('/api/auth', authRoutes);
app.use('/api/products', productRoutes);
app.use('/api/cart', cartRoutes);
app.use('/api/coupons', couponRoutes);
app.use('/api/payments', paymentRoutes);
app.use('/api/analytics', analyticsRoutes);
app.use('/api/messages', messageRoutes); // Đường dẫn cho message


// ------------------ SOCKET HANDLER ------------------
io.on('connection', (socket) => {
	console.log('🟢 User connected: ' + socket.id);

	// Gửi tin nhắn
	socket.on('sendMessage', async ({ senderId, receiverId, message }) => {
		// console.log(`💬 From ${senderId} to ${receiverId}: ${message}`);

		// TODO: Lưu message vào MongoDB nếu muốn
		const savedMessage = await Message.create({
			senderId,
			receiverId,
			message,
		});
		// Gửi lại cho người nhận
		io.emit('receiveMessage', savedMessage); // Broadcast đến mọi client (có thể sửa thành chỉ người nhận)
	});

	socket.on('disconnect', () => {
		console.log('🔴 User disconnected: ' + socket.id);
	});
});

// ------------------ SERVE CLIENT (Production) ------------------
if (process.env.NODE_ENV === 'production') {
	app.use(express.static(path.join(__dirname, '/frontend/dist')));
	app.get('*', (req, res) => {
		res.sendFile(path.resolve(__dirname, 'frontend', 'dist', 'index.html'));
	});
}

server.listen(PORT, () => {
	console.log('🚀 Server is running on http://localhost:' + PORT);
	connectDB();
});
