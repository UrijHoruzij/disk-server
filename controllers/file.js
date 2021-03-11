const fileService = require('../services/file')
const fs = require('fs')
const UserModel = require('../models/User')
const FileModel = require('../models/File')
const { v4: uuidv4 } = require('uuid');
require("dotenv").config();

class File {
    async createDir(req, res) {
        try {
            const {name, type, parent} = req.body
            const user = await UserModel.findOne({_id: req.headers.user})
            const file = new FileModel({name, type, parent, user: user._id})
            const parentFile = await FileModel.findOne({_id: parent})
            if(!parentFile) {
                file.path = name
                await fileService.createDir(file)
            } else {
                file.path = `${parentFile.path}\\${file.name}`
                await fileService.createDir(file)
                parentFile.childs.push(file._id)
                await parentFile.save()
            }
            await file.save()
            return res.json(file)
        } catch (e) {
            return res.status(400).json(e)
        }
    }
    async getFiles(req, res) {
        try {
            const {sort, parent} = req.query
            let files
            switch (sort) {
                case 'file':
                    files = await FileModel.find({user: req.headers.user, parent: parent})
                    break
                case 'photo':
                    files = await FileModel.find({
                        type: { $in: ['jpg','jpeg','png','svg','webp','bmp','gif','tiff','raw']}, 
                        user: req.headers.user, 
                        parent: parent
                    })
                    break
                case 'video':
                    files = await FileModel.find({
                        type: { $in: ['mp4','avi','h264','m4v','mkv','mpeg','mpg','webm','wmv']},
                        user: req.headers.user, 
                        parent: parent})
                    break
                case 'last':
                    files = await FileModel.find({user: req.headers.user, parent: parent}).sort({date: -1})
                    break
                default:
                    files = await FileModel.find({user: req.headers.user, parent: parent})
                    break;
            }
            return res.json(files)
        } catch (e) {
            return res.status(500).json({message: "Can not get files"})
        }
    }
    async status(req,res) {
        try {
            const user = await UserModel.findById(req.body.user)
            const parent = req.body.parent ? req.body.parent : null;
            const file = await FileModel.findOne({
                user: user._id,
                parent: parent, 
                name: req.body.name,
                type: req.body.type
            })
            if(file){
                return res.status(200).json({
                    status: file.size
                })
            }else{
                if  (user.usedSpace + Number(req.body.size) > user.diskSpace) {
                    return res.status(400).json({message: 'There no space on the disk'})
                }
                return res.status(200).json({
                    status: 0
                })
            }
        } catch (error) {
            res.status(500).json(error)
        }
    }
    async uploadFile(req, res) {
        try {
            const {
                name,
                type,
                chunk,
                size,
            } = req.body;
            const parent = await FileModel.findOne({ _id: req.body.parent})
            const user = await UserModel.findOne({_id: req.body.user})
            const file = await FileModel.findOne({
                user: user._id, 
                parent: req.body.parent, 
                name: name,
                type: type
            })
            let path;
            if (parent) {
                path = `${process.env.FILE_PATH}\\${user._id}\\${parent.path}\\${name}`
            } else {
                path = `${process.env.FILE_PATH}\\${user._id}\\${name}`
            }
            if(file){
                await fs.appendFileSync(path, chunk, 'base64')
                const newInfo = fs.statSync(path)
                file.size = newInfo.size
                await file.save()
                await user.save()
                return res.status(200).json({status: 'upload', data: file })
            }else{
                let filePath = name
                let dbFile = new FileModel({
                    name: name,
                    type,
                    path: filePath,
                    parent: null,
                    user: user._id
                });
                if (parent) {
                    filePath = parent.path + "\\" + name
                    dbFile = new FileModel({
                        name: name,
                        type,
                        path: filePath,
                        parent: parent._id,
                        user: user._id
                    });
                }
                await fs.appendFileSync(path, chunk, 'base64')
                const newInfo = fs.statSync(path)
                dbFile.size = newInfo.size
                user.usedSpace += Number(size)
                await dbFile.save()
                await user.save()
                return res.status(200).json({status: 'upload', data: dbFile })
            }
        } catch (error) {
            res.status(500).json({error})
        }
    }

    async downloadFile(req, res) {
        try {
            const file = await FileModel.findOne({_id: req.query.id, user: req.headers.user})
            const path = fileService.getPath(file)
            if (fs.existsSync(path)) {
                return res.download(path, file.name)
            }
            return res.status(400).json({message: "Download error"})
        } catch (e) {
            res.status(500).json({message: "Download error"})
        }
    }
    async deleteFile(req, res) {
        try {
            const user = await UserModel.findOne({_id: req.headers.user})
            const file = await FileModel.findOne({_id: req.query.id, user: req.headers.user})
            if (!file) {
                return res.status(400).json({message: 'file not found'})
            }
            await fileService.deleteFile(file)
            user.usedSpace = user.usedSpace - Number(file.size)
            await user.save()
            await file.remove()
            return res.json({message: 'File was deleted'})
        } catch (e) {
            return res.status(400).json({message: e})
        }
    }
    async setShareLink(req, res) {
        try {
            const file = await FileModel.findOne({_id: req.body.id, user: req.headers.user})
            if (!file) {
                return res.status(400).json({message: 'file not found'})
            }
            file.accessLink = uuidv4();
            await file.save()
            return res.json(file)
        } catch (e) {
            res.status(500).json({message: "Error set link"})
        }
    }
    async removeShareLink(req, res) {
        try {
            const file = await FileModel.findOne({_id: req.query.id, user: req.headers.user})
            if (!file) {
                return res.status(400).json({message: 'file not found'})
            }
            file.accessLink = '';
            await file.save();
            return res.json(file)
        } catch (e) {
            res.status(500).json({message: "Error remove link"})
        }
    }
    async downloadFileShare(req, res) {
        try {
            const file = await FileModel.findOne({accessLink: req.params["link"]})
            if (!file) {
                return res.status(400).json({message: 'file not found'})
            }
            const path = fileService.getPath(file)
            if (fs.existsSync(path)) {
                return res.download(path, file.name)
            }
            return res.status(400).json({message: "Download error"})
        } catch (e) {
            res.status(500).json({message: "Download error"})
        }
    }
    async searchFile(req, res) {
        try {
            const searchName = req.query.search
            let files = await FileModel.find({user: req.headers.user})
            files = files.filter(file => file.name.includes(searchName))
            return res.json(files)
        } catch (e) {
            return res.status(400).json({message: 'Search error'})
        }
    }
}

module.exports = new File()
