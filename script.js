const user_device = test_user() ? 1 : -1;;

// run script to add parallax to the background
document.addEventListener('scroll', () => {
    const parallax = document.querySelector('.parallax');
    let scrollPosition = window.pageYOffset;
    parallax.style.backgroundPositionY = `${scrollPosition * 0.2 * user_device}px`;
});

// innitilize the dynamic height
window.addEventListener('resize', () => set_padding_height());

function test_user(){
    const isMobile = /iPhone|iPad|iPod|Android/i.test(navigator.userAgent);

    if (isMobile) {
        console.log("User is on a mobile device");
    } else {
        console.log("User is on a desktop device");
    }
}

function set_padding_height(){
    const header = document.querySelector('.header');
    const welcome = document.getElementById('introduction');
    let header_height = header.offsetHeight;
    welcome.style.paddingTop = `${header_height}px`;
}

// script here just for when i need to do animation scripting
function main() {
    requestAnimationFrame(main);
}

set_padding_height();
// main();