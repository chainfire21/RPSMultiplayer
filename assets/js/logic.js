// Initialize Firebase
var config = {
    apiKey: "AIzaSyABRIp7LjeREZRFr7uePuaFoxfESixqMcI",
    authDomain: "rock-paper-scissors-37511.firebaseapp.com",
    databaseURL: "https://rock-paper-scissors-37511.firebaseio.com",
    projectId: "rock-paper-scissors-37511",
    storageBucket: "rock-paper-scissors-37511.appspot.com",
    messagingSenderId: "722295220454"
};
firebase.initializeApp(config);
const database = firebase.database();

$(document).ready(function () {

    $("body").on("click", ".p1", function (e) {
        console.log($(this).text());
        $("#p1-choice").text($(this).text());
        database.ref("/players/playerOne").set({
            choice: $(this).text(),
        });

    });
    $("body").on("click", ".p2", function (e) {
        console.log($(this).text());
        $("#p2-choice").text($(this).text());
        database.ref("/players/playerTwo").set({
            choice: $(this).text(),
        });
    });

    database.ref("/players/playerOne").on("value", function (snapshot) {
        console.log(snapshot.val());
    });
    database.ref("/players/playerTwo").on("value", function (snapshot) {
        console.log(snapshot.val());
    });

});