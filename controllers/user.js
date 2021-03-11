const UserModel = require("../models/User")
const FileModel = require('../models/File')
const fileService = require('../services/file')

class User {
    async getMe(req, res){
        try {
            const {idUser} = req.body
            const user = await UserModel.findOne({idUser: idUser})
            if(user) {
                return res.status(200).json({
                    id: user._id,
                    diskSpace: user.diskSpace,
                    usedSpace: user.usedSpace,
                })
            }else{
                const user = new UserModel({idUser: idUser})
                await user.save()
                await fileService.createDir(new FileModel({user:user._id, name: ''}))
                return res.status(200).json({
                    id: user._id,
                    diskSpace: user.diskSpace,
                    usedSpace: user.usedSpace,
                })
            } 
        } catch (e) {
            return res.status(400).json(e)
        }
    }
}

module.exports = new User()