import net from "node:net";
import dotenv from "dotenv";

dotenv.config();

const serverPort = Number(process.env.SERVER_PORT);
const serverHost = process.env.SERVER_HOST;
const localPort = Number(process.env.LOCAL_PORT);

let peers = [];

// Step 1: Connect to bootstrap server and get peers
function registerAndFetchPeers(callback) {
  const client = net.createConnection(
    { host: serverHost, port: serverPort, localPort: localPort },
    () => {
      const request = JSON.stringify({ action: "register" });
      client.write(request + "\n");
    }
  );

  client.on("data", (data) => {
    try {
      const response = JSON.parse(data.toString());
      peers = response.peers || [];
      console.log("Received peers from bootstrap:", peers);
    } catch (err) {
      console.error("Error parsing bootstrap response:", err.message);
    }
  });

  client.on("end", () => {
    callback(); // Proceed only after connection ends
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
    connectToRandomPeer(); // Step 3: After server starts, connect to random peer
  });
}

// Step 3: Connect to a random peer and send a message
function connectToRandomPeer() {
  if (!peers.length) {
    console.log("No peers available.");
    return;
  }

  const chosenPeer = peers[Math.floor(Math.random() * peers.length)];

  console.log(`Connecting to peer: ${chosenPeer.ip}`);

  const peerConnection = net.createConnection(
    { host: chosenPeer.ip, port: localPort },
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
