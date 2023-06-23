const net = require("net");

let arne_ip = "192.168.178.24";
let apiUrl = "https://explain-monitor.com";
let user = {
  name: "Timothy Antonius",
  password: "y5qkqjed",
  config: "",
  token: "",
  loggedIn: false,
};
let vitals = {
  HeartRate: 50,
  O2Sat: 50,
  RespRate: 50,
  Temperature: 37,
  ProtocolVersion: "1.0",
};
let password = "y5qkqjed";

const arne_port = 50005;
let connectionTimer = null;
let getVitalsTimer = null;

//{"HeartRate":50,"O2Sat":50,"RespRate":50,"Temperature":37,"ProtocolVersion":"1.0"}

// login to Explain monitor
logInExplain = async function () {
  const url = `${apiUrl}/api/auth`;
  // get the user login data
  let response = await fetch(url, {
    method: "POST",
    headers: {
      Accept: "application/json, text/plain, */*",
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ name: user.name, password: user.password }),
  });

  if (response.status === 200) {
    let data = await response.json();
    user.name = data.name;
    user.config = data.config;
    user.token = data.token;
    user.loggedIn = true;

    getVitalsTimer = setInterval(() => getStateExplain(), 1000);

    return true;
  } else {
    return false;
  }
};

getStateExplain = async function () {
  const url = `${apiUrl}/api/states/get_state?token=${user.token}`;
  console.log(user.token);
  // get the user login data
  let response = await fetch(url, {
    method: "POST",
    headers: {
      Accept: "application/json, text/plain, */*",
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      user: user.name,
      name: "default",
    }),
  });

  if (response.status === 200) {
    let data = await response.json();
    vitals.HeartRate = data.vitals.heartRate;
    vitals.O2Sat = data.vitals.spo2Pre;
    vitals.RespRate = data.vitals.respRate;
    vitals.Temperature = data.vitals.bodyTemp;
    return true;
  } else {
    // we can't find a config for this user so we have to supply the default one
    console.log("Failed to load the state.");
    return false;
  }
};
// Connect to the server
updateArne = function () {
  // create a client
  const client = new net.Socket();

  client.connect(50005, arne_ip, () => {
    console.log("Connected to server");
    // Convert the object to a string
    const jsonData = JSON.stringify(vitals);
    // write data to arne
    client.write(jsonData);
  });

  // Handle connection close
  client.on("close", () => {
    console.log("disconnected");
  });

  // Receive data from the server
  client.on("data", (data) => {
    console.log("Received data:", data.toString());

    // // Close the connection
    // client.end();
  });
};

let result = logInExplain();
if (result) {
  // fetch data on a regular basis
}

setInterval(() => {
  updateArne();
}, 1000);
