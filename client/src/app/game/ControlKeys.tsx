import Image from 'next/image'
interface props {
  up: string;
  down: string;
  left: string;
  right: string;
}

const ControlKeys = ({ up, down, left, right }: props) => {
  return (
    <div className="font-pixelated text-lg grid grid-cols-3 grid-rows-2 w-[150px]">
      <Image src={up} className="row-start-1 col-start-2" width={50} height={50} alt="up" />
      <Image src={left} className="row-start-2" width={50} height={50} alt="down" />
      <Image src={down} className="row-start-2" width={50} height={50} alt="left" />
      <Image src={right} className="row-start-2" width={50} height={50} alt="right" />
    </div>
  );
};

export default ControlKeys;
