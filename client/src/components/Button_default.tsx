interface props {
  text: string;
  onClick?: (e: React.MouseEvent) => void;
}

const Button_default = ({ text, onClick }: props) => {
  return (
    <button
      onClick={onClick}
      className="cursor-pointer font-medium bg-elevated-highlight px-4 py-2 rounded-full hover:bg-elevated-hover hover:scale-105 transition-all"
    >
      {text}
    </button>
  );
};

export default Button_default;
