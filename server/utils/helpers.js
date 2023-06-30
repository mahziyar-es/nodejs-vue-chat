const logger = require('./logger')
const { format } = require('date-fns')
const jwt = require('jsonwebtoken')
const path = require('path')
const fs = require('fs')
const fsp = require('fs').promises
const ErrorMessageException = require('../exceptions/ErrorMessageException')
require('./dotenv')
var imageMagic = require('imagemagick');



const responseSuccess = (res, message = '', data = {}) => {
    data.message = message
    res.json(data).end()
}

const responseError = (res, message = '', statusCode = 403) => {
    res.status(statusCode).json({ "message": message }).end()
}



const generateJWT = (userId) => {
    return jwt.sign(
        { 'id': userId },
        process.env.JWT_SECRET,
    )
}


const verifyJWT = (jwt, key = '') => {
    jwt.verify(jwt, process.env.JWT_SECRET, (err, decoded) => {
        if (err) return false

        if (key) return decoded[key]

        return true;
    })
}




const requestLogger = (req, res, next) => {

    const time = format(new Date(), 'hh:mm:ss')

    const logText = `${time} | ${req.method} | ${req.path} | ip: ${req.ip}\n
    query:\t${JSON.stringify(req.query)} \n
    params:\t${JSON.stringify(req.params)} \n  
    body:\t${JSON.stringify(req.body)} \n  
    `

    const date = format(new Date(), 'yyyy-MM-dd')

    logger(logText, `requests/${date}.txt`)

    next()
}



const errorLogger = (error) => {
    const date = format(new Date(), 'yyyy-MM-dd')
    const time = format(new Date(), 'hh:mm:ss')

    logger(`\n${time}\n\t${error}`, `errors/${date}.txt`)
}


const getCookieValue = async (cookies, key) => {
    const cookiesArray = cookies.split(';')

    let value

    for(let c = 0; c < cookiesArray.length; c++){
      const cookieParts = (cookiesArray[c].split('='))

      const cookieName = cookieParts[0].trim()
      const cookieValue = cookieParts[1].trim()

        if (cookieName == key) {
            value = cookieValue
            break
        }
    }

    return value
}


const randomStringGenerator = (length = 10, specialCharacters = false) => {
    let chars = "qwertyuiopasdfghjklzxcvbnm1234567890"
    let specialChars = "!@#$%^&*()"
    
    if (specialCharacters) chars += specialChars
    
    const charsCount = chars.length

    let finalString = ''

    for (let i = 0; i < length; i++){
        const index = Math.floor(Math.random() * charsCount)
        finalString += chars[index]
    }

    return finalString
}


const currentDate = () => {
    return format(new Date(), 'yyyy-MM-dd')
}


const currentTime = () => {
    return format(new Date(), 'hh:mm:ss')
}


const currentTimestamp = () => {
    return Date.now()
}


const publicDir = (folder = '') => {
    return path.join(__dirname, '..', 'public') + '/' + folder + (folder? '/': '')
}


const uploadFile = async (file, folder = '') => {

    const destPath = publicDir(folder)

    try {

        if (file instanceof Buffer) {
            const extension = 'png'
            const filename = randomStringGenerator(15) + currentTimestamp() + '.' + extension
            await fsp.writeFile(destPath + filename, file)
            return filename
        }
        else {
            const extension = file.name.split('.').reverse()[0]
            const filename = file.md5 + currentTimestamp() + '.' + extension
            await file.mv(destPath + filename)
            return filename
        }

    
    } catch (error) {
        throw new ErrorMessageException('Upload failed')
    }
    
}


const deleteFile = async (folder, files) => {

    if(!Array.isArray(files)) files = [files]

    const path = publicDir(folder)

    for (let i = 0; i < files.length; i++){
        let file = files[i]
        
        const filename = file.split('/').reverse()[0]
        const undeleteAbleFiles = ['ph', 'default', 'place-holder', 'placeholder']
        const filenameNoExtensionParts = filename.split('.').reverse()
        filenameNoExtensionParts.splice(0, 1)
        const filenameNoExtension = filenameNoExtensionParts.join('')

        if(undeleteAbleFiles.indexOf(filenameNoExtension) != -1) continue

        const fullAddress = path + filename

        try {
            if(fs.existsSync(fullAddress))await fsp.unlink(fullAddress)
        } catch (error) {
            throw new ErrorMessageException(error)
        }
    }

        
}


const copyFile = async (file, srcFolder, destFolder) => {
    try {
        
        const srcPath = publicDir(srcFolder)
        const destPath = publicDir(destFolder)

        const filename = path.basename(file)
        const fileExtension = filename.split('.').reverse()[0]

        const newFileName = randomStringGenerator(15) + currentTimestamp() + '.' + fileExtension

        await fsp.copyFile(srcPath + filename, destPath + newFileName)
        
        return newFileName
    }
    catch (err) {
        throw new ErrorMessageException('Something went wrong trying to copy the file. '+err)
    }
        
}


module.exports = {
    responseSuccess,
    responseError,
    requestLogger,
    errorLogger,
    generateJWT,
    verifyJWT,
    getCookieValue,
    currentDate,
    currentTime,
    currentTimestamp,
    uploadFile,
    deleteFile,
    copyFile,
}