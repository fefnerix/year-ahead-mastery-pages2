import logoImage from "@/assets/logo-renacer.jpeg";

interface LogoProps {
  variant?: "full" | "compact";
  className?: string;
}

const Logo = ({ variant = "compact", className = "" }: LogoProps) => {
  if (variant === "full") {
    return (
      <div className={`flex flex-col items-center gap-3 ${className}`}>
        <img
          src={logoImage}
          alt="Plan Renacer 365"
          className="h-20 w-20 rounded-full object-cover border-2 border-primary/30"
        />
        <div className="text-center">
          <h1 className="text-3xl font-display font-bold gold-text">Plan Renacer 365</h1>
          <p className="text-xs text-muted-foreground mt-1 tracking-widest uppercase">
            Máster en Desarrollo Personal
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className={`flex items-center gap-2.5 ${className}`}>
      <img
        src={logoImage}
        alt="Plan Renacer 365"
        className="h-9 w-9 rounded-full object-cover border border-primary/20"
      />
      <span className="text-sm font-bold text-foreground tracking-wide">
        PLAN RENACER <span className="text-primary">365</span>
      </span>
    </div>
  );
};

export default Logo;
