function addToMyWines(userid, wineid, rating, callback){
    var statement = "INSERT INTO userWines (userID, wineID, rating) VALUES ("+userid+", "+wineid+", '"+rating+"')";
    mysqlconnection.query(statement, function(err){
        if (err) throw err;
        callback();
    })

}
exports.addToMyWines = addToMyWines;


function getUserWine(userid, wineid, callback){
    var statement = "SELECT * FROM userWines WHERE userID ="+userid+" AND wineID =" + wineid;
    mysqlconnection.query(statement, function(err, result){
        if (err) throw err;
        if (result.length>=1){
            callback(result[0].rating);
        } else {
            console.log("User does not have this wine");
            callback(0);
        }

    });
}
exports.getUserWine = getUserWine;

function setRating(userid, wineid, rating, callback){
    getUserWine(userid, wineid, function(result){
        if (result>0){
            var statement = "UPDATE userWines SET rating="+rating+" WHERE userID ="+userid+" AND wineID =" + wineid;
            mysqlconnection.query(statement, function(err){
                if (err) throw err;
                callback(rating);
            })
        } else {
            addToMyWines(userid, wineid, rating, function(result){
                callback(rating);
            });
        }
    });
}
exports.setRating = setRating;
