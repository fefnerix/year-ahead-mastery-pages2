import BrandLogo from "./BrandLogo";

interface LogoProps {
  variant?: "full" | "compact";
  className?: string;
}

const Logo = ({ variant = "compact", className = "" }: LogoProps) => {
  return (
    <BrandLogo
      variant={variant === "full" ? "full" : "icon"}
      size={variant === "full" ? 64 : 32}
      className={className}
    />
  );
};

export default Logo;
