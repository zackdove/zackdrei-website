function addWine(country, grape, vintage, colour, producer){
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
        return wines[0][0];
    } catch (err){
        console.log("error");
    }
}
exports.getRandomWine = getRandomWine;

async function getRandomWineName(){
    let wine = await getRandomWine();
    if (wine){
        let r = Math.random();
        if (r>0.45){
            return wine.Grape;
        } else if (r>0.10){
            return wine.Producer;
        } else {
            return wine.Country;
        }

    } else {
        return "";
    }
}
exports.getRandomWineName = getRandomWineName;

async function getRandomWineID(){
    let wine = await getRandomWine();
    if (wine){
        return wine.id;
    } else {
        return 0;
    }
}
exports.getRandomWineID = getRandomWineID;

async function getWines(country, grape, vintage, colour, producer, user, page, callback){
    var statement = "SELECT * FROM wines";
    if (user){
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
    statement += " ORDER BY id Limit 10 Offset "+(offset-10);
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
        callback(count[0][ 'COUNT(Country)' ]);
    });
}
exports.getNumOfWines = getNumOfWines;

function addLotsOfWines(){
    // addWine(country, grape, vintage, colour, producer)
    addWine("Argentina", "Merlot", 2016, "Red", "006");
    addWine("Argentina", "Pinot Noir", 2016, "Red", "006");
    addWine("Italy", "Montefalco Rosso", 2015, "Red", "Adanti");
    addWine("Chile", "Merlot", 2017, "Red", "Adobe Reserva");
    addWine("Italy", "Barbera d’Asti Bricco Blina", 2016, "Red", "Agostino Pavia and Figli");
    addWine("Italy", "Barrua", 2014, "Red", "Agricola Punica");
    addWine("Romania", "Feteasca Regala", 2016, "White", "Alamina");
    addWine("Italy", "Barbera", 2018, "Red", "Alasia");
    addWine("Italy", "Rosso di Rocca", 2018, "Red", "Langhe Nebbiolo");
    addWine("Australia", "Semillon Viognier", 2016, "White", "Alpha Box and Dice");
    addWine("Italy", "Icona Cabernet Sauvignon", 2015, "Red", "Alpha Box and Dice,");
    addWine("Portugal", "Port", 2017, "Red", "Nieport");
    addWine("Portugal", "Verdelho", 1992, "White", "Barbeito");
    addWine("Italy", "Riserva", 1992, "Red", "Oddero, Barolo, Vignarionda");
    addWine("France", "Glos des Goisses", 2013, "White", "Philiponnat");
    addWine("Portugal", "Meao", 2012, "Red", "Quinta do Vale");


}
exports.addLotsOfWines = addLotsOfWines;






//
