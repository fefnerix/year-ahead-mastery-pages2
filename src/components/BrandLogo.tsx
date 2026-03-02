import logo365 from "@/assets/logo-365.png";

interface BrandLogoProps {
  size?: number;
  variant?: "icon" | "full";
  className?: string;
}

const BrandLogo = ({ size = 32, variant = "icon", className = "" }: BrandLogoProps) => {
  if (variant === "full") {
    return (
      <div className={`flex flex-col items-center gap-1 ${className}`}>
        <img
          src={logo365}
          alt="PROGRESS 365"
          width={size}
          height={size}
          className="object-contain"
          style={{ width: size, height: size }}
        />
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
      <img
        src={logo365}
        alt="PROGRESS 365"
        width={size}
        height={size}
        className="object-contain"
        style={{ width: size, height: size }}
      />
      <span className="text-sm font-bold text-foreground tracking-wider">PROGRESS</span>
    </div>
  );
};

export default BrandLogo;
