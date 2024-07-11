require('dotenv').config()

const mongoose = require('mongoose')

const database = process.env.NODE_ENV === 'production' ? 
  mongoose.connect(process.env.MONGODB_URI_PRODUCTION)
    .then(() => console.log('Database connection established'))
    .catch((err) => console.error(err)) :
  mongoose.connect(process.env.MONGODB_URI)
    .then(() => console.log('Database connection established'))
    .catch((err) => console.error(err))

module.exports = database


