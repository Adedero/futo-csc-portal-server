const passport = require('passport')
const LocalStrategy = require('passport-local').Strategy
const bcrypt = require('bcrypt')
const User = require('../models/user.model')

passport.use(new LocalStrategy(
    async (username, password, done) => {
        try {
            const user = await User.findOne({ username: username });
            if (!user) return done(null, false, { message: 'Username not found.' });
            const isPasswordValid = await bcrypt.compare(password, user.password);
            if (!isPasswordValid) return done(null, false, { message: 'Wrong password.' });
            return done(null, user);
        } catch (error) {
            return done(error);
        }
    }
));


passport.serializeUser((user, done) => {
    done(null, user.username);
});

passport.deserializeUser((username, done) => {

    User.findOne({ username: username })
    .then((user) => done(null, user))
    .catch((error) => done(error))
});

module.exports = passport;
