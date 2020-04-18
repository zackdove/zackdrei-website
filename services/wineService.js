


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
