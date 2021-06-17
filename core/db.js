const mongoose = require("mongoose");
const { DB_HOST } = require("../config");

const db = {};
db.connect = async () => {
  const connect = await mongoose.connect(DB_HOST, {
    useNewUrlParser: true,
    useUnifiedTopology: true,
    useCreateIndex: true,
    useFindAndModify: false,
  });
  if (connect) {
    console.log("Успешно подключение к MongoDB");
  } else {
    console.error("Ошибка поключения к базе данных");
  }
};

module.exports = db;
