const ensureAuth = {
    admin: (req, res, next) => {
        if (req.isAuthenticated() && req.user && req.user.role) {
        if (req.user.role === 'ADMIN') {
            return next();
            }
        }
        return res.status(405).json({ info: 'Access denied', message: 'You need to be an administrator to access this resource. Please log in.'})
    },

    hod: (req, res, next) => {
        if (req.isAuthenticated() && req.user && req.user.role) {
        if (req.user.role === 'HOD') {
            return next();
            }
        }
        return res.status(405).json({ info: 'Access denied', message: 'You need to be the HOD to access this resource. Please log in.'})
    },

    dean: (req, res, next) => {
        if (req.isAuthenticated() && req.user && req.user.role) {
        if (req.user.role === 'DEAN') {
            return next();
            }
        }
        return res.status(405).json({ info: 'Access denied', message: 'You need to be the DEAN to access this resource. Please log in.'})
    },

    advisor: (req, res, next) => {
        if (req.isAuthenticated() && req.user && req.user.role) {
        if (req.user.role === 'ADVISOR') {
            return next();
            }
        }
        return res.status(405).json({ info: 'Access denied', message: 'You need to be an advisor to access this resource. Please log in.'})
    },

    staff: (req, res, next) => {
        if (req.isAuthenticated() && req.user && req.user.role) {
        if (req.user.role === 'STAFF') {
            return next();
            }
        }
        return res.status(405).json({ info: 'Access denied', message: 'You need to be an staff to access this resource. Please log in.'})
    },

    student: (req, res, next) => {
        if (req.isAuthenticated() && req.user && req.user.role) {
        if (req.user.role === 'STUDENT') {
            return next();
            }
        }
        return res.status(405).json({ info: 'Access denied', message: 'You need to be an student to access this resource. Please log in.'})
    }
}

module.exports = ensureAuth