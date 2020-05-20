const fs = require("fs").promises;
const userService = require(__basedir+"/services/userService.js");
const generalController = require(__basedir+"/controllers/generalController.js");
const userWineService = require(__basedir+"/services/userWineService.js");

async function handleAddToMyWines(request, response){
    if (request.method == 'POST'){
        var user = await userService.getUserFromRequest(request);
        console.log("user="+user.id);
        var urlparts = request.url.split("?");
        var wineid = urlparts[1];
        var type = urlparts[2];
        await userWineService.addToMyWines(user.id, wineid, 5);
        console.log(urlparts);
        generalController.redirect(response, "/wines");
    } else {
        console.log("method must be post");
    }
}

exports.handleAddToMyWines = handleAddToMyWines;

async function handleStarRating(request, response){
    var user = await userService.getUserFromRequest(request);
    var urlparts = request.url.split("?");
    var wineid = urlparts[1];
    if (request.method == 'GET'){
        userWineService.getUserWine(user.id, wineid, function(rating){
            console.log(rating);
            generalController.deliver(response, "text/plain", rating);
        });
    } else if (request.method == 'POST'){
        var rating = urlparts[2];
        console.log("rating = "+rating);
        userWineService.setRating(user.id, wineid, rating, function(rating){
            generalController.deliver(response, "text/plain", rating);
        });
    }
}
exports.handleStarRating = handleStarRating;

async function getRating(request, response){
    var user = await userService.getUserFromRequest(request);
    var urlparts = request.url.split("?");
    var wineid = urlparts[1];
    if (request.method == 'GET'){
        userWineService.getUserWine(user.id, wineid, function(rating){
            console.log(rating);
            generalController.deliver(response, "text/plain", (rating+''));
        });
    }
}
exports.getRating = getRating;
