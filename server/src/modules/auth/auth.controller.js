import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { User } from './user.model.js';
import { Organization } from './organization.model.js';
import { JWT_SECRET } from '../../middleware/auth.middleware.js';

export const DEMO_CREDENTIALS = {
  email: 'demo@canopi.test',
  password: 'Demo@1234',
  organizationName: 'Demo NGO',
  organizationType: 'NGO',
  name: 'Demo Lead Innovator',
};

/**
 * Generates a signed JWT for the authenticated user and organization.
 */
const generateToken = (user, organizationId) => {
  return jwt.sign(
    {
      userId: user._id.toString(),
      organizationId: organizationId.toString(),
      email: user.email,
      name: user.name,
    },
    JWT_SECRET,
    { expiresIn: '7d' }
  );
};

/**
 * Signup: Creates a new Organization and the first User in one atomic-like flow.
 * POST /api/auth/signup
 */
export const signup = async (req, res, next) => {
  try {
    const { organizationName, organizationType, name, email, password } = req.body;

    if (!organizationName || !name || !email || !password) {
      return res.status(400).json({ error: 'All fields (organizationName, name, email, password) are required.' });
    }

    if (password.length < 6) {
      return res.status(400).json({ error: 'Password must be at least 6 characters long.' });
    }

    const normalizedEmail = email.toLowerCase().trim();

    const existingUser = await User.findOne({ email: normalizedEmail });
    if (existingUser) {
      return res.status(400).json({ error: 'A user with this email already exists. Please log in instead.' });
    }

    // 1. Create Organization
    const organization = await Organization.create({
      name: organizationName.trim(),
      type: organizationType || 'NGO',
    });

    // 2. Hash Password
    const passwordHash = await bcrypt.hash(password, 10);

    // 3. Create First User
    const user = await User.create({
      name: name.trim(),
      email: normalizedEmail,
      passwordHash,
      organizationId: organization._id,
    });

    // 4. Generate Token
    const token = generateToken(user, organization._id);

    res.status(201).json({
      token,
      user: user.toSafeObject(),
      organization,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Login: Verifies user credentials and returns JWT + user & org info.
 * POST /api/auth/login
 */
export const login = async (req, res, next) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ error: 'Email and password are required.' });
    }

    const normalizedEmail = email.toLowerCase().trim();

    const user = await User.findOne({ email: normalizedEmail });
    if (!user) {
      return res.status(401).json({ error: 'Invalid email or password.' });
    }

    const isMatch = await bcrypt.compare(password, user.passwordHash);
    if (!isMatch) {
      return res.status(401).json({ error: 'Invalid email or password.' });
    }

    const organization = await Organization.findById(user.organizationId);

    const token = generateToken(user, user.organizationId);

    res.json({
      token,
      user: user.toSafeObject(),
      organization: organization || { _id: user.organizationId, name: 'Default Organization', type: 'NGO' },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Me: Returns profile of current authenticated user.
 * GET /api/auth/me
 */
export const getMe = async (req, res, next) => {
  try {
    const user = await User.findById(req.user.userId);
    if (!user) {
      return res.status(404).json({ error: 'User profile not found.' });
    }

    const organization = await Organization.findById(user.organizationId);

    res.json({
      user: user.toSafeObject(),
      organization,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Invite Teammate: Creates a new user within the caller's organization.
 * POST /api/auth/invite-teammate
 */
export const inviteTeammate = async (req, res, next) => {
  try {
    const { name, email, password } = req.body;

    if (!name || !email) {
      return res.status(400).json({ error: 'Name and email are required to invite a teammate.' });
    }

    const normalizedEmail = email.toLowerCase().trim();

    const existingUser = await User.findOne({ email: normalizedEmail });
    if (existingUser) {
      return res.status(400).json({ error: 'A user with this email already exists.' });
    }

    const initialPassword = password && password.length >= 6 ? password : 'TempPass@' + Math.random().toString(36).substring(2, 8);
    const passwordHash = await bcrypt.hash(initialPassword, 10);

    const newUser = await User.create({
      name: name.trim(),
      email: normalizedEmail,
      passwordHash,
      organizationId: req.user.organizationId,
    });

    res.status(201).json({
      message: 'Teammate added successfully to organization.',
      user: newUser.toSafeObject(),
      temporaryPassword: initialPassword,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Demo Credentials Endpoint: Exposes the test account for one-click reviewer login.
 * GET /api/auth/demo-credentials
 */
export const getDemoCredentials = (req, res) => {
  res.json({
    email: DEMO_CREDENTIALS.email,
    password: DEMO_CREDENTIALS.password,
    organizationName: DEMO_CREDENTIALS.organizationName,
    organizationType: DEMO_CREDENTIALS.organizationType,
  });
};

/**
 * Logout: Stateless JWT client clear acknowledgment.
 * POST /api/auth/logout
 */
export const logout = (req, res) => {
  res.json({ message: 'Logged out successfully.' });
};
