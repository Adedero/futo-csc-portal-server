require('dotenv').config()

const mongoose = require('mongoose')

const database = mongoose.connect(process.env.MONGODB_URI_PRODUCTION)
.then(() => console.log('Database connection established'))
.catch((err) => console.error(err))

module.exports = database


