const cors = require('cors')
const constants = require('../utils/constants')



const corsWhiteList = [constants.CLIENT_BASE_URL]
const corsOptions = {
  origin: (origin, callback) => {
    if (!origin || corsWhiteList.indexOf(origin) !== -1 || process.env.ENV == 'local' ) {
      callback(null, true)
    } else {
      callback(new Error('Not allowed by CORS'))
    }
  },

  credentials: true, //access-control-allow-credentials:true
  optionSuccessStatus: 200,
    
}

const corsMiddleware = cors(corsOptions)


module.exports = corsMiddleware