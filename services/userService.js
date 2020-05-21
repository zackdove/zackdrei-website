let jwt = require("jsonwebtoken");
const bcrypt = require("bcrypt");
const userController = require(__basedir+"/controllers/userController.js");

function isAuthenticated(request){
    let cookie = request.headers.cookie;
    var result = false;
    if (cookie){
        jwt.verify(cookie, process.env.jwtSecret, (err, token) => {
            if (err) {
                console.log("Token not valid");
                result = false;
            } else {
                result = true;
            }
        })
        return result;
    } else {
        console.log("no cookie found");
        return false;
    }
}

async function getUserFromRequest(request){
    let cookie = request.headers.cookie;
    var result;
    if (cookie){
        await jwt.verify(cookie, process.env.jwtSecret, async (err, token) => {
            if (err) {
                console.log("Token not valid");

            } else {
                result = await getUserByID(token.data.id);
            }
        });
        return result;
    } else {
        console.log("no cookie found");
        return false;
    }
}

async function getUserByID(id){
    try {
        const statement = "SELECT * FROM users WHERE id='"+id+"'";
        let users = await mysqlconnection.query(statement);
        return users[0][0];
    } catch (err){
        console.log(err);
    }
}


async function getUserByUsername(username){
    try {
        const statement = "SELECT * FROM users WHERE username='"+username+"'";
        let users = await mysqlconnection.query(statement);
        return users[0];
    } catch (err){
        console.log("error");
    }
}
exports.getUserByUsername = getUserByUsername;

async function login(username, password, callback){
    var users = await getUserByUsername(username);
    if (users.length < 1){
        callback();
    } else {
        var user = users[0];
        var inputhash = await bcrypt.hash(password, user.salt);
        if (inputhash == user.password){
            console.log("Password matches");
            var token = generateToken(user);
            callback(token);
        } else {
            console.log("Password does not match");
            callback();
        }
    }
}


function generateToken(user){
    var data = {
        id: user.id,
        username : user.username
    }
    console.log(data);
    return jwt.sign({ data}, process.env.jwtSecret, { expiresIn: '6h' });
}

function generateLogoutToken(){
    return jwt.sign({}, process.env.jwtSecret, {expiresIn: '0h'});
}

async function signup(username, password, callback){
    var salt = await bcrypt.genSalt(10);
    password = await bcrypt.hash(password, salt);
    console.log("password hashed, length = "+password.length);
    isAdmin = 0;
    var statement = "INSERT INTO users (username, password, salt, isAdmin) VALUES ('"+username+"', '"+password+"', '"+salt+"', '"+isAdmin+"')";
    mysqlconnection.query(statement, function(err){
        if (err) throw err;
        console.log("user added");
        callback();
    })
}

 function getUsers(username, isAdmin, page, callback){
    var statement = "SELECT * FROM users";
    if (username || isAdmin){
        statement += " WHERE ";
        if (username){
            statement += "username = '"+username + "' AND ";
        }
        if (isAdmin){
            statement += " isAdmin = "+isAdmin ;
        }
        if (statement.endsWith("AND ")){
            statement = statement.slice(0, statement.length-4);
        }
    }
    var offset = page * 10;
    statement += " ORDER BY username Limit 10 Offset "+(offset-10);
    console.log(statement);
    mysqlconnection.query(statement, function(err, users){
        if(err) {
            console.log(err);
        }
        callback(users);
    });
}
exports.getUsers = getUsers;


async function getNumOfUsers(username, isAdmin, callback){
    var statement = "SELECT Count(id) FROM users";
    if (username || isAdmin){
        statement += " WHERE ";
        if (username){
            statement += "username = '"+username + "' AND ";
        }
        if (isAdmin){
            statement += " isAdmin = "+isAdmin ;
        }
        if (statement.endsWith("AND ")){
            statement = statement.slice(0, statement.length-4);
        }
    }
    mysqlconnection.query(statement, function(err, count){
        if(err) throw err;
        callback(count[0][ 'Count(id)' ]);
    });
}
exports.getNumOfUsers = getNumOfUsers;


exports.isAuthenticated = isAuthenticated;
exports.login = login;
exports.generateToken = generateToken;
exports.generateLogoutToken = generateLogoutToken;
exports.signup = signup;
exports.getUserFromRequest = getUserFromRequest;
