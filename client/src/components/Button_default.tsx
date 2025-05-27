interface props {
  text: string;
  onClick?: (e: React.MouseEvent) => void;
  className?: string;
}

const Button_default = ({ text, onClick, className }: props) => {
  return (
    <button
      onClick={onClick}
      className={`cursor-pointer font-medium bg-elevated-highlight px-4 py-2 rounded-full hover:bg-elevated-hover hover:scale-105 transition-all ${className}`}
    >
      {text}
    </button>
  );
};

export default Button_default;
