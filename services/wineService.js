


function addWine(country, grape, vintage, colour, producer, notes){
    // this method auto escapes
    mysqlconnection.query("INSERT INTO wines (country, grape, vintage, colour, producer) VALUES (?, ?, ?, ?, ?)", [country, grape, vintage, colour, producer] , function(err){
        if (err) throw err;
        console.log("adding wine");
    });
}
exports.addWine = addWine;
