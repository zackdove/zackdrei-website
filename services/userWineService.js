


function addToMyWines(userid, wineid, type){
    var statement = "INSERT INTO userWines (userID, wineID, type) VALUES ("+userid+", "+wineid+", '"+type+"')";
    console.log(statement);
    mysqlconnection.query(statement, function(err){
        if (err) throw err;
        console.log("wine add to user's wines");
    })

}
exports.addToMyWines = addToMyWines;
