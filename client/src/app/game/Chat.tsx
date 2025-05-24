import { FormEvent, useEffect, useMemo, useRef, useState } from "react";
import { io } from "socket.io-client";

const socket = io("http://localhost:5000");
const Chat = () => {
  const [messages, setMessages] = useState<{ message: string; id: string }[]>(
    []
  );
  const [messageInput, setMessageInput] = useState<string>("");

  const messageBox = useRef<HTMLInputElement | null>(null);

  useEffect(() => {
    socket.on("message", (data) => {
      setMessages([...messages, data]);
    });
  }, [messages]);

  const sendMessage = (e: FormEvent) => {
    e.preventDefault();
    if (messageInput) {
      socket.emit("message", messageInput);
      setMessageInput("");
    }
  };

  const messageLog = useMemo(() => {
    return messages.map((message, index) => <div key={index}>{`${message.id}: ${message.message}`}</div>);
  }, [messages]);

  return (
    <div className="absolute left-0 bottom-0 ml-2 mb-2 w-[400px]">
      <div className=" bg-[#00000099] ml-1 rounded-md p-4">
        {messageLog}
      </div>
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
