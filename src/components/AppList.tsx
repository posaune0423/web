import { useApp } from "@/hooks/useApp";
import { App } from "@/types";

const AppList = ({ apps }: { apps: App[] }) => {
  const { selectedApp, setSelectedApp } = useApp();

  const onSelect = (app: App) => {
    setSelectedApp(app);
  };

  return (
    <div className="flex items-center space-x-4">
      {apps.map((app) => (
        <div
          key={app.system}
          className={`${selectedApp?.system === app.system ? "bg-white/10" : ""} py-2 px-3 rounded-md`}
          onClick={() => onSelect(app)}
        >
          {app.icon}
        </div>
      ))}
    </div>
  );
};

export default AppList;
