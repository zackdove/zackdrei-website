function starHover(x){
    var i;
    for (i = 1; i <= x; i++) {
        var star = document.getElementById("star"+i);
        star.style.color="yellow"
    }
    for (i=x+1; i<=5; i++){
        var star = document.getElementById("star"+i);
        star.style.color="grey"
    }
}
original = 3;
function starLeave(){
    for (i = 1; i <= original; i++) {
        var star = document.getElementById("star"+i);
        star.style.color="yellow"
    }
    for (i=original+1; i<=5; i++){
        var star = document.getElementById("star"+i);
        star.style.color="grey"
    }
}
