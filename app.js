import net from "node:net";
import dotenv from "dotenv";

dotenv.config();

const serverPort = Number(process.env.SERVER_PORT);
const serverHost = process.env.SERVER_HOST;
const localPort = Number(process.env.LOCAL_PORT);


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

  console.log(data.toString())

  client.end();
});

client.on("end", () => {
  console.log("disconnected from server");
});

