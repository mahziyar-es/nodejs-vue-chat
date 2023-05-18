
class AuthenticationErrorException extends Error{
    constructor() {
        super('Unauthenticated')
        this.code = 401 
    }
}


module.exports = AuthenticationErrorException