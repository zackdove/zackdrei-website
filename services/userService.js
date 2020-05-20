const jwtSecret = 'supersecret';
let jwt = require("jsonwebtoken");
const bcrypt = require("bcrypt");
const userController = require(__basedir+"/controllers/userController.js");

function isAuthenticated(request){
    let cookie = request.headers.cookie;
    // console.log(cookie);
    var result = false;
    if (cookie){
        jwt.verify(cookie, jwtSecret, (err, token) => {
            if (err) {
                // console.log("token not valid");
                result = false;
            } else {
                // console.log("token is valid");
                result = true;
            }
        })
        //Needed outside otherwise doesnt return anything
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
        await jwt.verify(cookie, jwtSecret, async (err, token) => {
            if (err) {
                console.log("token not valid");

            } else {
                result =await getUserByID(token.data.id);
            }
        })
        // console.log(result);
        //Needed outside otherwise doesnt return anything
        console.log("hmmm"+result.id);
        return result;
    } else {
        console.log("no cookie found");
        return false;
    }
}

async function getUserByID(id){
    try {
        const statement = "SELECT * FROM users WHERE id='"+id+"'";
        // console.log(statement);
        let users = await mysqlconnection.query(statement);
        console.log("users length in mysql="+users.length);
        //[1] is for meta data
        return users[0][0];
    } catch (err){
        console.log("error");
        //handle it
    }
}


async function getUserByUsername(username){
    try {
        const statement = "SELECT * FROM users WHERE username='"+username+"'";
        // console.log(statement);
        let users = await mysqlconnection.query(statement);
        console.log("users length in mysql="+users.length);
        //[1] is for meta data
        // console.log(users);
        console.log("length1 = "+users[0].length);
        return users[0];
    } catch (err){
        console.log("error");
        //handle it
    }
}
exports.getUserByUsername = getUserByUsername;

async function login(username, password, callback){
    console.log(username, password);
    var users = await getUserByUsername(username);
    console.log("users here="+users.length);
    if (users.length < 1){
        console.log("username not found");
        callback();
    } else {
        console.log("user found"+users);
        //check password
        //this password should already be hashed, so we'd need to hash the input password
        var user = users[0];
        console.log("user="+user.username);
        var inputhash = await bcrypt.hash(password, user.salt);
        if (inputhash == user.password){
            console.log("password matches");
            var token = generateToken(user);
            callback(token);
        } else {
            console.log("password does not match");
            callback();
        }
    }

    // use rows . length
}


function generateToken(user){
    var data = {
        id: user.id,
        username : user.username
    }
    console.log(data);
    return jwt.sign({ data}, jwtSecret, { expiresIn: '6h' });
}

function generateLogoutToken(){
    return jwt.sign({}, jwtSecret, {expiresIn: '0h'});
}

async function signup(username, password, callback){
    //hash the pwd
    var salt = await bcrypt.genSalt(10);
    password = await bcrypt.hash(password, salt);
    console.log("password hashed, length = "+password.length);
    isAdmin = 1;
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
        // console.log(users);
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
    console.log(statement);
    mysqlconnection.query(statement, function(err, count){
        if(err) throw err;
        console.log(count);
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
