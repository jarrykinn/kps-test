const express = require("express");
var bodyParser = require("body-parser");
const app = express();
const path = require("path");
const { workerData } = require("worker_threads");

let round = -1;
var roundResults = [];
var response = {};
const PLAY_NAMES = ["ROCK", "PAPER", "SCISSORS"];
const VROCK = 0; // 'rock' ID
const VPAPER = 1; // 'paper' ID
const VSCISSORS = 2; // 'scissors' ID
const PLAYER_WINS = 0;
const COMPUTER_WINS = 1;

// parse application/x-www-form-urlencoded
app.use(bodyParser.urlencoded({ extended: false }));

// configure /icons as static file folder
app.use(express.static("icons"));

// Listen to the specified port, or 8080 otherwise
const PORT = process.env.PORT || 8080;
app.listen(PORT, () => {
  console.log(`Server listening on port ${PORT}...`);
});

/**
 * Serve the index.html
 */
app.get("/", (req, res) => {
  res.sendFile(path.join(__dirname, "/index.html"));
});

/**
 * Handle GET /restart, just restart the game
 */
app.post("/restart", (req, res) => {
  round = -1;
  roundResults = [];
  res.setHeader("Content-Type", "application/json");
  response["output"] = "played rounds: " + (round + 1);
  res.send(JSON.stringify(response));
});

/**
 * Handle GET /result, return the formatted results summary
 */
app.get("/results", (req, res) => {
  res.setHeader("Content-Type", "application/json");
  let resultText = logRoundResults();
  console.log("%o", resultText);
  response["output"] = resultText;
  res.send(JSON.stringify(response));
});

/**
 * Hanlde POST /play to play one round
 */
app.post("/play", (req, res) => {
  console.log("played: %o", req.body.played);
  var player = -1;
  switch (
    req.body.played // What did the player play
  ) {
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
  var computer = randomIntFromInterval(0, 2); // play for computer

  let whoWins = whoDaresWins(player, computer); // calculate the result

  // Did we get a real result or just DRAW, which is skipped
  // Save the result in roundData
  // Respond with some readable text
  if (whoWins >= 0) {
    round++;
    let playedRounds = round + 1;
    var roundData = {};
    roundData.result = whoWins;
    roundData.log =
      "You played: " +
      PLAY_NAMES[player] +
      " <b>< = ></b> Computer: " +
      PLAY_NAMES[computer] +
      "<br>" +
      logWinnerString(roundData.result) +
      "<br>" +
      "rounds played: " +
      playedRounds;
    roundResults[round] = roundData;
    response["output"] = roundData.log;
  } else {
    let playedRounds = round + 1;
    response["output"] =
      "DRAW, try again! <br>" + "rounds played: " + playedRounds;
  }
  logRoundResults();
  res.setHeader("Content-Type", "application/json");
  res.send(JSON.stringify(response));
});

/**
 * Play random rock, paper, scissors selection for the computer
 * @param {int} min
 * @param {int} max
 * @returns
 */
function randomIntFromInterval(min, max) {
  // min and max included
  return Math.floor(Math.random() * (max - min + 1) + min);
}

/**
 * The rules for who wins
 *
 * @param {int} player    // Player's selection
 * @param {int} computer  // Computer's selection
 * @returns
 */
function whoDaresWins(player, computer) {
  if (player === computer) {
    return -1; // DRAW
  }
  if (player < computer) {
    if (player == VROCK && computer == VSCISSORS) {
      return PLAYER_WINS;
    }
    return COMPUTER_WINS;
  }
  if (computer == VROCK && player == VSCISSORS) {
    return COMPUTER_WINS;
  }
  return PLAYER_WINS;
}

/**
 * Helper to format some nice reabale result texts
 * @returns // <div> content to display in browser
 */
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

/**
 * Just console.log and add some formatting for <table>
 * @param {String} input
 * @returns
 */
function logAndReturn(input) {
  console.log(input);
  return "<tr><td>" + input + "</th></tr>";
}

/**
 * Format the winner string
 *
 * @param {int} result
 * @returns
 */
function logWinnerString(result) {
  if (result === PLAYER_WINS) {
    return "<b>** YOU WIN **</b>";
  } else {
    return "<b>** COMPUTER WINS **</b>";
  }
}
