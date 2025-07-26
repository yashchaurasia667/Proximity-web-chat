import Image from "next/image";
interface props {
  up: string;
  down: string;
  left: string;
  right: string;
}

const ControlKeys = ({ up, down, left, right }: props) => {
  return (
    <div className="font-pixelated justify-center items-center text-lg grid grid-cols-3 grid-rows-2">
      <Image src={up} className="row-start-1 col-start-2" width={500} height={500} alt="up" />
      <Image src={left} className="row-start-2 col-start-1" width={500} height={500} alt="down" />
      <Image src={down} className="row-start-2 col-start-2" width={500} height={500} alt="left" />
      <Image src={right} className="row-start-2 col-start-3" width={500} height={500} alt="right" />
    </div>
  );
};

export default ControlKeys;
