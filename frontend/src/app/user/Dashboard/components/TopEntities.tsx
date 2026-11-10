"use client";

import { useTheme } from "../../../context/ThemeContext";
import { BuildingOfficeIcon, UserIcon, MapPinIcon } from "@heroicons/react/24/outline";

interface TopEntitiesProps {
  entities: {
    organizaciones: Array<{ name: string; count: number }>;
    personas: Array<{ name: string; count: number }>;
    lugares: Array<{ name: string; count: number }>;
  };
}

export default function TopEntities({ entities }: TopEntitiesProps) {
  const { theme } = useTheme();

  const sections = [
    {
      title: "Organizaciones",
      data: entities.organizaciones,
      icon: BuildingOfficeIcon,
      color: "blue",
    },
    {
      title: "Personas",
      data: entities.personas,
      icon: UserIcon,
      color: "green",
    },
    {
      title: "Lugares",
      data: entities.lugares,
      icon: MapPinIcon,
      color: "purple",
    },
  ];

  const getColorClasses = (color: string) => {
    const colors: Record<string, { bg: string; text: string; badge: string }> = {
      blue: {
        bg: theme === "dark" ? "bg-blue-500/10" : "bg-blue-50",
        text: "text-blue-600",
        badge: theme === "dark" ? "bg-blue-500/20 text-blue-400" : "bg-blue-100 text-blue-700",
      },
      green: {
        bg: theme === "dark" ? "bg-green-500/10" : "bg-green-50",
        text: "text-green-600",
        badge: theme === "dark" ? "bg-green-500/20 text-green-400" : "bg-green-100 text-green-700",
      },
      purple: {
        bg: theme === "dark" ? "bg-purple-500/10" : "bg-purple-50",
        text: "text-purple-600",
        badge: theme === "dark" ? "bg-purple-500/20 text-purple-400" : "bg-purple-100 text-purple-700",
      },
    };
    return colors[color];
  };

  return (
    <div className="space-y-4">
      {sections.map((section, sectionIndex) => {
        const Icon = section.icon;
        const colors = getColorClasses(section.color);

        return (
          <div
            key={sectionIndex}
            className={`rounded-xl p-6 ${
              theme === "dark"
                ? "bg-slate-800/50 border border-slate-700"
                : "bg-white border border-gray-200 shadow-sm"
            }`}
          >
            <div className="flex items-center gap-3 mb-4">
              <div className={`p-2 rounded-lg ${colors.bg}`}>
                <Icon className={`h-5 w-5 ${colors.text}`} />
              </div>
              <h3
                className={`text-lg font-semibold ${
                  theme === "dark" ? "text-white" : "text-gray-900"
                }`}
              >
                {section.title}
              </h3>
            </div>

            <div className="space-y-2">
              {section.data.slice(0, 5).map((item, index) => {
                const maxCount = section.data[0]?.count || 1;
                const percentage = (item.count / maxCount) * 100;

                return (
                  <div key={index} className="space-y-1">
                    <div className="flex items-center justify-between">
                      <span
                        className={`text-sm font-medium truncate ${
                          theme === "dark" ? "text-gray-300" : "text-gray-700"
                        }`}
                        title={item.name}
                      >
                        {item.name}
                      </span>
                      <span
                        className={`text-xs font-semibold px-2 py-0.5 rounded-full ${colors.badge}`}
                      >
                        {item.count}
                      </span>
                    </div>

                    <div
                      className={`h-1.5 rounded-full overflow-hidden ${
                        theme === "dark" ? "bg-slate-700" : "bg-gray-200"
                      }`}
                    >
                      <div
                        className={`h-full rounded-full transition-all duration-500 ${colors.bg} ${colors.text.replace('text-', 'bg-')}`}
                        style={{ width: `${percentage}%` }}
                      />
                    </div>
                  </div>
                );
              })}

              {section.data.length === 0 && (
                <p
                  className={`text-sm text-center py-4 ${
                    theme === "dark" ? "text-gray-500" : "text-gray-400"
                  }`}
                >
                  No hay datos disponibles
                </p>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
}