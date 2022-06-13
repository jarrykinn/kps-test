const express = require("express");
var bodyParser = require("body-parser");
const app = express();
const path = require("path");
const { workerData } = require("worker_threads");

let round = -1;
var roundResults = [];
var response = {};
const playNames = ["ROCK", "PAPER", "SCISSORS"];
const VROCK = 0;
const VPAPER = 1;
const VSCISSORS = 2;

// parse application/x-www-form-urlencoded
app.use(bodyParser.urlencoded({ extended: false }));

app.get("/", (req, res) => {
  res.sendFile(path.join(__dirname, "/index.html"));
});

app.get("/restart", (req, res) => {
  round = -1;
  roundResults = [];
  res.setHeader("Content-Type", "application/json");
  response["output"] = "played rounds: " + (round + 1);
  res.send(JSON.stringify(response));
});

app.get("/results", (req, res) => {
  res.setHeader("Content-Type", "application/json");
  let resultText = logRoundResults();
  console.log("%o", resultText);
  response["output"] = resultText;
  res.send(JSON.stringify(response));
});

app.post("/play", (req, res) => {
  console.log("played: %o", req.body.played);
  var computer = randomIntFromInterval(0, 2);
  var player = -1;
  switch (req.body.played) {
    case "rock":
      player = VROCK;
      break;
    case "paper":
      player = VPAPER;
      break;
    case "scissors":
      player = VSCISSORS;
      break;
  }
  res.setHeader("Content-Type", "application/json");

  let whoWins = whoDaresWins(player, computer);
  if (whoWins >= 0) {
    round++;
    var roundData = {};
    roundData.result = whoWins;
    roundData.log =
      "You played: " +
      playNames[player] +
      " <~> Computer: " +
      playNames[computer] +
      " => result: " +
      roundData.result;
    roundResults[round] = roundData;
    response["output"] = roundData.log;
  } else {
    response["output"] = "This round DRAW, try again!";
  }
  logRoundResults();
  res.send(JSON.stringify(response));
});

// Listen to the App Engine-specified port, or 8080 otherwise
const PORT = process.env.PORT || 8080;
app.listen(PORT, () => {
  console.log(`Server listening on port ${PORT}...`);
});

function randomIntFromInterval(min, max) {
  // min and max included
  return Math.floor(Math.random() * (max - min + 1) + min);
}

function whoDaresWins(player, computer) {
  if (player === computer) {
    return -1; // DRAW
  }
  if (player < computer) {
    if (player == VROCK && computer == VSCISSORS) {
      return 0; // PLAYER WINS
    }
    return 1; // COMPUTER WINS
  }
  if (computer == VROCK && player == VSCISSORS) {
    return 1; // COMPUTER WINS
  }
  return 0; // PLAYER WINS
}

function logRoundResults() {
  var resultText =
    "<style> table, th, td { border:1px solid black; } </style> <table>";
  let playerWins = roundResults.filter((x) => x.result == 0).length;
  resultText = resultText.concat(
    logAndReturn("YOU WON: " + playerWins + " TIMES!")
  );
  let computerWins = roundResults.filter((x) => x.result == 1).length;
  resultText = resultText.concat(
    logAndReturn("COMPUTER WON: " + computerWins + " TIMES!")
  );
  if (playerWins == computerWins) {
    resultText = resultText.concat(logAndReturn("DRAW!"));
  } else {
    if (playerWins > computerWins) {
      resultText = resultText.concat(
        logAndReturn("THE WINNER IS <b>** YOU **!</b>")
      );
    } else {
      resultText = resultText.concat(
        logAndReturn("THE WINNER IS ... <b>computer</b> ...")
      );
    }
  }

  resultText = resultText.concat("</table>");
  roundResults.forEach((element) => {
    console.log(element);
  });
  resultText = resultText.concat(
    logAndReturn("total rounds: " + roundResults.length)
  );
  return resultText;
}

function logAndReturn(input) {
  console.log(input);
  return "<tr><td>" + input + "</th></tr>";
}
