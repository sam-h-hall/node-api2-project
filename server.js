const express = require("express");
const expressRouter = require("./routers/express-router.js");

const server = express();

server.use(express.json());
server.use("/api/posts", expressRouter);


module.exports = server;