// import Navbar from "../components/home/Navbar";
import Button_default from "../components/Button_default";

const Home = () => {
  return (
    <div className="bg-base min-h-[100vh]">
      {/* <Navbar /> */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 sm:w-1/2 p-4 bg-highlight rounded-2xl flex gap-x-16 items-center justify-center">
        <div>
          <p className="text-2xl font-semibold">Choose your character</p>
          <div></div>
        </div>
        <div>
          <p className="text-lg font-medium">What should we call you?</p>
          <input
            type="text"
            placeholder="Name"
            className="w-[320px] px-4 py-3 ml-4 mt-2 rounded-lg bg-base"
          />
          <Button_default text={"Join"} className={"px-8 py-3 mt-2 ml-4 block"} />
        </div>
      </div>
    </div>
  );
};

export default Home;
