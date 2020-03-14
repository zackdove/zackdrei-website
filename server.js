let root = "./resources"
let https = require("https");
const http = require('http');
let fs = require("fs").promises;
let OK = 200, NotFound = 404, BadType = 415, Error = 500;
let types, paths;
var mode;
if (process.argv[2] == undefined){
    mode = "dev";
} else {
    mode = process.argv[2];
}
console.log("mode = "+mode);
var mysql = require('mysql');
var mysqlconnection = mysql.createConnection({
    host: "localhost",
    user: "root",
    password: "ilovewine",
    database: "grape"
});
mysqlconnection.connect(function(err){
    if (err) throw err;
    console.log("Connected");
});
//Start the server
start();

async function start() {
    try {
        await fs.access(root);
        await fs.access(root + "/index.html");
        types = defineTypes();
        paths = new Set();
        paths.add("/");
        if (mode == "dev"){
            let service = http.createServer(handle);
            service.listen(8080);
            console.log("Server running in dev mode localhost:8080");
        } else if (mode == "prod"){
            let options = {
                cert: await fs.readFile("/root/sslkey/grapewebtech_me.crt","utf8"),
                ca: await fs.readFile("/root/sslkey/grapewebtech_me.ca-bundle","utf8"),
                key: await fs.readFile("/root/sslkey/grapewebtech_com.key","utf8")
            };
            let service = https.createServer(options, handle);
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

// Serve a request by delivering a file.
async function handle(request, response) {
    var url = request.url;
    console.log("url=", url);
    if (url =="/list") {
        getWineList(response);
    }
    else if (url.startsWith("/wine?=")) {
        getWine(url, response);
    }
    else {
        getFile(url, response);
    }
}

async function getWineList(response){
    var statement = "SELECT * FROM wines";
    var template = await fs.readFile(root+"/listTemplate.html", "utf8");
    mysqlconnection.query(statement, function(err, wines){
        if(err) throw err;
        //the +'' is needed to set template to a string
        parts = template.split("$");
        let html = " ";
        for(var i=0; i<wines.length; i++){
            var wine = wines[i];
            html += "<tr><td>"+wine.Country+"</td><td>"+wine.Grape+"</td><td>"+wine.Vintage+"</td><td>"+wine.Colour+"</td><td>"+wine.Producer+"</td></tr>";
        }
        var page = parts[0] + html + parts[1];
        deliver(response, "application/xhtml+xml", page);
    });
}


async function getWine(url, response){
    var urlparts = url.split("=");
    var wineid = urlparts[1];
    //mysql prevents escaping by default
    var template = await fs.readFile(root+"/wineTemplate.html", "utf8");
    var statement = "SELECT * FROM wines WHERE ID=" + mysqlconnection.escape(wineid);
    mysqlconnection.query(statement, function(err, wine){
        if (err) throw err;
        var parts = template.split("$");
        var page = parts[0] + wine[0].id + parts[1] + wine[0].Country + parts[2] + wine[0].Grape + parts[3] + wine[0].Vintage
        + parts[4] + wine[0].Colour + parts[5] + wine[0].Producer + parts[6] + wine[0].NOTES + parts[7];
        deliver(response, "application/xhtml+xml", page);
    });
}

async function getFile(url, response){
    if (url.endsWith("/")) url = url + "index.html";
    var ok = await checkPath(url);
    if (!ok) return fail(response, NotFound, "URL not found (check case)");
    var type = findType(url);
    if (type == null) return fail(response, BadType, "File type not supported");
    var file = root + url;
    var content = await fs.readFile(file);
    deliver(response, type, content);
}

// Check if a path is in or can be added to the set of site paths, in order
// to ensure case-sensitivity.
async function checkPath(path) {
    if (! paths.has(path)) {
        let n = path.lastIndexOf("/", path.length - 2);
        let parent = path.substring(0, n + 1);
        let ok = await checkPath(parent);
        if (ok) await addContents(parent);
    }
    return paths.has(path);
}

// Add the files and subfolders in a folder to the set of site paths.
async function addContents(folder) {
    let folderBit = 1 << 14;
    let names = await fs.readdir(root + folder);
    for (let name of names) {
        let path = folder + name;
        let stat = await fs.stat(root + path);
        if ((stat.mode & folderBit) != 0) path = path + "/";
        paths.add(path);
    }
}

// Find the content type to respond with, or undefined.
function findType(url) {
    let dot = url.lastIndexOf(".");
    let extension = url.substring(dot + 1);
    return types[extension];
}

// Deliver the file that has been read in to the browser.
function deliver(response, type, content) {
    let typeHeader = { "Content-Type": type };
    response.writeHead(OK, typeHeader);
    response.write(content);
    response.end();
}

// Give a minimal failure response to the browser
function fail(response, code, text) {
    let textTypeHeader = { "Content-Type": "text/plain" };
    response.writeHead(code, textTypeHeader);
    response.write(text, "utf8");
    response.end();
}

// The most common standard file extensions are supported, and html is
// delivered as "application/xhtml+xml".  Some common non-standard file
// extensions are explicitly excluded.  This table is defined using a function
// rather than just a global variable, because otherwise the table would have
// to appear before calling start().  NOTE: add entries as needed or, for a more
// complete list, install the mime module and adapt the list it provides.
function defineTypes() {
    let types = {
        html : "application/xhtml+xml",
        css  : "text/css",
        js   : "application/javascript",
        mjs  : "application/javascript", // for ES6 modules
        png  : "image/png",
        gif  : "image/gif",    // for images copied unchanged
        jpeg : "image/jpeg",   // for images copied unchanged
        jpg  : "image/jpeg",   // for images copied unchanged
        svg  : "image/svg+xml",
        json : "application/json",
        pdf  : "application/pdf",
        txt  : "text/plain",
        ttf  : "application/x-font-ttf",
        woff : "application/font-woff",
        aac  : "audio/aac",
        mp3  : "audio/mpeg",
        mp4  : "video/mp4",
        webm : "video/webm",
        ico  : "image/x-icon", // just for favicon.ico
        xhtml: undefined,      // non-standard, use .html
        htm  : undefined,      // non-standard, use .html
        rar  : undefined,      // non-standard, platform dependent, use .zip
        doc  : undefined,      // non-standard, platform dependent, use .pdf
        docx : undefined,      // non-standard, platform dependent, use .pdf
    }
    return types;
}
