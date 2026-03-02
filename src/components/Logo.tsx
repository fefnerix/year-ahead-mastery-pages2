// Legacy wrapper — use AppLogo directly in new code
import AppLogo from "./brand/AppLogo";

interface LogoProps {
  variant?: "full" | "compact";
  className?: string;
}

const Logo = ({ variant = "compact", className = "" }: LogoProps) => {
  return (
    <AppLogo
      variant={variant === "full" ? "login" : "header"}
      className={className}
    />
  );
};

export default Logo;
