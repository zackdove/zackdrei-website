global.__basedir = __dirname;
let https = require("https");
const http = require('http');
require('dotenv').config();
const generalController = require("./controllers/generalController.js");
let fs = require("fs").promises;




var mode;
const jwtSecret = process.env.jwtSecret;
const userService = require("./services/userService.js");
if (process.argv[2] == undefined){
    mode = "dev";
} else {
    mode = process.argv[2];
}
console.log("mode = "+mode);
const dbService = require("./services/dbService");
mysqlconnection = dbService.initialiseDB();
//Start the server
start();

async function start() {
    try {
        await fs.access(__basedir+"/resources");
        await fs.access(__basedir+"/resources/index.html");
        paths = new Set();
        paths.add("/");
        if (mode == "dev"){
            let service = http.createServer(generalController.handle);
            service.listen(8080);
            console.log("Server running in dev mode localhost:8080");
        } else if (mode == "prod"){
            let options = {
                cert: await fs.readFile("/root/sslkey/grapewebtech_me.crt","utf8"),
                ca: await fs.readFile("/root/sslkey/grapewebtech_me.ca-bundle","utf8"),
                key: await fs.readFile("/root/sslkey/grapewebtech_com.key","utf8")
            };
            let service = https.createServer(options, generalController.handle);
            let port = 443;
            service.listen(port);
            let address = "https://grapewebtech.me";
            if (port != 80) address = address + ":" + port;
            console.log("Server running at", address);
            //Redirect HTTP to HTTPS
            const hostname = 'grapewebtech.me';
            const httpServer = http.createServer((req, res) => {
                let redirectUrl = "https://"+hostname;
                res.writeHead(301,{Location: redirectUrl});
                res.end();
            }).listen(8080);
        }
    }
    catch (err) { console.log(err); process.exit(1); }
}
