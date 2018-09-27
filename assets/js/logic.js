// Initialize Firebase
const config = {
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
    // -------------------------------------------------------------- (CRITICAL - BLOCK) --------------------------- //
    // connectionsRef references a specific location in our database.
    // All of our connections will be stored in this directory.
    const connectionsRef = database.ref("/connections");

    // '.info/connected' is a special location provided by Firebase that is updated every time
    // the client's connection state changes.
    // '.info/connected' is a boolean value, true if the client is connected and false if they are not.
    const connectedRef = database.ref(".info/connected");

    const userCon = [];
    // When the client's connection state changes...
    connectedRef.on("value", function (snap) {

        // If they are connected..
        if (snap.val()) {

            // Add user to the connections list.
            const con = connectionsRef.push(true);
            userCon.push(con.path.pieces_[1]);
            // Remove user from the connection list when they disconnect.
            con.onDisconnect().remove();

        }
    });

    // When first loaded or when the connections list changes...
    connectionsRef.on("value", function (snap) {

        // Display the viewer count in the html.
        // The number of online users is the number of children in the connections list.
        //$("#watchers").text(snap.numChildren());
    });
    // -------------------------------------------------------------- (CRITICAL - BLOCK) --------------------------- //
    const player = {
        name: "",
        choice: "",
        type: "",
    }
    $("form").submit(function (e) {
        e.preventDefault();
        //set the connection with the name of the user
        database.ref(`/connections/${userCon[0]}`).set({
            name: $("#name-input").val(),
        });

        database.ref("/connections").on("value", function (snapshot) {
            //make sure this logic is only done on creation of a player
            if (player.name === "") {
                //check to see if player one exists
                database.ref().child("playerOne").once("value", snapshot => {
                    if (snapshot.exists()) {
                        console.log("player one snapshot here");

                        //check gto see if player two exists
                        database.ref().child("playerTwo").once("value", snapshot => {
                            if (snapshot.exists()) {
                                console.log("player two snapshot here");
                                player.name = $("#name-input").val();
                                player.type = "guest";

                            }
                            //no player two, make it
                            else {
                                console.log("no player two");
                                $("#btnsP2").removeClass("d-none").addClass("d-flex");
                                $("#waitingP2").addClass("d-none");
                                player.name = $("#name-input").val();
                                player.type = "two";
                                database.ref("/connections/playerTwo").set(true);
                                database.ref(`/connections/${userCon[0]}`).set(player);
                                database.ref("playerOne").set(true);
                            }
                        });
                    }
                    //no players, make player one
                    else {
                        console.log("no player one");
                        $("#btnsP1").removeClass("d-none").addClass("d-flex");
                        $("#waitingP1").addClass("d-none");
                        player.name = $("#name-input").val();
                        player.type = "one";
                        database.ref("/connections/playerOne").set(true);
                        database.ref(`/connections/${userCon[0]}`).set(player);
                        database.ref("playerOne").set(true);
                    }
                });
            }

        });
    })

    $("body").on("click", ".p1", function (e) {
        console.log($(this).text());
        $("#p1-choice").text($(this).text());
        database.ref("playerOne").set({
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