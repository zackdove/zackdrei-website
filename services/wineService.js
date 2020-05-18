
function addWine(country, grape, vintage, colour, producer, notes){
    // this method auto escapes
    mysqlconnection.query("INSERT INTO wines (country, grape, vintage, colour, producer) VALUES (?, ?, ?, ?, ?)", [country, grape, vintage, colour, producer] , function(err){
        if (err) throw err;
        console.log("adding wine");
    });
}
exports.addWine = addWine;

async function getRandomWine(){
    try {
        const statement = "SELECT * FROM wines ORDER BY RAND() LIMIT 1";
        const wines = await mysqlconnection.query(statement);
        // console.log(wines[0][0]);
        // console.log(wines[0][0].Grape);
        return wines[0][0];
    } catch (err){
        console.log("error");
        //handle it
    }
}
exports.getRandomWine = getRandomWine;

async function getRandomWineName(){
    let wine = await getRandomWine();
    let name = wine.Grape;
    return name;
}
exports.getRandomWineName = getRandomWineName;

async function getRandomWineID(){
    let wine = await getRandomWine();
    let id = wine.id;
    return id;
}
exports.getRandomWineID = getRandomWineID;

async function getWines(country, grape, vintage, colour, producer, user, page, callback){
    var statement = "SELECT * FROM wines";
    if (user){
        console.log("my wine true");
        statement = statement + " LEFT JOIN userWines ON wines.id = userWines.wineID WHERE userWines.userID="+user.id;
    }
    if (country != "" || grape != "" || vintage!=""||colour!=""||producer!=""){
        if (statement.includes("WHERE")){
            statement = statement+" AND ";
        } else {
            statement = statement+ " WHERE ";
        }
        if (country!=""){
            statement+="Country='"+country+"' AND ";
        }
        if (grape!=""){
            statement+="Grape='"+grape+"' AND ";
        }
        if (vintage!=""){
            statement+="Vintage='"+vintage+"' AND ";
        }
        if (colour!=""){
            statement+="Colour='"+colour+"' AND ";
        }
        if (producer!=""){
            statement+="Producer='"+producer+"'";
        }
        if (statement.endsWith("AND ")){
            statement = statement.slice(0, statement.length-4);
        }
    }
    var offset = page * 10;
    statement += " ORDER BY Grape Limit 10 Offset "+(offset-10);
    console.log(statement);
    mysqlconnection.query(statement, function(err, wines){
        if(err) {
            console.log(err);
        }
        callback(wines);
    });
}
exports.getWines = getWines;

async function getNumOfWines(country, grape, vintage, colour, producer, user, callback){
    var statement = "SELECT COUNT(Country) FROM wines";
    if (user){
        console.log("my wine true");
        statement = statement + " LEFT JOIN userWines ON wines.id = userWines.wineID WHERE userWines.userID="+user.id;
    }
    if (country != "" || grape != "" || vintage!=""||colour!=""||producer!=""){
        if (statement.includes("WHERE")){
            statement = statement+" AND ";
        } else {
            statement = statement+ " WHERE ";
        }
        if (country!=""){
            statement+="Country='"+country+"' AND ";
        }
        if (grape!=""){
            statement+="Grape='"+grape+"' AND ";
        }
        if (vintage!=""){
            statement+="Vintage='"+vintage+"' AND ";
        }
        if (colour!=""){
            statement+="Colour='"+colour+"' AND ";
        }
        if (producer!=""){
            statement+="Producer='"+producer+"'";
        }
        if (statement.endsWith("AND ")){
            statement = statement.slice(0, statement.length-4);
        }
    }
    mysqlconnection.query(statement, function(err, count){
        if(err) throw err;
        // console.log(Object.values(count));
        // console.log(count);
        // console.log(count[0]);
        // console.log(Object.values(count[0]));
        // console.log(Object.keys(count[0]));
        // console.log(count[0][ 'COUNT(Country)' ])
        // console.log(count[0][0]);
        // console.log(count['COUNT(Country)']);
        callback(count[0][ 'COUNT(Country)' ]);
    });
}
exports.getNumOfWines = getNumOfWines;
