let root = "./resources"
let https = require("https");
const http = require('http');
const { parse } = require('querystring');
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
    // console.log(request);
    // console.log("response = "+response);
    var url = request.url;
    var method = request.method;
    console.log(method, url);
    if (url =="/list") {
        getWineList("http://localhost:8080/list/filter?country=&grape=&vintage=&colour=&producer=",response);
    }
    else if (url.startsWith("/list/filter?")){
        console.log("!!!!");
        getWineList(url, response);
    }
    else if (url.startsWith("/wine?=")) {
        getWine(url, response);
    }
    else if (url == "/add" && method=='GET'){
        getAddWine(response);
    }
    else if (url == "/add" && method=='POST'){
        postAddWine(request, response);
    }
    else if (url.startsWith("/delete?=") && method=='POST'){
        deleteWine(url, response);
    }
    else {
        getFile(url, response);
    }
}

function deleteWine(url, response){
    var urlparts = url.split("=");
    var wineid = urlparts[1];
    var statement = "DELETE FROM wines WHERE ID=" + mysqlconnection.escape(wineid);
    mysqlconnection.query(statement, function(err, wine){
        if (err) throw err;
        getWineList("http://localhost:8080/list/filter?country=&grape=&vintage=&colour=&producer=",response);
    });
}

async function getWineList(url, response){
    var urlparts = url.split("&");
    var country = urlparts[0].split("=")[1];
    var grape = urlparts[1].split("=")[1];
    var vintage = urlparts[2].split("=")[1];
    var colour = urlparts[3].split("=")[1];
    var producer = urlparts[4].split("=")[1];
    if (country != "" || grape != "" || vintage!=""||colour!=""||producer!=""){
        var statement = "SELECT * FROM wines WHERE ";
        if (country!=""){
            statement+="Country='"+country+"' AND ";
        }
        if (grape!=""){
            statement+="Grape='"+grape+"' AND ";
        }
        if (vintage!=""){
            statement+="Vintage='"+vintage+"' AND ";
        }
        if (colour!=""){
            statement+="Colour='"+colour+"' AND ";
        }
        if (producer!=""){
            statement+="Producer='"+producer+"'";
        }
        if (statement.endsWith("AND ")){
            statement = statement.slice(0, statement.length-4);
        }
    } else {
        var statement = "SELECT * FROM wines";
    }
    console.log(statement);
    var template = await fs.readFile(root+"/listTemplate.html", "utf8");
    mysqlconnection.query(statement, function(err, wines){
        if(err) throw err;
        //the +'' is needed to set template to a string
        // parts = template.split("$");
        let insertion = " ";
        for(var i=0; i<wines.length; i++){
            var wine = wines[i];
            insertion += "<tr><td>"+wine.Country+"</td><td>"+wine.Grape+"</td><td>"+wine.Vintage+"</td><td>"+wine.Colour+"</td><td>"+wine.Producer+"</td><td><button type='button' class='btn2 btn-grape infoButton' onclick='document.location = `/wine?="+wine.id+"`'>ⓘ</button></td></tr>";
        }
        // var page = parts[0] + html + parts[1];
        var page = template.replace(/\$wines/gi, insertion);
        var page = page.replace(/\$country/gi, country);
        var page = page.replace(/\$grape/gi, grape);
        var page = page.replace(/\$vintage/gi, vintage);
        var page = page.replace(/\$colour/gi, colour);
        var page = page.replace(/\$producer/gi, producer);
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

async function getAddWine(response){
    var page = await fs.readFile(root+"/addWine.html", "utf8");
    deliver(response, "application/xhtml+xml", page);
}

async function postAddWine(request, response){
    var data = [];
    request.on('data', dataPart => {
        data += dataPart;
    })
    request.on('end', ()=>{
        //Do stuff with data
        data = parse(data);
        console.log(data.country);
        //what about ID
        var statement = "INSERT INTO wines (country, grape, vintage, colour, producer) VALUES ('";
        statement += data.country + "', '";
        statement += data.grape+ "', '";
        statement += data.vintage+"', '";
        statement += data.colour+"', '";
        statement += data.producer+"')"
        console.log(statement);
        mysqlconnection.query(statement, function(err){
            if (err) throw err;
            getWineList("http://localhost:8080/list/filter?country=&grape=&vintage=&colour=&producer=",response);
        });
    })

    // var country = await request.body.country;

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
    console.log("response2= "+response);
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
