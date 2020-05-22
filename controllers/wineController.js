let fs = require("fs").promises;
const generalController = require(__basedir+"/controllers/generalController.js");
const { parse } = require('querystring');
const userService = require(__basedir+"/services/userService.js");
const wineService = require(__basedir+"/services/wineService.js");
const userWineService = require(__basedir+"/services/userWineService.js");

function handleDeleteWine(request, response){
    if (userService.isAuthenticated(request)){
        if (request.method == "POST"){
            var urlparts = request.url.split("=");
            var wineid = urlparts[1];
            var statement = "DELETE FROM wines WHERE ID=" + mysqlconnection.escape(wineid);
            mysqlconnection.query(statement, function(err, wine){
                if (err) throw err;
                generalController.redirect(response, "/winedeleted");
            });
        } else {
            console.log("Method must be post");
        }
    } else {
        console.log("User must be authenticated");
        generalController.errorHandler(401, response);
    }
}
exports.handleDeleteWine = handleDeleteWine;

async function handleDeleted(request, response){
    var page = await fs.readFile(__basedir+"/resources/winedeleted.html", "utf8");
    generalController.deliver(response, "application/xhtml+xml", page);
}
exports.handleDeleted = handleDeleted;

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
        if (url.includes("mywines=on")){
            user = await userService.getUserFromRequest(request);
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
        if (currentPage<1){
            generalController.errorHandler(404, response);
        } else {
            var wines = await wineService.getWines(country, grape, vintage, colour, producer, user, currentPage, async function(wines){
                let insertion = " ";
                for(var i=0; i<wines.length; i++){
                    var wine = wines[i];
                    insertion += "<tr><td>"+wine.Country+"</td><td>"+wine.Grape+"</td><td>"+wine.Vintage+"</td><td>"+wine.Colour+"</td><td>"+wine.Producer+"</td><td><button type='button' class='btn-grape infoButton' onclick='document.location = `/wine?="+wine.id+"`'>ⓘ</button></td></tr>";
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
                    if (count>0){
                        pages = Math.ceil(count/10);
                        if (currentPage > pages){
                            generalController.errorHandler(404, response);
                        } else {
                            // " " needed to force to be a string
                            var paginationString = " ";
                            var i;
                            url = url.replace(/\&page=\d+/gi, "");
                            if (currentPage>1){
                                paginationString += "<a href='" + url + "&page="+(1) + "'>←</a>"
                            } else {
                                paginationString += "<a href='#'>←</a>"
                            }
                            var lowerLimit = Number(currentPage)-2;
                            var upperLimit = Number(currentPage)+2;
                            if (lowerLimit<1){
                                lowerLimit = 1;
                                upperLimit = 5;
                            }
                            else if (upperLimit > pages){
                                upperLimit = pages;
                                lowerLimit = pages-5;
                            }
                            for (i = lowerLimit; i<=upperLimit; i++){
                                if (i == currentPage){
                                    paginationString +=  "<a class='active' href='" + url +"&page="+i+"'>"+i+"</a>";
                                } else {
                                    paginationString +=  "<a href='" + url +"&page="+i+"'>"+i+"</a>";
                                }
                            }
                            if (currentPage<pages){
                                paginationString += "<a href='" + url + "&page="+pages + "'>→</a>"
                            } else {
                                paginationString += "<a href='#'>→</a>"
                            }
                            page = page.replace(/\$pagination/gi, paginationString);
                            page = page.replace(/\&/gi, '&amp;');
                            page = page.replace(/\$ifWines/gi, '');
                            page = page.replace(/\$endIfWines/gi, '');
                            generalController.deliver(response, "application/xhtml+xml", page);
                        }
                    } else {
                        // remove it all
                        page = page.replace(/\$ifWines[^]+\$endIfWines/gi, 'No Wines Found.');
                        generalController.deliver(response, "application/xhtml+xml", page);
                    }

                });

            });
        }
    } else {
        console.log("User must be authenticated");
        generalController.errorHandler(401, response);
    }
}
exports.handleWineList = handleWineList;

async function handleWine(request, response){
    if (userService.isAuthenticated(request)){
        var urlparts = request.url.split("=");
        var wineid = urlparts[1];
        //this version of mysql prevents escaping by default
        var template = await fs.readFile(__basedir+"/resources/wine.html", "utf8");
        var statement = "SELECT * FROM wines WHERE ID=" + mysqlconnection.escape(wineid);
        var user = await userService.getUserFromRequest(request);
        mysqlconnection.query(statement, async function(err, result){
            if (err) throw err;
            if (result.length==1){
                let wine = result[0];
                var page = template.replace(/\$id/gi, wine.id);
                var page = page.replace(/\$country/gi, wine.Country);
                var page = page.replace(/\$grape/gi, wine.Grape);
                var page = page.replace(/\$vintage/gi, wine.Vintage);
                var page = page.replace(/\$colour/gi, wine.Colour);
                var page = page.replace(/\$producer/gi, wine.Producer);
                userWineService.getUserWine(user.id, wineid, function(result){
                    console.log(result);
                });
                generalController.deliver(response, "application/xhtml+xml", page);
            } else {
                var page = await fs.readFile(__basedir+"/resources/winenotfound.html", "utf8");
                generalController.deliver(response, "application/xhtml+xml", page);
            }
        });
    } else {
        console.log("User must be authenticated");
        generalController.errorHandler(401, response);
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
                data = parse(data);
                wineService.addWine(data.country, data.grape, data.vintage, data.colour, data.producer);
                generalController.redirect(response, "/wineAdded");
            })
        }
    } else {
        console.log("User must be authenticated");
        generalController.errorHandler(401, response);
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
    if (id){
        generalController.redirect(response, "/wine?="+id);
    } else {
        generalController.errorHandler(500, response);
    }

}
exports.handleRecommendation = handleRecommendation;

async function handleWineAdded(request, response){
    var page = await fs.readFile(__basedir+"/resources/wineadded.html", "utf8");
    generalController.deliver(response, "application/xhtml+xml", page);
}
exports.handleWineAdded = handleWineAdded;
