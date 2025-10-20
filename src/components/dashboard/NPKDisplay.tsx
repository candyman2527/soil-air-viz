import { Card, CardContent } from "@/components/ui/card";

interface NPKDisplayProps {
  nitrogen: number | null;
  phosphorus: number | null;
  potassium: number | null;
}

export const NPKDisplay = ({ nitrogen, phosphorus, potassium }: NPKDisplayProps) => {
  const nutrients = [
    { label: "ไนโตรเจน (N)", value: nitrogen, color: "hsl(var(--primary))", icon: "N" },
    { label: "ฟอสฟอรัส (P)", value: phosphorus, color: "hsl(var(--secondary))", icon: "P" },
    { label: "โพแทสเซียม (K)", value: potassium, color: "hsl(var(--accent))", icon: "K" },
  ];

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
      {nutrients.map((nutrient) => (
        <Card key={nutrient.label} className="glass-card border-border/50 hover:shadow-glow transition-shadow">
          <CardContent className="p-6">
            <div className="flex items-center justify-between mb-4">
              <div 
                className="w-12 h-12 rounded-full flex items-center justify-center text-white font-bold text-xl"
                style={{ background: `linear-gradient(135deg, ${nutrient.color}, ${nutrient.color}dd)` }}
              >
                {nutrient.icon}
              </div>
              <div className="text-right">
                <div className="text-3xl font-bold" style={{ color: nutrient.color }}>
                  {nutrient.value !== null ? nutrient.value.toFixed(1) : "-"}
                </div>
                <div className="text-xs text-muted-foreground">mg/kg</div>
              </div>
            </div>
            <h3 className="font-medium text-sm text-muted-foreground">{nutrient.label}</h3>
          </CardContent>
        </Card>
      ))}
    </div>
  );
};
