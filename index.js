const net = require("net");

let arne_ip = "127.0.0.1";
let apiUrl = "https://explain-monitor.com";
let user = {
  name: "ARNE_101",
  password: "ARNE_101",
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

    // login succeeded so start pulling the vitals from the server
    getVitalsTimer = setInterval(() => getStateExplain(), 1000);
    console.log("Connected to Explain-monitor.com using login: ", user.name)
    console.log("Start pulling vitals data at 1 second interval.")
    return true;
  } else {
    console.log("Connection to Explain-monitor.com failed using login: ", user.name)
    return false;
  }
};

getStateExplain = async function () {
  const url = `${apiUrl}/api/states/get_state?token=${user.token}`;
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
    // received state from server for the current ARNE
    let data = await response.json();
    if (data.vitals.arne_hr_connected) {
      vitals.HeartRate = data.vitals.heartRate;
    } else {
      vitals.HeartRate = null
    }
    if (data.vitals.arne_spo2_connected) {
      vitals.O2Sat = data.vitals.spo2Pre;
    } else {
      vitals.O2Sat = null
    }
    
    if (data.vitals.arne_rr_connected) {
      vitals.RespRate = data.vitals.respRate;
    } else {
      vitals.RespRate = null
    }
   
    if (data.vitals.arne_temp_connected) {
      vitals.Temperature = data.vitals.bodyTemp;
    } else {
      vitals.Temperature = null
    }
    updateArne()
    return true;
  } else {
    // we can't find a state for this user so we have to supply the default one
    console.log("Failed to load the state from explain-monitor.com");
    vitals.HeartRate = null
    vitals.O2Sat = null
    vitals.RespRate = null
    vitals.Temperature = null
    return false;
  }
};

// Connect to the server
updateArne = function () {
  // create a client
  try {
    const client = new net.Socket();
    client.connect(50005, arne_ip, () => {
      // Convert the object to a string
      const jsonData = JSON.stringify(vitals);
      // write data to arne
      client.write(jsonData);
    });
  
    client.on("error", () => {
      console.log('Connection to ARNE failed. Is ARNE running and in training mode?')
    })
    // Handle connection close
    client.on("close", () => {
      // console.log("disconnected");
    });

  } catch (e) {
    console.log("Connection to ARNE failed.")
  }

};

let result = logInExplain();


// setInterval(() => {
//   updateArne();
// }, 1000);
