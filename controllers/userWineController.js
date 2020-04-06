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
        await userWineService.addToMyWines(user.id, wineid, type);
        console.log(urlparts);
        generalController.redirect(response, "/wines");
    } else {
        console.log("method must be post");
    }
}

exports.handleAddToMyWines = handleAddToMyWines;
