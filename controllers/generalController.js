const userService = require(__basedir+"/services/userService.js");
const userController = require(__basedir+"/controllers/userController.js");
const wineController = require(__basedir+"/controllers/wineController.js");
let fs = require("fs").promises;
let root = __basedir+"/resources";
console.log(root);
let types = defineTypes();


async function handle(request, response) {
    // console.log(request);
    // console.log("response = "+response);
    var url = request.url;
    var method = request.method;
    console.log(method, url);
    var loggedIn = userService.isAuthenticated(request);
    if (url == "/signup"){
        userController.handleSignup(request, response);
    }
    else if (url == "/login"){
        userController.handleLogin(request, response);
    }
    else if (url =="/about"){
        deliverAbout(response);
    }
    else if (url == "/"){
        deliverIndex(response);
    }
    else if (url == "/logout"){
        userController.handleLogout(request, response);
    }
    else if (url.startsWith("/wines") && loggedIn){
        wineController.getWineList(url, response);
    }
    else if (url.startsWith("/wine?=")&& loggedIn) {
        wineController.getWine(url, response);
    }
    else if (url == "/addwine" && method=='GET'&& loggedIn){
        wineController.getAddWine(response);
    }
    else if (url == "/addwine" && method=='POST'&& loggedIn){
        wineController.postAddWine(request, response);
    }
    else if (url.startsWith("/deletewine?=") && method=='POST'&& loggedIn){
        wineController.deleteWine(url, response);
    } else if (url == "/menu" && loggedIn){
        userController.getMenu(request, response);
    } else if (url.startsWith("/user?=") && loggedIn){
        userController.handleViewUser(request, response);
    } else if (url.startsWith("/users")){
        userController.handleUserList(url, response);
    } else if (url.startsWith("/toggleAdmin?=") && loggedIn){
        userController.handleToggleAdmin(request, response);
    } else {
        //this MUST be changed, otherwise can just serve all pages, should point to 404
        getFile(url, response);
    }
}

function redirect(response, url){
    response.writeHead(301,{
        Location: url
    });
    console.log("redirecting to "+url);
    response.end();
}
exports.redirect = redirect;

async function deliverAbout(response){
    var page = await fs.readFile(__basedir+"/resources/about.html", "utf8");
    deliver(response, "application/xhtml+xml", page);
}

async function deliverIndex(response){
    var page = await fs.readFile(__basedir+"/resources/index.html", "utf8");
    deliver(response, "application/xhtml+xml", page);
}


async function getFile(url, response){
    if (url.endsWith("/")) url = url + "index.html";
    var ok = await checkPath(url);
    if (!ok) return fail(response, 404, "URL not found (check case)");
    var type = findType(url);
    if (type == null) return fail(response, 415, "File type not supported");
    var file = root + url;
    var content = await fs.readFile(file);
    deliver(response, type, content);
}

async function checkPath(path) {
    if (! paths.has(path)) {
        let n = path.lastIndexOf("/", path.length - 2);
        let parent = path.substring(0, n + 1);
        let ok = await checkPath(parent);
        if (ok) await addContents(parent);
    }
    return paths.has(path);
}

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

function findType(url) {
    let dot = url.lastIndexOf(".");
    let extension = url.substring(dot + 1);
    return types[extension];
}

// Deliver the file that has been read in to the browser.
function deliver(response, type, content) {
    let typeHeader = { "Content-Type": type };
    response.writeHead(200, typeHeader);
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

exports.handle = handle;
exports.deliverAbout = deliverAbout;
exports.deliverIndex = deliverIndex;
exports.getFile = getFile;
exports.deliver = deliver;
exports.fail = fail;
exports.defineTypes = defineTypes;
