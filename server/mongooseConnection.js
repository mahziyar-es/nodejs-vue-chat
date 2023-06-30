require('./utils/dotenv')
const mongoose = require('mongoose')


class MongooseConnection {

    connect = async (connectionCallback = null) => {
        try {

            console.log('Connecting to database...')
    
            await mongoose.connect(process.env.DATABASE_URI, {
                useUnifiedTopology:true,
                useNewUrlParser: true,
            });
    
            console.log('Database connected')
    
            connectionCallback?.()
    
        } catch (err) {
            console.log('Database disconnected :', err)
        }
    }


    disconnect = async () => {
        mongoose.connection.close()
    }

}


module.exports = MongooseConnection