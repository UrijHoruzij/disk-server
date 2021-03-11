const {Schema, model, ObjectId} = require("mongoose")

const User = new Schema({
    idUser: {type: String, required: true},
    diskSpace: {type: Number, default: 1024**3*8},
    usedSpace: {type: Number, default: 0},
    files : [{type: ObjectId, ref:'File'}]
})

module.exports = model('User', User)
