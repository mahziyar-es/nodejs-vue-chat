const express = require('express')
const path = require('path')
const router = express.Router()
const {responseSuccess, responseError} = require('../utils/helpers')
const baseController = require('../controllers/baseController')
const authController = require('../controllers/authController')
const userController = require('../controllers/userController')
const chatController = require('../controllers/chatController')
const messageController = require('../controllers/messageController')
const apiTokenAuth = require('../middlewares/apiTokenAuth')
//==========================================================================================================



router.post('/login', authController.login)
router.post('/signup', authController.signup)

router.use(apiTokenAuth)
router.post('/logout', authController.logout)

router.get('/start', baseController.start)
router.get('/search', baseController.search)

router.get('/chats', chatController.chats)
router.get('/chat', chatController.chat)
router.get('/group/:id', chatController.group)
router.post('/group', chatController.createGroup)
router.post('/group/update', chatController.updateGroup)


router.get('/user/:id?', userController.user)
router.post('/user',userController.userProfileUpdate)
router.post('/user/block',userController.blockUser)
router.post('/user/unblock',userController.unblockUser)
router.patch('/user/password', userController.changePassword)


router.get('/message', messageController.chatMessages)
router.post('/message/forward', messageController.forwardMessage)




module.exports = router;