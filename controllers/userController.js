let fs = require("fs").promises;
const generalController = require(__basedir+"/controllers/generalController.js");
const { parse } = require('querystring');
const userService = require(__basedir+"/services/userService.js");

function handleLogout(request, response){
    if (request.method == 'GET'){
        generalController.errorHandler(400, response);
    } else if (request.method == 'POST'){
        if (userService.isAuthenticated(request)){
            var token = userService.generateLogoutToken();
            response.writeHead(301,{
                Location: "/loggedout",
                'Set-Cookie': token
            });
            console.log("logging out");
            response.end();
        } else {
            console.log("no user logged in, so cannot log out");
        }
    }
}

async function handleLoggedOut(request, response){
    var page = await fs.readFile(__basedir+"/resources/loggedout.html", "utf8");
    generalController.deliver(response, "application/xhtml+xml", page);
}
exports.handleLoggedOut = handleLoggedOut;

async function handleViewUser(request, response){
    var currentUser = await userService.getUserFromRequest(request);
    if (currentUser.isAdmin && userService.isAuthenticated(request)){
        var urlparts = request.url.split("=");
        var userid = urlparts[1];
        var template = await fs.readFile(__basedir+"/resources/userTemplate.html", "utf8");
        var statement = "SELECT * FROM users WHERE ID=" + Number(userid);
        console.log(statement);
        mysqlconnection.query(statement, async function(err, rows){
            if (err) throw err;
            // console.log(rows.length);
            if (rows.length==1){
                user = rows[0];
                var page = template.replace(/\$id/gi, user.id);
                var page = page.replace(/\$username/gi, user.username);
                if (user.isAdmin){
                    var page = page.replace(/\$isAdmin/gi, "Yes");
                } else {
                    var page = page.replace(/\$isAdmin/gi, "No");
                }
                if (currentUser.id == user.id){
                    page = page.replace(/\$deleteUser/gi, "disabled='disabled' title='You cannot delete yourself.'");
                } else {
                    page = page.replace(/\$deleteUser/gi, '');
                }
                generalController.deliver(response, "application/xhtml+xml", page);
            } else {
                var page = await fs.readFile(__basedir+"/resources/usernotfound.html", "utf8");
                generalController.deliver(response, "application/xhtml+xml", page);
            }
        });
    } else {
        console.log("User is not authenticated");
        generalController.errorHandler(401, response);
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
            generalController.redirect(response, "/user?="+userid);
        });
    } else {
        console.log("User must be authenticated");
        generalController.errorHandler(401, response);
    }
}
exports.handleToggleAdmin = handleToggleAdmin;

async function handleSignup(request, response){
    if (!userService.isAuthenticated(request)){
        if (request.method == 'POST'){
            var page = await fs.readFile(__basedir+"/resources/registered.html", "utf8");
            var data = [];
            request.on('data', dataPart => {
                data += dataPart;
            })
            request.on('end', async ()=>{
                data = parse(data);
                users = await userService.getUserByUsername(data.username)
                if (users.length>0){
                    console.log("User already exists");
                    page = await fs.readFile(__basedir+"/resources/signup.html", "utf8");
                    page = page.replace(/\$ifIncorrect/gi, '');
                    page = page.replace(/\$endIfIncorrect/gi, '');
                    generalController.deliver(response, "application/xhtml+xml", page);
                } else {
                    userService.signup(data.username, data.password, function(){
                        page = page.replace(/\$username/gi, data.username);
                        userService.login(data.username, data.password, function(token){
                            response.writeHead(301,{
                                Location: "/registered",
                                'Set-Cookie': token
                            });
                            response.end();
                        });
                    });
                }
            })
        } else if (request.method == 'GET'){
            var page = await fs.readFile(__basedir+"/resources/signup.html", "utf8");
            page = page.replace(/\$ifIncorrect[^]+\$endIfIncorrect/gi, '');
            generalController.deliver(response, "application/xhtml+xml", page);
        }
    } else {
        var page = await fs.readFile(__basedir+"/resources/alreadyloggedin.html", "utf8");
        var user = await userService.getUserFromRequest(request);
        page = page.replace(/\$username/gi, user.username);
        generalController.deliver(response, "application/xhtml+xml", page);
    }
}

async function handleRegistered(request, response){
    var page = await fs.readFile(__basedir+"/resources/registered.html", "utf8");
    var user = await userService.getUserFromRequest(request);
    page = page.replace(/\$username/gi, user.username);
    generalController.deliver(response, "application/xhtml+xml", page);
}
exports.handleRegistered = handleRegistered;

async function handleLogin(request, response){
    if (userService.isAuthenticated(request)){
        var page = await fs.readFile(__basedir+"/resources/alreadyloggedin.html", "utf8");
        var user = await userService.getUserFromRequest(request);
        page = page.replace(/\$username/gi, user.username);
        generalController.deliver(response, "application/xhtml+xml", page);
    } else {
        if (request.method == 'GET'){
            var page = await fs.readFile(__basedir+"/resources/login.html", "utf8");
            page = page.replace(/\$ifIncorrect[^]+\$endIfIncorrect/gi, '');
            generalController.deliver(response, "application/xhtml+xml", page);
        } else if (request.method == 'POST'){
            var page = await fs.readFile(__basedir+"/resources/login.html", "utf8");
            var data = [];
            request.on('data', dataPart => {
                data += dataPart;
            })
            request.on('end', ()=>{
                data = parse(data);
                userService.login(data.username, data.password, function(token){
                    if (token){
                        response.writeHead(301,{
                            Location: "/menu",
                            'Set-Cookie': token
                        });
                        response.end();
                    } else {
                        page = page.replace(/\$ifIncorrect/gi, '');
                        page = page.replace(/\$endIfIncorrect/gi, '');
                        generalController.deliver(response, "application/xhtml+xml", page);
                    }
                });
            })
        }
    }
}


async function getMenu(request, response){
    if (userService.isAuthenticated(request)){
        var page = await fs.readFile(__basedir+"/resources/menu.html", "utf8");
        var user = await userService.getUserFromRequest(request);
        page = page.replace(/\$username/gi, user.username);
        if (user.isAdmin){
            console.log("User is admin");
            page = page.replace(/\$adminsectionA/gi, '');
            page = page.replace(/\$adminsectionB/gi, '');
        } else {
            console.log("User is not admin");
            page = page.replace(/\$adminsectionA[^]+\$adminsectionB/gi, '');
        }
        generalController.deliver(response, "application/xhtml+xml", page);
    } else {
        console.log("User is not authenticated");
        generalController.errorHandler(401, response);
    }
}


async function handleUserList(request, response){
    var template = await fs.readFile(__basedir+"/resources/userList.html", "utf8");
    var url = request.url;
    var currentUser = await userService.getUserFromRequest(request);
    if (currentUser.isAdmin && userService.isAuthenticated(request)){
        var username = "";
        var isAdmin = false;
        if (request.url.includes("admin=on")){
            isAdmin = true;
        }
        if (url.startsWith("/users/filter")){
            var urlparts = request.url.split("&");
            var username = urlparts[0].split("=")[1];
        }
        var currentPString = /page=\d+/gi.exec(url) + '';
        var currentPage = currentPString.split("=")[1];
        if (!currentPage || currentPage <1){
            currentPage = 1;
        }
        var users = userService.getUsers(username, isAdmin, currentPage, function(users){
            let insertion = " ";
            for(var i=0; i<users.length; i++){
                var user = users[i];
                insertion += "<tr><td>"+user.username+"</td><td>"+user.isAdmin+"</td><td><button type='button' class='btn-grape infoButton' onclick='document.location = `/user?="+user.id+"`'>ⓘ</button></td></tr>";
            }
            var page = template.replace(/\$users/gi, insertion);
            var page = page.replace(/\$username/gi, username);
            if (isAdmin){
                page = page.replace(/\$isAdmin/gi, "checked='checked'");
            } else {
                page = page.replace(/\$isAdmin/gi, "");
            }
            userService.getNumOfUsers(username, isAdmin, function(result){
                pages = Math.ceil(result/10);
                var paginationString = " ";
                var i;
                url = url.replace(/\&page=\d+/gi, "");
                if (currentPage>1){
                    below = Number(currentPage)-1;
                    paginationString += "<a href='" + url + "&page="+(below) + "'>←</a>"
                } else {
                    paginationString += "<a href='#'>←</a>"
                }
                for (i = 1; i<=pages; i++){
                    if (i == currentPage){
                        paginationString +=  "<a class='active' href='" + url +"&page="+i+"'>"+i+"</a>";
                    } else {
                        paginationString +=  "<a href='" + url +"&page="+i+"'>"+i+"</a>";
                    }
                }
                if (currentPage<pages){
                    above = Number(currentPage)+1;
                    paginationString += "<a href='" + url + "&page="+(above) + "'>→</a>"
                } else {
                    paginationString += "<a href='#'>→</a>"
                }
                page = page.replace(/\$pagination/gi, paginationString);
                page = page.replace(/\&/gi, '&amp;');
                generalController.deliver(response, "application/xhtml+xml", page);
            });

        });
    } else {
        console.log("User must be admin");
        generalController.errorHandler(401, response);
    }
}
exports.handleUserList = handleUserList;

async function handleDeleteUser(request, response){
    //check if admin && post
    if (request.method == "POST"){
        currentUser = await userService.getUserFromRequest(request);
        if (currentUser.isAdmin && userService.isAuthenticated(request)){
            var urlparts = request.url.split("=");
            var userid = urlparts[1];
            if (userid == currentUser.id){
                console.log("User tried to delete self");
                generalController.errorHandler(500, response);
            } else {
                var statement = "DELETE FROM users WHERE ID=" + mysqlconnection.escape(userid);
                mysqlconnection.query(statement, function(err){
                    if (err) throw err;
                    console.log("Deleting user with id: "+currentUser.id);
                    generalController.redirect(response, "/userdeleted");
                });
            }
        } else {
            console.log("User must be admin to delete a user");
            generalController.errorHandler(401, response);
        }
    } else {
        console.log("Method must be post");
        generalController.errorHandler(400, response);
    }
}
exports.handleDeleteUser = handleDeleteUser;

async function handleDeleted(request, response){
    if (userService.isAuthenticated(request)){
        var page = await fs.readFile(__basedir+"/resources/userdeleted.html", "utf8");
        generalController.deliver(response, "application/xhtml+xml", page);
    } else {
        generalController.errorHandler(401, response);
    }
}
exports.handleDeleted = handleDeleted;
exports.handleSignup = handleSignup;
exports.handleLogout = handleLogout;
exports.handleLogin = handleLogin;
exports.getMenu = getMenu;
