const server = require("../server.js");

function initialiseDB(){
    console.log(server.config);
    const mysql = require('mysql2/promise');

    const mysqlconnection = mysql.createPool({
        host: "localhost",
        user: "root",
        password: process.env.dbPassword,
        database: "grape"
    });
    const statement1 = "CREATE DATABASE IF NOT EXISTS grape;"
    const statement2 = "CREATE TABLE IF NOT EXISTS users (id INTEGER PRIMARY KEY AUTO_INCREMENT, username VARCHAR(50) NOT NULL, password VARCHAR(60) NOT NULL, salt VARCHAR(60) NOT NULL, isAdmin BOOL NOT NULL);"
    const statement3 = "CREATE TABLE IF NOT EXISTS wines (id INTEGER PRIMARY KEY AUTO_INCREMENT, Country VARCHAR(50) NOT NULL,Grape VARCHAR(50) NOT NULL,Vintage VARCHAR(50) NOT NULL,Colour VARCHAR(50) NOT NULL,Producer VARCHAR(50) NOT NULL);"
    const statement4 = "CREATE TABLE IF NOT EXISTS userWines (userID INTEGER REFERENCES users (id), wineID INTEGER REFERENCES wines (id), rating INTEGER NOT NULL, PRIMARY KEY(userID, wineID))"
    mysqlconnection.query(statement1 , function(err){
        if (err) throw err;
        mysqlconnection.query(statement2 , function(err){
            if (err) throw err;
            mysqlconnection.query(statement3 , function(err){
                if (err) throw err;
                mysqlconnection.query(statement4 , function(err){
                    if (err) throw err;
                    console.log("Database initialised");
                });
            });
        });
    });
    return mysqlconnection;
}

exports.initialiseDB = initialiseDB;
