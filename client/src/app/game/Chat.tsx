const Chat = () => {
  return (
    <div className="absolute left-0 bottom-0 ml-2 mb-2 w-[400px]">
      <div className=" bg-[#00000099] ml-1 rounded-md p-4">
        user: hello
      </div>
      <div className="flex items-center pl-4 gap-x-3 rounded-full bg-[#00000099] mt-3">
        <p>Chat: </p>
        <input
          type="text"
          className="w-full outline-none h-[40px] pl-3 focus:border-2 rounded-full bg-[#00000099]"
          placeholder="Press enter to chat"
        />
      </div>
    </div>
  );
};

export default Chat;
