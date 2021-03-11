const axios = require('axios').default;
module.exports = async(req, res, next) => {
    try {
        const accessToken = req.headers.accesstoken
        if (!accessToken) {
            return res.status(401).json({message: 'Auth error'})
        }
        const {data} = await axios.post(`${process.env.AUTH_HOST}/verify`,{"accessToken":accessToken})
        const {verify} = data
        if(verify){
            next()
        }else{
            return res.status(401).json({message: 'Auth error'})
        }       
    } catch (e) {
        return res.status(401).json({message: 'Auth error'})
    }
}
