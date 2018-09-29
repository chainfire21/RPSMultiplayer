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
    const scores = {
        P1wins: 0,
        P2wins: 0,
        tie: 0,
    }

    const state = [""];

    $("form").submit(function (e) {
        e.preventDefault();
        player.name = $("#name-input").val();
        $("#form-name")[0].reset();
        $("#player-name").text(player.name);
        $("#inputted-name").removeClass("d-none");
        $("#form-name").addClass("d-none");
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

    //listen for a chat input
    $("#chatBtn").on("click", function () {
        chatBox = $("#chatInput").val().trim();
        if (player.name !== "") {
            chatBox = player.name + ": " + chatBox;
        }
        else {
            chatBox = "Guest: " + chatBox;
        }
        database.ref("/chat").push({ chatText: chatBox });
        $("#chatInput").val(" ");

    });

    database.ref("/choices").on("value", function (snap) {
        console.log("choices updated");
        if (snap.hasChild("p1Choice") && snap.hasChild("p2Choice")) {
            gameLogic(snap.val().p1Choice.p1choice, snap.val().p2Choice.p2choice);
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
                $("#p1-display").text("Waiting for opponent to choose");
                player.type = "two";
                database.ref(`/connections/${userCon[0]}`).set(player);
                database.ref(`/displayP2`).set({ name: player.name });
                displayPlayer1();

                break;
            //both p1 and p2 exist, person stays as a guest type but has name now
            case "p1p2":
                console.log("player two snapshot here");
                player.type = "guest";
                // $("#p1-display").text("");
                $("#p1-display").text("Full");
                $("#p2-display").text("Full");
                database.ref(`/connections/${userCon[0]}`).set(player);
                displayPlayer1();
                displayPlayer2();
                break;
            //only p2 connected, shift guest to p1
            case "p2":
                console.log("no player one but there is player 2");
                $("#btnsP1").removeClass("d-none").addClass("d-flex");
                $("#waitingP1").addClass("d-none");
                $("#p2-display").text("Waiting for opponent to choose");
                player.type = "one";
                database.ref(`/connections/${userCon[0]}`).set(player);
                database.ref(`/displayP1`).set({ name: player.name });
                displayPlayer2();
                break;
            //no players, make them p1
            case "noPs":
                console.log("no player one");
                $("#btnsP1").removeClass("d-none").addClass("d-flex");
                $("#waitingP1").addClass("d-none");
                $("#p2-display").text("Waiting for opponent");
                player.type = "one";
                database.ref(`/connections/${userCon[0]}`).set(player);
                database.ref("/displayP1").set({ name: player.name });
                break;
        }
        if (player.type === "one" && snap.numChildren() > 1) {
            displayPlayer2();
        }
    });

    database.ref().child("scores").once("value", function (snapshot) {
        if (snapshot.exists()) {
            scores.P1wins = snapshot.val().P1wins;
            scores.P2wins = snapshot.val().P2wins;
            scores.tie = snapshot.val().tie;
            console.log(scores);
        }
        else {
            database.ref("/scores").set(scores);
        }
    });

    database.ref("/scores").on("value", function (snapshot) {
        console.log("updating text");
        $("#p1-wins").text(snapshot.val().P1wins);
        $("#p2-wins").text(snapshot.val().P2wins);
        $("#p1-loss").text(snapshot.val().P2wins);
        $("#p2-loss").text(snapshot.val().P1wins);
        $("#ties").text(snapshot.val().tie);

    });

    database.ref("/chat").on("value", function (snapshot) {
        $("#chatBoxArea").empty();
        if (snapshot.exists()) {
            var showChat = snapshot.val();
            var keys = Object.keys(showChat);
            for (var i = 0; i < keys.length; i++) {
                var k = keys[i];
                var chatLog = showChat[k].chatText;
                $("#chatBoxArea").append("<p>" + chatLog + "</p>");
                console.log(chatLog);
            }
        }

    });

    function displayPlayer1() {
        database.ref().child("/displayP1").once("value", function (snapshot) {
            $("#p1-name").text(snapshot.val().name);
        });
    }

    function displayPlayer2() {
        database.ref().child("/displayP2").once("value", function (snapshot) {
            $("#p2-name").text(snapshot.val().name);
        });
    }

    function winP1() {
        scores.P1wins++;
        database.ref("/scores").set(scores);
    }

    function winP2() {
        scores.P2wins++;
        database.ref("/scores").set(scores);
    }

    function tie() {
        scores.tie++;
        database.ref("/scores").set(scores);
    }

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
                    tie();
                }
                if (p2 === "Paper") {
                    console.log("p2 wins");
                    winP2();
                }
                if (p2 === "Scissors") {
                    console.log("p1 wins");
                    winP1();
                }
                break;
            case "Paper":
                if (p2 === "Rock") {
                    console.log("p1 wins");
                    winP1();
                }
                if (p2 === "Paper") {
                    console.log("tie");
                    tie();
                }
                if (p2 === "Scissors") {
                    console.log("p2 wins");
                    winP2();
                }
                break;
            case "Scissors":
                if (p2 === "Rock") {
                    console.log("p2 wins");
                    winP2();
                }
                if (p2 === "Paper") {
                    console.log("p1 wins");
                    winP1();
                }
                if (p2 === "Scissors") {
                    console.log("tie");
                    tie();
                }
                break;
        }
    }
    function removeChoices() {
        database.ref("/choices").remove();
    }
});