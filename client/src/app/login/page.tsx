import Image from "next/image";

const Login = () => {
  return (
    <div className="w-full min-h-screen bg-base">
      <div className="bg-highlight flex flex-col w-fit mx-auto p-4">
        <div className="flex">
          <div className="text-xl">Signup</div>
          <div className="text-xl">Login</div>
        </div>
        <div>
          {/* <img src="/logos/bg_login.png" /> */}
          <Image src={"/logos/bg_login.png"} width={100} height={100} alt="login background"/>
        </div>
      </div>
    </div>
  );
};

export default Login;
