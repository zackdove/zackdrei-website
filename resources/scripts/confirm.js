function confirm(target){
    var r = confirm("Are you sure? This cannot be undone.");
    if (r){
        window.location.href = target;
    }
}
