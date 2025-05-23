import Image from "next/image";
import Link from "next/link";

// import { Link } from "react-router-dom";
import { PiShootingStarFill } from "react-icons/pi";

import Button_default from "../../components/Button_default";

const Navbar = () => {
  return (
    <div className="text-lg flex items-center justify-between bg-highlight px-4 py-3 relative">
      <div className="flex items-center gap-x-3">
        <Link className="mr-12 cursor-pointer" href={"/"}>
          <Image src={"/logos/logo.png"} width={50} height={50} alt="logo" />
        </Link>

        <Button_default text="Joined rooms" />
        <Button_default text="Browse rooms" />
      </div>

      <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 border border-positive w-1/3 pl-6 pr-3 py-2 rounded-full flex items-center focus-within:border-[3px] transition-all bg-base">
        <input type="text" placeholder="Search For Rooms..." className="outline-none h-full w-full bg-base" />
        <PiShootingStarFill size={30} fill="gold" />
      </div>

      <div className="flex items-center gap-x-5">
        <Link
          className="font-bold bg-positive text-base px-4 py-3 rounded-full text-center hover:scale-105 transition-all"
          href={"/"}
        >
          Sign in
        </Link>
        <Link
          className="cursor-pointer font-medium bg-elevated-highlight px-4 py-2 rounded-full hover:bg-elevated-hover hover:scale-105 transition-all"
          href={"/"}
        >
          Create room
        </Link>
        <Link className="rounded-full hover:scale-110 transition-all border-2" href={"/"}>
          <Image src={"/sprites/boy_red/boy_red.png"} width={40} height={40} alt="boy red" />
        </Link>
      </div>
    </div>
  );
};

export default Navbar;
