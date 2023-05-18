const path = require('path')
const fs = require('fs')
const fsp = require('fs').promises
const {v4:uuid} = require('uuid')
const { format } = require('date-fns')


const log = async (text, filePath) => {

    const PATH_LOGS_FOLDER = path.join(__dirname, '..', 'logs')

    if (!fs.existsSync(PATH_LOGS_FOLDER))
        await fsp.mkdir(PATH_LOGS_FOLDER)

    
    const filePathParts = filePath.split('/')
    const logFileName = filePathParts[filePathParts.length - 1]
    filePathParts.splice(filePathParts.length - 1, 1)


    if (filePathParts.length > 0) {
        const foldersPath = path.join(__dirname, '..', 'logs', filePathParts.join('/'))

        if (!fs.existsSync(foldersPath))
            fsp.mkdir(foldersPath)
    }

    const PATH_LOG_FILE = path.join(__dirname, '..', 'logs', filePath)
    
    await fsp.appendFile(PATH_LOG_FILE, `\n${text}`)
    
    return true
}


module.exports = log
