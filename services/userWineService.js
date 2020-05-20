


function addToMyWines(userid, wineid, rating, callback){
    var statement = "INSERT INTO userWines (userID, wineID, rating) VALUES ("+userid+", "+wineid+", '"+rating+"')";
    console.log(statement);
    mysqlconnection.query(statement, function(err){
        if (err) throw err;
        console.log("wine add to user's wines");
        callback();
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

function setRating(userid, wineid, rating, callback){
    getUserWine(userid, wineid, function(result){
        if (result>0){
            var statement = "UPDATE userWines SET rating="+rating+" WHERE userID ="+userid+" AND wineID =" + wineid;
            mysqlconnection.query(statement, function(err){
                if (err) throw err;
                console.log("rating set");
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
