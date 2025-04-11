import Product from '../models/product.model.js';

/*
 * req va res la request and response object
 * This controller provides functions to get cart products, add products to the cart,
 * remove products from the cart, and update product quantities in the cart.
 */
export const getCartProducts = async (req, res) => {
	try {
		//{ _id: { $in: req.user.cartItems } } } is a MongoDB query that finds all products
		// products la mang cac san pham trong cart
		// req.user.cartItems la mang cac san pham trong cart
		const products = await Product.find({ _id: { $in: req.user.cartItems } });

		// add quantity for each product
		const cartItems = products.map((product) => {
			const item = req.user.cartItems.find(
				(cartItem) => cartItem.id === product.id
			);
			//
			return { ...product.toJSON(), quantity: item.quantity };
		});
		res.json(cartItems);
	} catch (error) {
		console.log('Error in getCartProducts controller', error.message);
		res.status(500).json({ message: 'Server error', error: error.message });
	}
};

export const 
addToCart = async (req, res) => {
	try {
		const { productId } = req.body;
		const user = req.user;

		// Check if the product is already in the cart
		const existingItem = user.cartItems.find((item) => item.id === productId);
		if (existingItem) {
			existingItem.quantity += 1;
		} else {
			user.cartItems.push(productId);
		}

		await user.save();
		res.json(user.cartItems);
	} catch (error) {
		console.log('Error in addToCart controller', error.message);
		res.status(500).json({ message: 'Server error', error: error.message });
	}
};

export const removeAllFromCart = async (req, res) => {
	try {
		const { productId } = req.body;
		const user = req.user;
		if (!productId) {
			user.cartItems = [];
		} else {
			// Remove the product from the cart
			// filter used to create a new array with all elements that pass the test implemented by the provided function
			// item.id is the id of the product in the cart
			// productId is the id of the product to be removed
			/*
			 ** hàm filter() được sử dụng để lọc ra các phần tử (sản phẩm) trong mảng user.cartItems
			 ** mà có id khác với productId, từ đó tạo ra một mảng mới không chứa sản phẩm cần xóa.
			 */
			user.cartItems = user.cartItems.filter((item) => item.id !== productId);
		}
		await user.save();
		res.json(user.cartItems);
	} catch (error) {
		res.status(500).json({ message: 'Server error', error: error.message });
	}
};

export const updateQuantity = async (req, res) => {
	try {
		const { id: productId } = req.params;
		const { quantity } = req.body;
		const user = req.user;
		const existingItem = user.cartItems.find((item) => item.id === productId);

		if (existingItem) {
			// If quantity is 0, remove the product from the cart
			if (quantity === 0) {
				user.cartItems = user.cartItems.filter((item) => item.id !== productId);
				await user.save();
				return res.json(user.cartItems);
			}

			existingItem.quantity = quantity;
			await user.save();
			res.json(user.cartItems);
		} else {
			res.status(404).json({ message: 'Product not found' });
		}
	} catch (error) {
		console.log('Error in updateQuantity controller', error.message);
		res.status(500).json({ message: 'Server error', error: error.message });
	}
};
