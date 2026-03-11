// backend/controllers/userController.js
const User = require('../models/User');
const { AppError } = require('../middleware/errorHandler');

exports.getProfile = async (req, res, next) => {
  try {
    const user = await User.findById(req.user.id);
    if (!user) throw new AppError('User not found.', 404);
    res.json({ success: true, user });
  } catch (err) { next(err); }
};

exports.updateProfile = async (req, res, next) => {
  try {
    const { first_name, last_name, phone, dob } = req.body;
    if (!first_name) throw new AppError('first_name is required.', 400);

    await User.updateProfile(req.user.id, { first_name, last_name, phone, dob });
    const user = await User.findById(req.user.id);
    res.json({ success: true, message: 'Profile updated.', user });
  } catch (err) { next(err); }
};

exports.updateAddress = async (req, res, next) => {
  try {
    const { street, city, zip, country } = req.body;
    await User.upsertAddress(req.user.id, { street, city, zip, country });
    const user = await User.findById(req.user.id);
    res.json({ success: true, message: 'Address saved.', user });
  } catch (err) { next(err); }
};

exports.changePassword = async (req, res, next) => {
  try {
    const { current_password, new_password, confirm_password } = req.body;

    if (!current_password || !new_password || !confirm_password) throw new AppError('All password fields are required.', 400);
    if (new_password !== confirm_password) throw new AppError('New passwords do not match.', 400);
    if (new_password.length < 6) throw new AppError('New password must be at least 6 characters.', 400);

    const userRow = await User.findByEmail(req.user.email);
    const match   = await User.verifyPassword(current_password, userRow.password);
    if (!match) throw new AppError('Current password is incorrect.', 401);

    await User.updatePassword(req.user.id, new_password);
    res.json({ success: true, message: 'Password updated successfully.' });
  } catch (err) { next(err); }
};