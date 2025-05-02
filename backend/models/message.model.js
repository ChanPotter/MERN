import mongoose from 'mongoose';

const messageSchema = new mongoose.Schema(
	{
		senderId: {
			type: mongoose.Schema.Types.ObjectId, // reference to the User model
			ref: 'User',
			required: true,
		},
		receiverId: {
			type: mongoose.Schema.Types.ObjectId, // reference to the User model
			ref: 'User',
			required: true,
		},
		message: {
			type: String,
			required: true,
		},
	},
	{ timestamps: true } // automatically add createdAt and updatedAt fields
);

const Message = mongoose.model('Message', messageSchema);

export default Message;
