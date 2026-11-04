const FOOD_STYLES = {
  idli: { bg: "#FFF3E0", emoji: "🥟" },
  dosa: { bg: "#FFF8E1", emoji: "🥞" },
  paratha: { bg: "#FBE9E7", emoji: "🫓" },
  poha: { bg: "#FFFDE7", emoji: "🍚" },
  upma: { bg: "#FFF9C4", emoji: "🥣" },
  sandwich: { bg: "#E8F5E9", emoji: "🥪" },
  vada: { bg: "#FFECB3", emoji: "🍩" },
  rice: { bg: "#F5F5F5", emoji: "🍚" },
  biryani: { bg: "#FFE0B2", emoji: "🥘" },
  dal: { bg: "#FFF3E0", emoji: "🍛" },
  chapati: { bg: "#EFEBE9", emoji: "🫓" },
  paneer: { bg: "#FFF8E1", emoji: "🧀" },
  curry: { bg: "#FFCCBC", emoji: "🍛" },
  samosa: { bg: "#FFE0B2", emoji: "🥟" },
  tea: { bg: "#E0F7FA", emoji: "☕" },
  coffee: { bg: "#EFEBE9", emoji: "☕" },
  juice: { bg: "#FFF9C4", emoji: "🧃" },
  salad: { bg: "#E8F5E9", emoji: "🥗" },
  fruit: { bg: "#FCE4EC", emoji: "🍎" },
  pasta: { bg: "#FFECB3", emoji: "🍝" },
  noodles: { bg: "#FFF8E1", emoji: "🍜" },
  pizza: { bg: "#FFCCBC", emoji: "🍕" },
  burger: { bg: "#FFE0B2", emoji: "🍔" },
  default: { bg: "#F5F5F5", emoji: "🍽️" },
};

export default function FoodImage({ imageKey, url, size = "full", className = "" }) {
  const style = FOOD_STYLES[imageKey] || FOOD_STYLES.default;

  const sizeClasses = {
    full: "w-full h-36",
    thumb: "w-16 h-16 rounded-lg",
    card: "w-full h-28 rounded-t-lg",
  };

  return (
    <div
      className={`${sizeClasses[size]} flex items-center justify-center ${className}`}
      style={{ backgroundColor: style.bg }}
      title={imageKey}
    >
      <span className="text-5xl select-none" role="img" aria-label={imageKey}>
        {style.emoji}
      </span>
    </div>
  );
}