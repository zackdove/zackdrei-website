let fs = require("fs").promises;
const generalController = require(__basedir+"/controllers/generalController.js");
const { parse } = require('querystring');

function deleteWine(url, response){
    var urlparts = url.split("=");
    var wineid = urlparts[1];
    var statement = "DELETE FROM wines WHERE ID=" + mysqlconnection.escape(wineid);
    mysqlconnection.query(statement, function(err, wine){
        if (err) throw err;
        getWineList("/wines",response);
    });
}
exports.deleteWine = deleteWine;

async function getWineList(url, response){
    var country = "";
    var grape = "";
    var vintage = "";
    var colour = "";
    var producer = "";
    var statement = "SELECT * FROM wines";
    if (url.startsWith("/wines/filter")){
        var urlparts = url.split("&");
        var country = urlparts[0].split("=")[1];
        var grape = urlparts[1].split("=")[1];
        var vintage = urlparts[2].split("=")[1];
        var colour = urlparts[3].split("=")[1];
        var producer = urlparts[4].split("=")[1];
        if (country != "" || grape != "" || vintage!=""||colour!=""||producer!=""){
            var statement = "SELECT * FROM wines WHERE ";
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
    }
    console.log(statement);
    var template = await fs.readFile(__basedir+"/resources/wineList.html", "utf8");
    mysqlconnection.query(statement, function(err, wines){
        if(err) throw err;
        //the +'' is needed to set template to a string
        // parts = template.split("$");
        let insertion = " ";
        for(var i=0; i<wines.length; i++){
            var wine = wines[i];
            insertion += "<tr><td>"+wine.Country+"</td><td>"+wine.Grape+"</td><td>"+wine.Vintage+"</td><td>"+wine.Colour+"</td><td>"+wine.Producer+"</td><td><button type='button' class='btn2 btn-grape infoButton' onclick='document.location = `/wine?="+wine.id+"`'>ⓘ</button></td></tr>";
        }
        // var page = parts[0] + html + parts[1];
        var page = template.replace(/\$wines/gi, insertion);
        var page = page.replace(/\$country/gi, country);
        var page = page.replace(/\$grape/gi, grape);
        var page = page.replace(/\$vintage/gi, vintage);
        var page = page.replace(/\$colour/gi, colour);
        var page = page.replace(/\$producer/gi, producer);
        generalController.deliver(response, "application/xhtml+xml", page);
    });
}
exports.getWineList = getWineList;

async function getWine(url, response){
    var urlparts = url.split("=");
    var wineid = urlparts[1];
    //mysql prevents escaping by default
    var template = await fs.readFile(__basedir+"/resources/wine.html", "utf8");
    var statement = "SELECT * FROM wines WHERE ID=" + mysqlconnection.escape(wineid);
    mysqlconnection.query(statement, function(err, wine){
        if (err) throw err;
        var page = template.replace(/\$id/gi, wine[0].id);
        var page = page.replace(/\$country/gi, wine[0].Country);
        var page = page.replace(/\$grape/gi, wine[0].Grape);
        var page = page.replace(/\$vintage/gi, wine[0].Vintage);
        var page = page.replace(/\$colour/gi, wine[0].Colour);
        var page = page.replace(/\$producer/gi, wine[0].Producer);
        var page = page.replace(/\$notes/gi, wine[0].NOTES);
        generalController.deliver(response, "application/xhtml+xml", page);
    });
}
exports.getWine = getWine;

async function getAddWine(response){
    var page = await fs.readFile(__basedir+"/resources/addWine.html", "utf8");
    generalController.deliver(response, "application/xhtml+xml", page);
}
exports.getAddWine = getAddWine;

async function postAddWine(request, response){
    var data = [];
    request.on('data', dataPart => {
        data += dataPart;
    })
    request.on('end', ()=>{
        //Do stuff with data
        data = parse(data);
        console.log(data.country);
        //what about ID
        var statement = "INSERT INTO wines (country, grape, vintage, colour, producer) VALUES ('";
        statement += data.country + "', '";
        statement += data.grape+ "', '";
        statement += data.vintage+"', '";
        statement += data.colour+"', '";
        statement += data.producer+"')"
        console.log(statement);
        mysqlconnection.query(statement, function(err){
            if (err) throw err;
            getWineList("/wines",response);
        });
    })

    // var country = await request.body.country;

}
exports.postAddWine = postAddWine;
