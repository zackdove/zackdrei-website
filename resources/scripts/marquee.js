function addNewMovingElement() {
    var marquee = document.createElement("div");
    marquee.setAttribute('class', 'marquee');
    var text = document.createElement("p");
    // text.innerHTML = "Arpeggio Nerello Mascalese";
    var xhttp = new XMLHttpRequest();
    xhttp.onreadystatechange = function() {
        if (this.readyState == 4 && this.status == 200) {
           text.innerHTML = xhttp.responseText;
        }
    };
    xhttp.open("GET", "/getRandomWineName", true);
    xhttp.send();

    var randomHeight = Math.floor(Math.random() * 91);
    text.style.top = randomHeight.toString() + "%";
    //Speed, size and opacity should all be correlated
    var rand = Math.random();
    var randomSpeed = 6 + Math.floor(Math.random() * 12);
    var randomSize = 6 + Math.floor(Math.random() * 30);
    var randomOpacity = 0.1 + (Math.random() * 0.9);
    text.style.animation = "marquee " + randomSpeed + "s linear 2";
    text.style.fontSize = randomSize + "pt";
    text.style.opacity = randomOpacity;
    marquee.appendChild(text);
    var row = document.getElementById("marquee-row");
    row.appendChild(marquee);
    // setTimeout(deleteElement(marquee) , 2000);
    setTimeout(function() {
        marquee.remove();
    }, randomSpeed*1000*2);
}
setInterval(addNewMovingElement, 1303);
