import { redis } from '../lib/redis.js';
import User from '../models/user.model.js';
import jwt from 'jsonwebtoken';

// this function will generate access and refresh tokens
// access token will be used to authenticate the user
// refresh token will be used to refresh the access token
const generateTokens = (userId) => {
	const accessToken = jwt.sign({ userId }, process.env.ACCESS_TOKEN_SECRET, {
		expiresIn: '15m',
	});

	const refreshToken = jwt.sign({ userId }, process.env.REFRESH_TOKEN_SECRET, {
		expiresIn: '7d',
	});

	return { accessToken, refreshToken };
};

// this function will store the refresh token in redis
const storeRefreshToken = async (userId, refreshToken) => {
	await redis.set(
		`refresh_token:${userId}`,
		refreshToken,
		'EX',
		7 * 24 * 60 * 60
	); // 7days
};

// this function will set the cookies in the response
const setCookies = (res, accessToken, refreshToken) => {
	res.cookie('accessToken', accessToken, {
		httpOnly: true, // prevent XSS attacks, cross site scripting attack
		secure: process.env.NODE_ENV === 'production',
		sameSite: 'strict', // prevents CSRF attack, cross-site request forgery attack
		maxAge: 15 * 60 * 1000, // 15 minutes
	});
	res.cookie('refreshToken', refreshToken, {
		httpOnly: true, // prevent XSS attacks, cross site scripting attack
		secure: process.env.NODE_ENV === 'production',
		sameSite: 'strict', // prevents CSRF attack, cross-site request forgery attack
		maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
	});
};

export const signup = async (req, res) => {
	const { email, password, name } = req.body;
	try {
		const userExists = await User.findOne({ email });

		if (userExists) {
			return res.status(400).json({ message: 'User already exists' });
		}
		const user = await User.create({ name, email, password });

		// authenticate
		const { accessToken, refreshToken } = generateTokens(user._id);// generate access and refresh tokens
		await storeRefreshToken(user._id, refreshToken); // store refresh token in redis

		// set cookies in response
		setCookies(res, accessToken, refreshToken);

		// send response
		res.status(201).json({
			_id: user._id,
			name: user.name,
			email: user.email,
			role: user.role,
		});
	} catch (error) {
		console.log('Error in signup controller', error.message);
		res.status(500).json({ message: error.message });
	}
};

export const login = async (req, res) => {
	try {
		const { email, password } = req.body;
		const user = await User.findOne({ email });

		// check if user exists
		if (user && (await user.comparePassword(password))) {
			// generate access and refresh tokens
			const { accessToken, refreshToken } = generateTokens(user._id);
			await storeRefreshToken(user._id, refreshToken);
			setCookies(res, accessToken, refreshToken);

			res.json({
				_id: user._id,
				name: user.name,
				email: user.email,
				role: user.role,
			});
		} else {
			res.status(400).json({ message: 'Invalid email or password' });
		}
	} catch (error) {
		console.log('Error in login controller', error.message);
		res.status(500).json({ message: error.message });
	}
};

export const logout = async (req, res) => {
	try {
		const refreshToken = req.cookies.refreshToken; // get refresh token from cookies
		// check if refresh token exists
		if (refreshToken) {
			// verify refresh token
			// if refresh token is valid, delete it from redis
			// if refresh token is invalid, it will throw an error
			// if refresh token is expired, it will throw an error
			// decoded use to get userId from refresh token
			const decoded = jwt.verify(
				refreshToken,
				process.env.REFRESH_TOKEN_SECRET
			);
			await redis.del(`refresh_token:${decoded.userId}`); // delete refresh token from redis
		}

		res.clearCookie('accessToken'); // delete access token from cookies
		res.clearCookie('refreshToken'); // delete refresh token from cookies
		res.json({ message: 'Logged out successfully' });
	} catch (error) {
		console.log('Error in logout controller', error.message);
		res.status(500).json({ message: 'Server error', error: error.message });
	}
};

// this will refresh the access token
export const refreshToken = async (req, res) => {
	try {
		const refreshToken = req.cookies.refreshToken;// get refresh token from cookies

		// check if refresh token exists
		if (!refreshToken) {
			return res.status(401).json({ message: 'No refresh token provided' });
		}

		// verify refresh token
		const decoded = jwt.verify(refreshToken, process.env.REFRESH_TOKEN_SECRET);
		// check if refresh token is valid
		const storedToken = await redis.get(`refresh_token:${decoded.userId}`);

		// check if refresh token is valid
		if (storedToken !== refreshToken) {
			return res.status(401).json({ message: 'Invalid refresh token' });
		}

		// generate new access token
		// sign is used to create a new token
		const accessToken = jwt.sign(
			{ userId: decoded.userId },
			process.env.ACCESS_TOKEN_SECRET,
			{ expiresIn: '15m' }
		);

		res.cookie('accessToken', accessToken, {
			httpOnly: true,
			secure: process.env.NODE_ENV === 'production',
			sameSite: 'strict',
			maxAge: 15 * 60 * 1000,
		});

		res.json({ message: 'Token refreshed successfully' });
	} catch (error) {
		console.log('Error in refreshToken controller', error.message);
		res.status(500).json({ message: 'Server error', error: error.message });
	}
};

// this will get the user profile
export const getProfile = async (req, res) => {
	try {
		res.json(req.user);
	} catch (error) {
		res.status(500).json({ message: 'Server error', error: error.message });
	}
};
