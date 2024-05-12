require('dotenv').config()
//process.env.NODE_ENV = 'production'
const express = require('express')
const cors = require('cors')
const cookieParser = require('cookie-parser')
const database = require('./database/database')
const passport = require('./config/passport.config')
const PORT = process.env.PORT || 6060


const app = express()

app.use(cors({
    origin: process.env.CLIENT_URL,
    credentials: true
}))

app.use(cookieParser())

app.use(require('express-session')({
    secret: process.env.SECRET_KEY,
    resave: false,
    saveUninitialized: false,
    cookie : { maxAge: 60*60*1000 },

}))

app.use(passport.initialize())
app.use(passport.session())


app.use(express.urlencoded({ extended: true }))
app.use(express.json())


app.use('/auth', require('./routes/auth.routes'))
app.use('/admin', require('./routes/admin.routes'))
app.use('/hod', require('./routes/hod.routes'))
app.use('/dean', require('./routes/dean.routes'))
app.use('/advisor', require('./routes/advisor.routes'))
app.use('/student', require('./routes/student.routes'))
app.use('/staff', require('./routes/staff.routes'))

app.get('/', (req, res) => res.send({
    name: "FUTO CSC Portal",
    version: "1.0.0",
    description: "A departmental website for uploading and checking of results."
}))

app.listen(PORT, () => console.log(`http://localhost:${PORT}`))