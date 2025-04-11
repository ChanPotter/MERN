import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';

const userSchema = new mongoose.Schema(
	{
		name: {
			type: String,
			required: [true, 'Name is required'],
		},
		email: {
			type: String,
			required: [true, 'Email is required'],
			unique: true,
			lowercase: true,
			trim: true,
		},
		password: {
			type: String,
			required: [true, 'Password is required'],
			minlength: [6, 'Password must be at least 6 characters long'],
		},
		cartItems: [
			{
				quantity: {
					type: Number,
					default: 1,
				},
				product: {
					type: mongoose.Schema.Types.ObjectId,// reference to the Product model
					ref: 'Product',
				},
			},
		],
		role: {
			type: String,
			enum: ['customer', 'admin'],
			default: 'customer',
		},
	},
	{
		timestamps: true, // automatically create createdAt and updatedAt fields
	}
);

// Pre-save hook to hash password before saving to database
// this will hash the password before saving it to the database
userSchema.pre('save', async function (next) {
	if (!this.isModified('password')) return next(); // skip if password is not modified

	try {
		const salt = await bcrypt.genSalt(10);
		this.password = await bcrypt.hash(this.password, salt);
		next();
	} catch (error) {
		next(error);
	}
});
// Method to compare password
userSchema.methods.comparePassword = async function (password) {
	/*
	 * this.password is the hashed password stored in the database
	 * password is the plain text password entered by the user
	 */
	return bcrypt.compare(password, this.password);
};

const User = mongoose.model('User', userSchema);

export default User;
