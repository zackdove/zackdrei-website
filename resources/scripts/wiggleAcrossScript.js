// Get the id of the <path> element

// Find scroll percentage on scroll (using cross-browser properties), and offset dash same amount as percentage scrolled
// window.addEventListener("scroll", myFunction);
// Took inspo from : https://css-tricks.com/scroll-drawing/ but heavily tweaked
function myFunction() {
    var curve = document.getElementById("curve");
    var column = document.getElementById("column");
    var curveRect = curve.getBoundingClientRect();
    var columnRect = column.getBoundingClientRect();
    var curveTopPercent = 1-(curveRect.top / columnRect.bottom);
    // console.log(triangleTopPercent);
    var start = 0.5;
    var end = 0.9;
    var scrollpercent = (curveTopPercent/(end-start))+(start/(start-end));
    if (scrollpercent <= 0) {
        scrollpercent = 0;
    } else if (scrollpercent >= 1) {
        scrollpercent = 1;
    }
    console.log(scrollpercent);
    var draw = length * scrollpercent;
    // Reverse the drawing (when scrolling upwards)
    // triangle.style.strokeDashoffset = length - draw;
    var textPath = document.getElementById("aboutCurveTextPath");
    textPath.setAttribute("startOffset", (-draw * 4000) + 1200)
}
