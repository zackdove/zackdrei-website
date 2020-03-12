// Run a node.js web server for local development of a static web site. Create a
// site folder, put server.js in it, create a sub-folder called "public", with
// at least a file "index.html" in it. Start the server with "node server.js &",
// and visit the site at the address printed on the console.
//     The server is designed so that a site will still work if you move it to a
// different platform, by treating the file system as case-sensitive even when
// it isn't (as on Windows and some Macs). URLs are then case-sensitive.
//     All HTML files are assumed to have a .html extension and are delivered as
// application/xhtml+xml for instant feedback on XHTML errors. Content
// negotiation is not implemented, so old browsers are not supported. Https is
// not supported. Add to the list of file types in defineTypes, as necessary.

// Change the port to the default 80, if there are no permission issues and port
// 80 isn't already in use. The root folder corresponds to the "/" url.

let root = "./resources"

// Load the library modules, and define the global constants and variables.
// Load the promises version of fs, so that async/await can be used.
// See http://en.wikipedia.org/wiki/List_of_HTTP_status_codes.
// The file types supported are set up in the defineTypes function.
// The paths variable is a cache of url paths in the site, to check case.
let https = require("https");
let fs = require("fs").promises;
let OK = 200, NotFound = 404, BadType = 415, Error = 500;
let types, paths;

//connect to database --> to do: prompt user for password to connect,
// change it to pool to allow multiple connections??
//Ian reccomends an embedded database should probs change to sqlite

var mysql = require('mysql');

var connection = mysql.createConnection({
    host: "localhost",
    user: "root",
    password: "ilovewine",
    database: "grape"
});



connection.connect(function(err){
    if (err) throw err;
    console.log("Connected");
});

// Start the server:
start();

// Check the site, giving quick feedback if it hasn't been set up properly.
// Start the http service. Accept only requests from localhost, for security.
// If successful, the handle function is called for each request.
async function start() {
    try {
        await fs.access(root);
        await fs.access(root + "/index.html");
        types = defineTypes();
        paths = new Set();
        paths.add("/");
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
        const http = require('http');
        const hostname = 'grapewebtech.me';
        const httpServer = http.createServer((request, result) => {
            result.statusCode = 301;
            result.setHeader =('Location', `https://${hostname}${request.url}`);
            result.send();
        }).listen(8080);

    }
    catch (err) { console.log(err); process.exit(1); }
}




// Serve a request by delivering a file.
async function handle(request, response) {
    var url = request.url;
    console.log("url=", url);
    // can add a list of wines here
    if (url =="/wines") getList(response);
    else if (url.startsWith("/wine.html")) getWine(url, response);
    else getFile(url, response);
}

function getWineList(response){
    var statement = "SELECT * FROM wines";
    connection.query(statement, function(err, list, fields){
        if(err) throw err;
        deliverList(list, response)
    });
}

function deliverList(list, response){
    var text = JSON.stringify(list);
    deliver(response,"text/plain", text);
}

async function getWine(url, response){
    // if option is a string then it specifies encoding otherwise paramter is callback function
    // could have callback function here as a parameter but may not be needed????
    var content = await fs.readFile("./resources/wineTemplate.html","utf8");
    getData(content, url, response);

}

function getData(text, url, response){
    var parts = url.split("=");
    var id = parts[1];
    //mysql prevents escaping by default
    var statement = "SELECT * FROM wines WHERE ID=" + connection.escape(id);
    connection.query(statement, function(err, results,  fields){
        if (err) throw err;
        // do something with the tings
        // convert it from RPD
        results = JSON.stringify(results);
        prepare(text, results, response);
    });
}


function addWineToWinePage(text, data, response){
    console.log(data.name);
    json = JSON.parse(data);
    console.log(json);
    var parts = text.split("$");
    // need to find a nice way to do this
    var page = parts[0] + json[0].id + parts[1] + json[0].Country + parts[2] + json[0].Grape + parts[3] + json[0].Vintage
    + parts[4] + json[0].Colour + parts[5] + json[0].Producer + parts[6] + json[0].NOTES + parts[7];
    console.log(page);
    deliver(response, "text/html", page);
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
