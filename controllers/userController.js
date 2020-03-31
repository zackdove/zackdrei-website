let fs = require("fs").promises;
const generalController = require(__basedir+"/controllers/generalController.js");
const { parse } = require('querystring');
const userService = require(__basedir+"/services/userService.js");

function handleLogout(request, response){
    if (request.method == 'GET'){
        //pass template and deliver
    } else if (request.method == 'POST'){
        //check authenticated, then remove cookie
        if (userService.isAuthenticated(request)){
            var token = generateLogoutToken();
            response.writeHead(301,{
                Location: "/",
                'Set-Cookie': token
            });
            console.log("logging out");
            response.end();
        } else {
            console.log("no user logged in, so cannot log out");
        }
    }
}

async function handleSignup(request, response){
    if (request.method == 'POST'){
        var data = [];
        request.on('data', dataPart => {
            data += dataPart;
        })
        request.on('end', ()=>{
            data = parse(data);
            userService.signup(data.username, data.password, response);
        })
    } else if (request.method == 'GET'){
        var page = await fs.readFile(__basedir+"/resources/signup.html", "utf8");
        generalController.deliver(response, "application/xhtml+xml", page);
    }
}

async function handleLogin(request, response){
    if (request.method == 'GET'){
        var page = await fs.readFile(__basedir+"/resources/login.html", "utf8");
        generalController.deliver(response, "application/xhtml+xml", page);
    } else if (request.method == 'POST'){
        var data = [];
        request.on('data', dataPart => {
            data += dataPart;
        })
        request.on('end', ()=>{
            data = parse(data);
            userService.login(data.username, data.password, response);
        })
    }
}

exports.handleSignup = handleSignup;
exports.handleLogout = handleLogout;
exports.handleLogin = handleLogin;
