"use client";

import { useRouter } from "next/navigation";
import {
  FormEvent,
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import { Socket } from "socket.io-client";

interface props {
  socket: Socket;
}

type Message = {
  id: string;
  name: string;
  message: string;
};

const Chat = ({ socket }: props) => {
  const [messages, setMessages] = useState<Message[]>([]);
  const [messageInput, setMessageInput] = useState("");
  const messageBox = useRef<HTMLInputElement | null>(null);
  const [name, setName] = useState("");
  const router = useRouter();

  useEffect(() => {
    const getName = window.localStorage.getItem("name");
    if (getName == null) router.push("/");
    setName(getName!);

    const handleJoin = (data: Message) => {
      setMessages((prev) => [
        ...prev,
        { id: data.id, name: data.name, message: " has joined the chat!" },
      ]);
    };

    const handleLeave = (data: Message) => {
      setMessages((prev) => [
        ...prev,
        { id: data.id, name: data.name, message: " has disconnected..." },
      ]);
    };

    const handleMessage = (data: Message) => {
      setMessages((prev) => [...prev, data]);
    };

    socket.on("player_joined", handleJoin);
    socket.on("player_left", handleLeave);
    socket.on("chat_message", handleMessage);

    return () => {
      socket.off("player_joined", handleJoin);
      socket.off("player_left", handleLeave);
      socket.off("chat_message", handleMessage);
    };
  }, [router, socket]);

  const sendMessage = useCallback(
    (e: FormEvent) => {
      e.preventDefault();
      if (messageInput.trim().length > 0) {
        socket.emit("chat_message", {
          id: socket.id,
          name: name,
          message: messageInput.trim(),
        });
        setMessageInput("");
      }
    },
    [messageInput, name, socket]
  );

  const messageLog = useMemo(() => {
    return messages.map((msg, index) => (
      <div key={index}>{`${msg.name}: ${msg.message}`}</div>
    ));
  }, [messages]);

  // useEffect(() => {
  //   messageBox.current?.scrollIntoView({ behavior: "smooth" });
  // }, [messages]);

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
