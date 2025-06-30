import net from "node:net";
import dotenv from "dotenv";

dotenv.config();

const serverPort = process.env.SERVER_PORT;
const serverHost = process.env.SERVER_HOST;
const localPort = process.env.LOCAL_PORT;

let selectedPeer;

const client = net.createConnection(
  { host: serverHost, port: serverPort, localPort: localPort },
  () => {
    // 'connect' listener.
    console.log("connected to server!");

    // Prepare the JSON request payload
    const request = JSON.stringify({ action: "register" });

    client.write(request + "\n");
  }
);

client.on("data", (data) => {
  const peers = JSON.parse(data.toString()).peers;

  if (Array.isArray(peers) && peers.length > 0) {
    const randomIndex = Math.floor(Math.random() * peers.length);
    selectedPeer = peers[randomIndex];

    const peerHost = selectedPeer.ip;

    const peerConnection = net.createConnection(
      {
        host: peerHost,
        port: parseInt(localPort, 10),
      },
      () => {
        const message = `Hello from ${client.localAddress}:${client.localPort}`;
        console.log("Sending to peer:", message);
        peerConnection.write(message + "\n");
      }
    );

    peerConnection.on("data", (peerData) => {
      console.log("Response from peer:", peerData.toString());
    });

    peerConnection.on("end", () => {
      console.log("Disconnected from peer.");
    });

    peerConnection.on("error", (err) => {
      console.error("Error connecting to peer:", err.message);
    });
  } else {
    console.log("No peers available to select.");
  }

  client.end();
});

client.on("end", () => {
  console.log("disconnected from server");
});
