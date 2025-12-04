// Compatibility shim for older imports from `src/services/auth.js`
export { login, logout, getToken, getCurrentUser as currentUser, register } from '../api/auth';

import * as Auth from '../api/auth';
export default Auth;
