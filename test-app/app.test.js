const jwt = require('jsonwebtoken');
const { checkToken, SECRET_KEY } = require('./app');

describe('checkToken Middleware', () => {
    let req;
    let res;
    let next;

    beforeEach(() => {
        req = {
            headers: {}
        };
        res = {
            status: jest.fn().mockReturnThis(),
            send: jest.fn()
        };
        next = jest.fn();
    });

    it('should return 403 if no authorization header is provided', () => {
        checkToken(req, res, next);
        expect(res.status).toHaveBeenCalledWith(403);
        expect(res.send).toHaveBeenCalledWith('Access Denied: No Token Provided');
        expect(next).not.toHaveBeenCalled();
    });

    it('should return 403 if authorization header is provided but token is empty', () => {
        req.headers['authorization'] = 'Bearer '; // Or 'Bearer'
        checkToken(req, res, next);
        expect(res.status).toHaveBeenCalledWith(403);
        expect(res.send).toHaveBeenCalledWith('Access Denied: No Token Provided');
        expect(next).not.toHaveBeenCalled();
    });

    it('should return 403 if an invalid token is provided', () => {
        req.headers['authorization'] = 'Bearer invalid_token';
        checkToken(req, res, next);
        expect(res.status).toHaveBeenCalledWith(403);
        expect(res.send).toHaveBeenCalledWith('Access Denied: Invalid Token');
        expect(next).not.toHaveBeenCalled();
    });

    it('should call next and set req.user if a valid token is provided', () => {
        const userPayload = { id: 1, username: 'testuser' };
        const validToken = jwt.sign(userPayload, SECRET_KEY);
        req.headers['authorization'] = `Bearer ${validToken}`;

        checkToken(req, res, next);

        expect(next).toHaveBeenCalled();
        expect(req.user).toBeDefined();
        expect(req.user.id).toBe(userPayload.id);
        expect(req.user.username).toBe(userPayload.username);
        expect(res.status).not.toHaveBeenCalled();
        expect(res.send).not.toHaveBeenCalled();
    });
});
