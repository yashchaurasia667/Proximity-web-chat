"use client";

import Image from "next/image";
import { useRouter } from "next/navigation";
import { FormEvent, useState } from "react";
import { GoDotFill } from "react-icons/go";
import { FaCircleChevronLeft, FaCircleChevronRight } from "react-icons/fa6";

import Button_default from "../components/Button_default";

const Home = () => {
  const characterUrls = [
    "/sprites/adventurer_female/adventurer_female.png",
    "/sprites/adventurer_male/adventurer_male.png",
    "/sprites/gameboy/gameboy.png",
  ];
  const [urlIndex, setUrlIndex] = useState(0);
  const [name, setName] = useState("");
  const router = useRouter();

  const joinLobby = (e: FormEvent) => {
    e.preventDefault();
    if (!name) return;

    window.localStorage.setItem("name", name);
    window.localStorage.setItem("sprite", characterUrls[urlIndex]);
    router.push("/game");
  };

  return (
    <div className="bg-base min-h-[100vh]">
      {/* <Navbar /> */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 lg:w-1/2 p-4 bg-highlight rounded-2xl flex gap-x-16 items-center justify-center">
        <div>
          <p className="text-2xl font-semibold text-center">
            Choose your character
          </p>
          <div className="w-[350px] h-[500px] flex items-center relative mt-3 rounded-lg">
            <Image
              src={characterUrls[urlIndex]}
              width={350}
              height={500}
              objectFit="contain"
              alt="avatar"
              className="select-none"
            />

            <div className="flex w-full justify-between absolute">
              <FaCircleChevronLeft
                size={30}
                className="cursor-pointer hover:scale-110 transition-all hover:fill-text-base"
                onClick={() =>
                  setUrlIndex((prev) => (prev == 0 ? 2 : prev - 1))
                }
              />
              <FaCircleChevronRight
                size={30}
                className="cursor-pointer hover:scale-110 transition-all hover:fill-text-base"
                onClick={() =>
                  setUrlIndex((prev) => (prev == 2 ? 0 : prev + 1))
                }
              />
            </div>

            <div className="absolute bottom-10 left-1/2 -translate-x-1/2 flex">
              {characterUrls.map((url, index) => (
                <GoDotFill
                  className={`cursor-pointer ${
                    index == urlIndex ? "fill-text-base" : ""
                  }`}
                  size={20}
                  key={index}
                />
              ))}
            </div>
          </div>
        </div>
        <div>
          <p className="text-lg font-medium">What should we call you?</p>
          <form onSubmit={joinLobby}>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Name"
              className="w-[320px] px-4 py-3 ml-4 mt-2 rounded-lg bg-base outline-none border border-text-base focus-within:border-[3px] transition-all placeholder:text-text-base text-text-base font-medium"
            />
            <Button_default
              text={"Join"}
              className={"px-8 font-bold mt-2 ml-4 block"}
              onClick={joinLobby}
            />
          </form>
        </div>
      </div>
    </div>
  );
};

export default Home;
