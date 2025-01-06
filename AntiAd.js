// automatically close the p5js ads (hopefully)
// PROBLEM: ad may load after script is complete and dodge the script

console.log("Running Anti Ad Script ...");

document.getElementsByClassName("Banner_close__8VnLH")[0].addEventListener('click', () => {console.log("I have been defeated")});

document.getElementsByClassName("Banner_close__8VnLH")[0].click();