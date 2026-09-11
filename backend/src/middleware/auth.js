import jwt from 'jsonwebtoken';
import { users } from '../data/store.js';
const secret = process.env.JWT_SECRET || 'demo-etender-secret';
export function signToken(user) {
    return jwt.sign({ sub: user.id, role: user.role }, secret, { expiresIn: '8h' });
}
export function authenticate(req, res, next) {
    const header = req.header('authorization');
    if (!header?.startsWith('Bearer '))
        return res.status(401).json({ message: 'Authentication required.' });
    try {
        const payload = jwt.verify(header.slice(7), secret);
        const user = users.find((item) => item.id === payload.sub);
        if (!user)
            return res.status(401).json({ message: 'Invalid session.' });
        req.user = user;
        next();
    }
    catch {
        return res.status(401).json({ message: 'Invalid or expired session.' });
    }
}
export function authorize(...roles) {
    return (req, res, next) => {
        if (!req.user)
            return res.status(401).json({ message: 'Authentication required.' });
        if (!roles.includes(req.user.role))
            return res.status(403).json({ message: 'You are not authorised for this action.' });
        next();
    };
}
