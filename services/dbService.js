

// function hello(a){
//     console.log("HELLO");
// }

function initialiseDB(){
    const mysql = require('mysql2/promise');
    const mysqlconnection = mysql.createPool({
        host: "localhost",
        user: "root",
        password: "ilovewine",
        database: "grape"
    });
    const statement1 = "CREATE DATABASE IF NOT EXISTS grape;"
    const statement2 = " CREATE TABLE IF NOT EXISTS users (id INTEGER PRIMARY KEY AUTO_INCREMENT, username VARCHAR(50), password VARCHAR(60), salt VARCHAR(60), isAdmin BOOL);"
    const statement3 = " CREATE TABLE IF NOT EXISTS wines (id INTEGER PRIMARY KEY,Country VARCHAR(50),Grape VARCHAR(50),Vintage VARCHAR(50),Colour VARCHAR(50),Producer VARCHAR(50),NOTES TEXT);"
    mysqlconnection.query(statement1 , function(err){
        if (err) throw err;
        mysqlconnection.query(statement2 , function(err){
            if (err) throw err;
            mysqlconnection.query(statement3 , function(err){
                if (err) throw err;
                console.log("database initialised");
            });
        });
    });
    return mysqlconnection;
}

exports.initialiseDB = initialiseDB;
