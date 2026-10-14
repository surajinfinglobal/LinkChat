import { io } from "socket.io-client";
import { resolveServerUrl } from "./api";

const socket = io(resolveServerUrl("/"), {
  autoConnect: false,
});

export default socket;