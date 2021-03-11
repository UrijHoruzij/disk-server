const express = require("express");
const cors = require("cors");
const morgan = require("morgan");
const os = require("os");
const cluster = require("cluster");
const db = require("./core/db");
const authMiddleware = require('./middleware/auth')
const multer  = require('multer')
const upload = multer({
  limits: { fieldSize: 25 * 1024 * 1024 }
})
require("dotenv").config();

const server = () => {
    const app = express();
    db.connect();
    app.use(
    morgan((tokens, req, res) => {
        return [
        tokens.method(req, res),
        tokens.url(req, res),
        tokens.status(req, res),
        tokens.res(req, res, "content-length"),
        "-",
        tokens["response-time"](req, res),
        "ms",
        process.pid,
        "id",
        ].join(" ");
    })
    );
    let allowedOrigins = ['http://localhost:3000','http://localhost:3006','http://localhost:5000'];
    app.use(cors({
      credentials: true,
      origin: function (origin, callback){
        if(!origin) return callback(null, true);
        if(allowedOrigins.indexOf(origin) === -1){
          return callback(new Error('Cors'), false);
        }
        return callback(null, true);
      }
    }))
    app.use(express.urlencoded({ extended: false }));
    app.use(express.json());

    const userController = require('./controllers/user')
    const fileController = require('./controllers/file')

    app.post("/getMe", authMiddleware, userController.getMe)
    app.post('', authMiddleware, fileController.createDir)
    app.post('/status',upload.none(), fileController.status)
    app.post('/upload', upload.none(), fileController.uploadFile)
    app.get('', authMiddleware, fileController.getFiles)
    app.get('/download', authMiddleware, fileController.downloadFile)
    app.get('/search', authMiddleware, fileController.searchFile)
    app.delete('/', authMiddleware, fileController.deleteFile)
    app.post('/setShareLink', authMiddleware, fileController.setShareLink)
    app.delete('/removeShareLink', authMiddleware, fileController.removeShareLink)
    app.get('/file/:link', fileController.downloadFileShare)
    
    app.listen(process.env.PORT, () => {
        console.log(`The server is running: ${process.env.PORT} stream ${process.pid}`);
    });
};

const clusterWorkerSize = os.cpus().length;
if (clusterWorkerSize > 1) {
  if (cluster.isMaster) {
    for (let i = 0; i < clusterWorkerSize - 1; i++) {
      cluster.fork();
    }
    cluster.on("exit", (worker) => {
      console.log("Worker", worker.id, " has exitted.");
      cluster.fork();
    });
  } else {
    server();
  }
} else {
  server();
}
