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
        type: "guest",
    }

    const state = [""];

    $("form").submit(function (e) {
        e.preventDefault();
        player.name = $("#name-input").val();
        $("#form-name")[0].reset();
        //set the connection with the name of the user
        database.ref(`/connections/${userCon[0]}`).set(player);

    });

    //listen for player one to click rock paper or scissors
    $("body").on("click", ".p1", function (e) {
        console.log($(this).text());
        $("#p1-choice").text($(this).text());
        player.choice = $(this).text();
        database.ref(`/connections/${userCon[0]}`).set(player);
        //send the choice to the database
        database.ref(`/choices/p1Choice`).set({ p1choice: player.choice });
    });

    //listen for player two to click rock paper or scissors
    $("body").on("click", ".p2", function (e) {
        console.log($(this).text());
        $("#p2-choice").text($(this).text());
        player.choice = $(this).text();
        database.ref(`/connections/${userCon[0]}`).set(player);
        //send the choice to the database
        database.ref(`/choices/p2Choice`).set({ p2choice: player.choice });
    });

    database.ref("/choices").on("value", function (snap) {
        console.log("choices updated");
        if(snap.hasChild("p1Choice")&&snap.hasChild("p2Choice")){
            gameLogic(snap.val().p1Choice.p1choice,snap.val().p2Choice.p2choice);
            removeChoices();
        }
    });

    //when a connection is lost or gained
    database.ref("/connections").on("value", function (snap) {
        //call function to see what players are connected, p1, p2, both, or just p2, or none
        stateOfPlayers();
        switch (state[0]) {
            //only p1, so make new person p2
            case "p1":
                console.log("no player two");
                $("#btnsP2").removeClass("d-none").addClass("d-flex");
                $("#waitingP2").addClass("d-none");
                player.type = "two";
                database.ref(`/connections/${userCon[0]}`).set(player);
                break;
            //both p1 and p2 exist, person stays as a guest type but has name now
            case "p1p2":
                console.log("player two snapshot here");
                player.type = "guest";
                database.ref(`/connections/${userCon[0]}`).set(player);
                break;
            //only p2 connected, shift guest to p1
            case "p2":
                console.log("no player one but there is player 2");
                $("#btnsP1").removeClass("d-none").addClass("d-flex");
                $("#waitingP1").addClass("d-none");
                player.type = "one";
                database.ref(`/connections/${userCon[0]}`).set(player);
                break;
            //no players, make them p1
            case "noPs":
                console.log("no player one");
                $("#btnsP1").removeClass("d-none").addClass("d-flex");
                $("#waitingP1").addClass("d-none");
                $("#p2-display").text("Waiting for opponent");
                player.type = "one";
                database.ref(`/connections/${userCon[0]}`).set(player);
                break;
        }
    });

    function stateOfPlayers() {
        state[0] = "";
        if (player.type === "guest" && player.name !== "") {
            state[0] = "noPs";
            database.ref().child("connections").orderByChild("type").equalTo("one").once("value", function (snapshot) {
                if (snapshot.exists()) {
                    state[0] = "p1";
                }
            });
            database.ref().child("connections").orderByChild("type").equalTo("two").once("value", function (snapshot) {
                if (snapshot.exists()) {
                    if (state[0] === "p1") {
                        state[0] = "p1p2";
                    }
                    else {
                        state[0] = "p2";
                    }
                }
            });
        }
    }

    function gameLogic(p1, p2) {
        switch (p1) {
            case "Rock":
                if (p2 === "Rock") {
                    console.log("tie");
                }
                if (p2 === "Paper") {
                    console.log("p2 wins");
                }
                if (p2 === "Scissors") {
                    console.log("p1 wins")
                }
                break;
            case "Paper":
                if (p2 === "Rock") {
                    console.log("p1 wins");
                }
                if (p2 === "Paper") {
                    console.log("tie");
                }
                if (p2 === "Scissors") {
                    console.log("p2 wins")
                }
                break;
            case "Scissors":
                if (p2 === "Rock") {
                    console.log("p2 wins");
                }
                if (p2 === "Paper") {
                    console.log("p1 wins");
                }
                if (p2 === "Scissors") {
                    console.log("tie")
                }
                break;
        }
    }

    function removeChoices(){
        database.ref("/choices").remove();
    }
});