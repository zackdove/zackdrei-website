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
            var token = userService.generateLogoutToken();
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

async function handleViewUser(request, response){
    if (userService.isAuthenticated(request)){
        var urlparts = request.url.split("=");
        var userid = urlparts[1];
        //mysql prevents escaping by default
        var template = await fs.readFile(__basedir+"/resources/userTemplate.html", "utf8");
        var statement = "SELECT * FROM users WHERE ID=" + mysqlconnection.escape(userid);
        // this should be in user service!
        mysqlconnection.query(statement, function(err, rows){
            if (err) throw err;
            user = rows[0];
            var page = template.replace(/\$id/gi, user.id);
            var page = page.replace(/\$username/gi, user.username);
            var page = page.replace(/\$password/gi, user.password);
            var page = page.replace(/\$isAdmin/gi, user.isAdmin);
            generalController.deliver(response, "application/xhtml+xml", page);
        });
    } else {
        console.log("user is not authenticated");
    }
}
exports.handleViewUser = handleViewUser;

function handleToggleAdmin(request, response){
    if (userService.isAuthenticated(request)){
        var urlparts = request.url.split("=");
        var userid = urlparts[1];
        var statement = "UPDATE users SET isAdmin = !isAdmin WHERE ID=" + mysqlconnection.escape(userid);
        mysqlconnection.query(statement, function(err){
            if (err) throw err;
            generalController.redirect(response, "/menu");
        });
    } else {
        console.log("user must be authenticated");
    }
}
exports.handleToggleAdmin = handleToggleAdmin;

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
        page = page.replace(/\$ifIncorrect[^]+\$endIfIncorrect/gi, '');
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

async function handleBadLogin(response){
    var page = await fs.readFile(__basedir+"/resources/login.html", "utf8");
    // here insert a thing saying incorrect login
    page = page.replace(/\$ifIncorrect/gi, '');
    page = page.replace(/\$endIfIncorrect/gi, '');
    generalController.deliver(response, "application/xhtml+xml", page);
}
exports.handleBadLogin = handleBadLogin;

async function getMenu(request, response){
    if (userService.isAuthenticated(request)){
        var page = await fs.readFile(__basedir+"/resources/menu.html", "utf8");
        var user = await userService.getUserFromRequest(request);
        page = page.replace(/\$username/gi, user.username);
        if (user.isAdmin){
            console.log("user is admin");
            page = page.replace(/\$adminsectionA/gi, '');
            page = page.replace(/\$adminsectionB/gi, '');
        } else {
            console.log("user is not admin");
            page = page.replace(/\$adminsectionA[^]+\$adminsectionB/gi, '');


            // hide the bits using commenting or delete them?
        }
        generalController.deliver(response, "application/xhtml+xml", page);
    } else {
        console.log("user is not authenticated");
    }
}


async function handleUserList(url, response){
    if (userService.isAuthenticated(request)){
        var username = "";
        var isAdmin = "";
        var statement = "SELECT * FROM users";
        if (url.startsWith("/list/filter")){
            var urlparts = url.split("&");
            var username = urlparts[0].split("=")[1];
            var isAdmin = urlparts[1].split("=")[1];
            if (username != "" || isAdmin != ""){
                var statement = "SELECT * FROM wines WHERE ";
                if (country!=""){
                    statement+="Username='"+username+"' AND ";
                }
                if (grape!=""){
                    statement+="isAdmin='"+isAdmin+"' AND ";
                }
                if (statement.endsWith("AND ")){
                    statement = statement.slice(0, statement.length-4);
                }
            }
        }
        console.log(statement);
        var template = await fs.readFile(__basedir+"/resources/userList.html", "utf8");
        mysqlconnection.query(statement, function(err, users){
            if(err) throw err;
            //the +'' is needed to set template to a string
            // parts = template.split("$");
            let insertion = " ";
            for(var i=0; i<users.length; i++){
                var user = users[i];
                insertion += "<tr><td>"+user.username+"</td><td>"+user.isAdmin+"</td><td><button type='button' class='btn2 btn-grape infoButton' onclick='document.location = `/user?="+user.id+"`'>ⓘ</button></td></tr>";
            }
            // var page = parts[0] + html + parts[1];
            var page = template.replace(/\$users/gi, insertion);
            var page = page.replace(/\$username/gi, username);
            var page = page.replace(/\$isAdmin/gi, isAdmin);
            generalController.deliver(response, "application/xhtml+xml", page);
        });
    } else {
        console.log("user must be authenticated");
    }
}
exports.handleUserList = handleUserList;

async function handleDeleteUser(request, response){
    //check if admin && post
    if (request.method == "POST"){
        user = await userService.getUserFromRequest(request);
        if (user.isAdmin){
            var urlparts = request.url.split("=");
            var userid = urlparts[1];
            var statement = "DELETE FROM users WHERE ID=" + mysqlconnection.escape(userid);
            mysqlconnection.query(statement, function(err){
                if (err) throw err;
                console.log("deleting user with id: "+user.id);
                generalController.redirect(response, "/users");
            });
        } else {
            console.log("user must be admin to delete a user");
        }
    } else {
        console.log("method must be post");
        // redirct to error
    }
}
exports.handleDeleteUser = handleDeleteUser;

exports.handleSignup = handleSignup;
exports.handleLogout = handleLogout;
exports.handleLogin = handleLogin;
exports.getMenu = getMenu;
