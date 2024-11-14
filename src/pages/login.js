import { signIn, getAuthentication } from "../utils/firebase";
import { onAuthStateChanged } from "firebase/auth";

//Start of login DOM initialization
const loginForm = document.querySelector(".login-form");
const loginMessage = document.querySelector('.login-message-container p');
//End of login DOM initialization

//Start of Tutoriowl login functionality
if(loginForm) {
    loginForm.addEventListener("submit", function (event) {
        event.preventDefault();

        const email = loginForm.email.value;
        const password = loginForm.password.value;
        
        signIn(email, password).then((homepage) => {
            window.location.href = homepage;
        });
    });
}
//End of Tutoriowl login functionality

//Listens to authentication state changes
onAuthStateChanged(getAuthentication(), (user) => { 
    if (user) {
        loginMessage.innerHTML = "Welcome";
    } else {
        loginMessage.innerHTML = "Enter login credentials to continue";
    }
});