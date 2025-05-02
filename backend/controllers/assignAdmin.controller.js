import Assignment from '../models/assignment.model.js';
import User from '../models/user.model.js';

export const assignAdmin = async (customerId) => {
	// console.log('assignAdmin() được gọi với customerId:', customerId);
	let assignment = await Assignment.findOne({ customerId });

	// console.log('assignment:', assignment);

	if (!assignment) {
		// chọn admin ngẫu nhiên
		const admins = await User.find({ role: 'admin' });
		// console.log('admins:', admins);
		if (admins.length === 0) throw new Error('No admin available');

		const randomAdmin = admins[Math.floor(Math.random() * admins.length)];
		// console.log('randomAdmin:', randomAdmin);
		assignment = await Assignment.create({
			customerId,
			adminId: randomAdmin._id,
		});
	}

	return assignment.adminId;
};
