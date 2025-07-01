import net from "node:net";
import dotenv from "dotenv";

dotenv.config();

const serverPort = Number(process.env.SERVER_PORT);
const serverHost = process.env.SERVER_HOST;
const localPort = Number(process.env.LOCAL_PORT);

let peers = [];
let myPublicIP = null;

// Step 1: Connect to bootstrap server and get peers
function registerAndFetchPeers(callback) {
  const client = net.createConnection(
    { host: serverHost, port: serverPort, localPort: localPort },
    () => {
      const request = JSON.stringify({
        action: "register",
        port: localPort,
      });
      client.write(request + "\n");

      client.write(request + "\n");
    }
  );

  client.on("data", (data) => {
    try {
      const response = JSON.parse(data.toString());
      peers = response.peers || [];
      myPublicIP = response.yourIP;

      console.log("Received peers from bootstrap:", peers);
      console.log("My public IP as seen by server:", myPublicIP);
    } catch (err) {
      console.error("Error parsing bootstrap response:", err.message);
    }
  });

  client.on("end", () => {
    callback();
  });

  client.on("error", (err) => {
    console.error("Error connecting to bootstrap server:", err.message);
  });
}

// Step 2: Start TCP server to accept incoming peer connections
function startPeerServer() {
  const server = net.createServer((sock) => {
    let dataBuffer = "";

    sock.on("data", (data) => {
      dataBuffer += data;
    });

    sock.on("end", () => {
      console.log(
        `Received from peer ${sock.remoteAddress}:${sock.remotePort}: ${dataBuffer}`
      );
      sock.write(`Received your message: ${dataBuffer}`);
    });

    sock.on("error", (err) => {
      console.error("Peer server error:", err.message);
    });
  });

  server.listen(localPort, () => {
    console.log(`Peer listening on port ${localPort}`);
    connectToRandomPeer(); // Connect only after server starts
  });
}

// Step 3: Connect to a random peer (but never self)
function connectToRandomPeer() {
  const availablePeers = peers.filter((p) => p.ip !== myPublicIP);

  if (!availablePeers.length) {
    console.log("No available peers (other than self) to connect to.");
    return;
  }

  const chosenPeer =
    availablePeers[Math.floor(Math.random() * availablePeers.length)];

  console.log(`Connecting to peer: ${chosenPeer.ip}`);

  const peerConnection = net.createConnection(
    { host: chosenPeer.ip, port: chosenPeer.port },
    () => {
      const message = `Hello from ${localPort}`;
      peerConnection.write(message + "\n");
    }
  );

  peerConnection.on("data", (data) => {
    console.log("Response from peer:", data.toString());
  });

  peerConnection.on("end", () => {
    console.log("Disconnected from peer.");
  });

  peerConnection.on("error", (err) => {
    console.error("Error connecting to peer:", err.message);
  });
}

// Run everything
registerAndFetchPeers(startPeerServer);
