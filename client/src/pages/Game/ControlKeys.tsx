interface props {
  up: string;
  down: string;
  left: string;
  right: string;
}

const ControlKeys = ({ up, down, left, right }: props) => {
  return (
    <div className="font-pixelated text-lg grid grid-cols-3 grid-rows-2 w-[150px]">
      <img src={up} className="row-start-1 col-start-2" />
      <img src={left} className="row-start-2" />
      <img src={down} className="row-start-2" />
      <img src={right} className="row-start-2" />
    </div>
  );
};

export default ControlKeys;
