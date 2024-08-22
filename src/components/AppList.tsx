import { useApp } from "@/hooks/useApp";
import { App } from "@/types";
import { Skeleton } from "@/components/ui/Skeleton";

const AppList = () => {
  const { apps, selectedApp, setSelectedApp } = useApp();

  const onSelect = (app: App) => {
    setSelectedApp(app);
  };

  if (apps.length === 0) return <Skeleton className="w-20 h-8" />;

  return (
    <div className="flex items-center space-x-2">
      {apps.map((app, index) => (
        <div
          key={index}
          className={`${
            selectedApp.name === app.name ? "bg-white/10" : ""
          } py-2 px-3 rounded-md cursor-pointer`}
          onClick={() => onSelect(app)}
        >
          {app.icon}
        </div>
      ))}
    </div>
  );
};

export { AppList };
