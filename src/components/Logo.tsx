import BrandLogo from "./BrandLogo";

interface LogoProps {
  variant?: "full" | "compact";
  className?: string;
}

const Logo = ({ variant = "compact", className = "" }: LogoProps) => {
  return (
    <BrandLogo
      variant={variant === "full" ? "full" : "header"}
      className={className}
    />
  );
};

export default Logo;
