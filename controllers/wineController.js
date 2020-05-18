let fs = require("fs").promises;
const generalController = require(__basedir+"/controllers/generalController.js");
const { parse } = require('querystring');
const userService = require(__basedir+"/services/userService.js");
const wineService = require(__basedir+"/services/wineService.js");

function handleDeleteWine(request, response){
    if (userService.isAuthenticated(request)){
        if (request.method == "POST"){
            var urlparts = request.url.split("=");
            var wineid = urlparts[1];
            var statement = "DELETE FROM wines WHERE ID=" + mysqlconnection.escape(wineid);
            mysqlconnection.query(statement, function(err, wine){
                if (err) throw err;
                getWineList("/wines",response);
            });
        } else {
            console.log("method must be post");
        }
    } else {
        console.log("user must be authenticated");
    }
}
exports.handleDeleteWine = handleDeleteWine;

async function handleWineList(request, response){
    var template = await fs.readFile(__basedir+"/resources/wineList.html", "utf8");
    if (userService.isAuthenticated(request)){
        var url = request.url;
        var country = "";
        var grape = "";
        var vintage = "";
        var colour = "";
        var producer = "";
        var user = 0;
        var mywines = false;
        if (url.includes == "mywines=on"){
            user = userService.getUserFromRequest(request);
            mywines = true;
        }
        if (url.startsWith("/wines/filter")){
            var urlparts = url.split("&");
            var country = urlparts[0].split("=")[1];
            var grape = urlparts[1].split("=")[1];
            var vintage = urlparts[2].split("=")[1];
            var colour = urlparts[3].split("=")[1];
            var producer = urlparts[4].split("=")[1];
        }
        var currentPString = /page=\d+/gi.exec(url) + '';
        var currentPage = currentPString.split("=")[1];
        if (!currentPage){
            currentPage = 1;
        }
        var wines = await wineService.getWines(country, grape, vintage, colour, producer, user, currentPage, async function(wines){
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
            if (mywines){
                page = page.replace(/\$mywines/gi, "checked='checked'");
            } else {
                page = page.replace(/\$mywines/gi, "");
            }
            var count = await wineService.getNumOfWines(country, grape, vintage, colour, producer, user, function(count){
                pages = Math.ceil(count/10);
                // '' needed to force to be a string

                var paginationString = " ";
                var i;
                url = url.replace(/\&page=\d+/gi, "");
                for (i = 1; i<=pages; i++){
                    if (i == currentPage){
                        paginationString +=  "<a class='active' href='" + url +"&page="+i+"'>"+i+"</a>";
                    } else {
                        paginationString +=  "<a href='" + url +"&page="+i+"'>"+i+"</a>";
                    }
                }
                page = page.replace(/\$pagination/gi, paginationString);
                page = page.replace(/\&/gi, '&amp;');
                generalController.deliver(response, "application/xhtml+xml", page);
            });

        });

    } else {
        console.log("User must be authenticated");
        // redirect to error page
    }
}
exports.handleWineList = handleWineList;

async function handleWine(request, response){
    if (userService.isAuthenticated(request)){
        var urlparts = request.url.split("=");
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
            if (wine[0].NOTES){
                page = page.replace(/\$ifNotes/gi, '');
                page = page.replace(/\$notes/gi, wine[0].NOTES);
                page = page.replace(/\$endIfNotes/gi, '');
            } else {
                console.log("no notes");
                page = page.replace(/\$ifNotes[^]+\$endIfNotes/gi, '');
            }

            generalController.deliver(response, "application/xhtml+xml", page);
        });
    } else {
        console.log("User must be authenticated");
        // redirect to error
    }
}
exports.handleWine = handleWine;

async function handleAddWine(request, response){
    if (userService.isAuthenticated(request)){
        if (request.method=="GET"){
            var page = await fs.readFile(__basedir+"/resources/addWine.html", "utf8");
            generalController.deliver(response, "application/xhtml+xml", page);
        } else if (request.method == "POST"){
            var data = [];
            request.on('data', dataPart => {
                data += dataPart;
            })
            request.on('end', ()=>{
                //Do stuff with data
                data = parse(data);
                wineService.addWine(data.country, data.grape, data.vintage, data.colour, data.producer);
                generalController.redirect(response, "/wines")
            })
        }
    } else {
        console.log("User must be authenticated");
        // redirect to error
    }
}
exports.handleAddWine = handleAddWine;

async function handleGetRandomWineName(request, response){
    let wineName = await wineService.getRandomWineName();
    generalController.deliver(response, "text/plain", wineName);
}
exports.handleGetRandomWineName = handleGetRandomWineName;


async function handleRecommendation(request, response){
    let id = await wineService.getRandomWineID();
    console.log(id);
    console.log("????"+id);
    generalController.redirect(response, "/wine?="+id);
}
exports.handleRecommendation = handleRecommendation;
