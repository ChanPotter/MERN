import jwt from 'jsonwebtoken';
import User from '../models/user.model.js';

/*
 * Middleware to protect routes by verifying JWT access tokens.
 * This middleware checks if the request has a valid access token in the cookies.
 * If the token is valid, it retrieves the user from the database and attaches it to the request object.
 * If the token is expired or invalid, it returns a 401 Unauthorized response.
 */
export const protectRoute = async (req, res, next) => {
	try {
		const accessToken = req.cookies.accessToken;

		if (!accessToken) {
			return res
				.status(401)
				.json({ message: 'Unauthorized - No access token provided' });
		}

		try {
			const decoded = jwt.verify(accessToken, process.env.ACCESS_TOKEN_SECRET);
			const user = await User.findById(decoded.userId).select('-password');

			if (!user) {
				return res.status(401).json({ message: 'User not found' });
			}

			req.user = user; // attach user to request object

			next();
		} catch (error) {
			// TokenExpiredError is thrown when the token is expired
			if (error.name === 'TokenExpiredError') {
				return res
					.status(401)
					.json({ message: 'Unauthorized - Access token expired' });
			}
			throw error;
		}
	} catch (error) {
		console.log('Error in protectRoute middleware', error.message);
		return res
			.status(401)
			.json({ message: 'Unauthorized - Invalid access token' });
	}
};

/*
 * Middleware to protect admin routes.
 * This middleware checks if the user has an admin role.
 * If the user is an admin, it allows the request to proceed.
 * If not, it returns a 403 Forbidden response.
 */
export const adminRoute = (req, res, next) => {
	// Middleware to protect admin routes
	if (req.user && req.user.role === 'admin') {
		next();
	} else {
		return res.status(403).json({ message: 'Access denied - Admin only' });
	}
};
