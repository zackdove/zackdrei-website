original = 0;
var wineid = document.getElementById("wineid").innerHTML;
var xhttp = new XMLHttpRequest();
xhttp.onreadystatechange = function() {
    if (this.readyState == 4 && this.status == 200) {
       original = xhttp.responseText;
       console.log("og rating = "+original);
       starLeave();
    }
};
xhttp.open("GET", "/getRating?"+wineid  , true);
xhttp.send();

function starHover(x){
    var i;
    for (i = 1; i <= x; i++) {
        var star = document.getElementById("star"+i);
        star.classList.add("checked");
    }
    for (i=x+1; i<=5; i++){
        var star = document.getElementById("star"+i);
        star.classList.remove("checked");
    }
}

function starLeave(){
    if (original>0){
        var hovermessage = document.getElementById("hovermessage");
        if (hovermessage){
            hovermessage.parentNode.removeChild(hovermessage);
        }
        var starcontainer = document.getElementById("starContainer");
        if (starcontainer.classList.contains("starContainerHover")){
            starcontainer.classList.remove("starContainerHover");
        }
        for (i = 1; i <= original; i++) {
            var star = document.getElementById("star"+i);
            star.classList.add("checked");
        }
        for (i=Number(original)+1; i<=5; i++){
            console.log("star");
            var star = document.getElementById("star"+i);
            star.classList.remove("checked");
        }
    } else {
        for (i=1; i<=5; i++){
            console.log("star");
            var star = document.getElementById("star"+i);
            star.classList.remove("checked");
        }
    }
}

function starClick(x){
    var wineid = document.getElementById("wineid").innerHTML;
    console.log(wineid);
    var xhttp = new XMLHttpRequest();
    xhttp.onreadystatechange = function() {
        if (this.readyState == 4 && this.status == 200) {
           original = xhttp.responseText;
           console.log("new rating = "+original);
        }
    };
    xhttp.open("POST", "/setRating?"+wineid+"?"+x  , true);
    xhttp.send();
}
