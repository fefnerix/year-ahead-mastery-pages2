interface LogoProps {
  variant?: "full" | "compact";
  className?: string;
}

const Logo = ({ variant = "compact", className = "" }: LogoProps) => {
  if (variant === "full") {
    return (
      <div className={`flex flex-col items-center gap-3 ${className}`}>
        <div className="h-16 w-16 rounded-2xl gold-gradient flex items-center justify-center">
          <span className="text-2xl font-black text-primary-foreground tracking-tight">P</span>
        </div>
        <div className="text-center">
          <h1 className="text-3xl font-display font-bold gold-text">PROGRESS</h1>
          <p className="text-xs text-muted-foreground mt-1 tracking-widest uppercase">
            Tu transformación diaria
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className={`flex items-center gap-2 ${className}`}>
      <div className="h-8 w-8 rounded-lg gold-gradient flex items-center justify-center">
        <span className="text-sm font-black text-primary-foreground">P</span>
      </div>
      <span className="text-sm font-bold text-foreground tracking-wider">PROGRESS</span>
    </div>
  );
};

export default Logo;
