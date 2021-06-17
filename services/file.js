const fs = require('fs')
const { FILE_PATH } = require("../config");

class FileService {
    createDir(file) {
        const filePath = `${FILE_PATH}\\${file.user}\\${file.path}`
        return new Promise(((resolve, reject) => {
            try {
                if (!fs.existsSync(filePath)) {
                    fs.mkdirSync(filePath)
                    return resolve({message: 'File was created'})
                } else {
                    return reject({message: "File already exist"})
                }
            } catch (e) {
                return reject({message: 'File error'})
            }
        }))
    }
    async deleteFile(file) {
        const path = this.getPath(file)
        if (file.type === 'dir') {
            const content = await fs.readdirSync(path)
            if(content.length > 0){
                throw new Error('The folder is not empty')
            }
            fs.rmdirSync(path)
        } else {
            fs.unlinkSync(path)
        }
    }
    getPath(file) {
        return FILE_PATH + '\\' + file.user + '\\' + file.path
    }
}

module.exports = new FileService()