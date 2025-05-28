"use client";

import { useRouter } from "next/navigation";
import { FormEvent, useEffect, useMemo, useRef, useState } from "react";
import { Socket } from "socket.io-client";

interface props {
  socket: Socket;
}

type message = {
  id: string;
  name: string;
  message: string;
};

const Chat = ({ socket }: props) => {
  const [messages, setMessages] = useState<message[]>([]);
  const [messageInput, setMessageInput] = useState("");
  const messageBox = useRef<HTMLInputElement | null>(null);
  const [name, setName] = useState("");
  const router = useRouter();

  useEffect(() => {
    socket.on("player_joined", (data) => {
      const getName = window.localStorage.getItem("name");
      if (getName == null) router.push("/");
      setName(getName!);

      setMessages([
        ...messages,
        { id: data.id, name: data.name, message: "has joined the chat" },
      ]);
    });

    socket.on("player_left", (data) => {
      setMessages([
        ...messages,
        { id: data.id, name: data.name, message: "has disconnected" },
      ]);
    });

    socket.on("chat_message", (data) => {
      setMessages([...messages, data]);
    });
  }, [messages, socket, router, name]);

  const sendMessage = (e: FormEvent) => {
    e.preventDefault();
    if (messageInput) {
      socket.emit("chat_message", {
        id: socket.id,
        name: name,
        message: messageInput,
      });
      setMessageInput("");
    }
  };

  const messageLog = useMemo(() => {
    return messages.map((message, index) => (
      <div key={index}>{`${message.name}: ${message.message}`}</div>
    ));
  }, [messages]);

  return (
    <div className="absolute left-0 bottom-0 ml-2 mb-2 w-[400px]">
      <div className=" bg-[#00000099] ml-1 rounded-md p-4">{messageLog}</div>
      <div className="flex items-center pl-4 gap-x-3 rounded-full bg-[#00000099] mt-3">
        <p>Chat: </p>
        <form className="w-full" onSubmit={sendMessage}>
          <input
            className="w-full outline-none h-[40px] pl-3 focus:border-2 rounded-full bg-[#00000099]"
            type="text"
            ref={messageBox}
            value={messageInput}
            onChange={(e) => setMessageInput(e.target.value)}
            placeholder="Press enter to chat"
          />
        </form>
      </div>
    </div>
  );
};

export default Chat;
