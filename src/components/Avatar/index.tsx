import EmojiAvatar from "./EmojiAvatar.tsx";
import { cn } from "../../utils/index.ts";
import { Loader2 } from "lucide-react";

interface AvatarProps {
  address: string;
  loading?: boolean;
  imageUrl?: string | null;
  size: number;
}

const Avatar = ({ address, loading, imageUrl, size }: AvatarProps) => {
  return (
    <div className="relative overflow-hidden rounded-full" style={{ width: `${size}px`, height: `${size}px` }}>
      <div
        className={cn("absolute flex items-center justify-center overflow-hidden rounded-full")}
        style={{
          fontSize: `${Math.round(size * 0.6)}px`,
          transform: loading ? "scale(0.72)" : undefined,
          transition: ".25s ease",
          transitionDelay: loading ? undefined : ".1s",
          willChange: "transform",
          width: `${size}px`,
          height: `${size}px`,
        }}
      >
        <EmojiAvatar address={address} ensImage={imageUrl} size={size} />
      </div>
      {loading && (
        <div className="absolute flex items-center justify-center overflow-hidden rounded-full">
          <Loader2 size={size} />
        </div>
      )}
    </div>
  );
};

export default Avatar;
