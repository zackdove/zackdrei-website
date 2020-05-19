


function addToMyWines(userid, wineid, rating){
    var statement = "INSERT INTO userWines (userID, wineID, rating) VALUES ("+userid+", "+wineid+", '"+rating+"')";
    console.log(statement);
    mysqlconnection.query(statement, function(err){
        if (err) throw err;
        console.log("wine add to user's wines");
    })

}
exports.addToMyWines = addToMyWines;


function getUserWine(userid, wineid, callback){
    var statement = "SELECT * FROM userWines WHERE userID ="+userid+" AND wineID =" + wineid;
    mysqlconnection.query(statement, function(err, result){
        if (err) throw err;
        if (result.length>=1){
            console.log(result[0].rating);
            callback(result[0].rating);
        } else {
            console.log("user does not have this wine");
            callback(0);
        }

    });
}
exports.getUserWine = getUserWine;
