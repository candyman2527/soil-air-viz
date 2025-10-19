import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { GaugeChart } from "@/components/dashboard/GaugeChart";
import { NPKDisplay } from "@/components/dashboard/NPKDisplay";
import { Thermometer, Droplets, Sprout, MessageSquare, Volume2, LogOut, User } from "lucide-react";

interface SensorData {
  temperature: number;
  humidity: number;
  soil_moisture: number;
  nitrogen_value: number;
  phosphorus_value: number;
  potassium_value: number;
  auto_message: string;
  audio_url: string | null;
}

const Dashboard = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [sensorData, setSensorData] = useState<SensorData | null>(null);
  const [username, setUsername] = useState("");
  const [isAdmin, setIsAdmin] = useState(false);

  useEffect(() => {
    const checkAuthAndFetchData = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      
      if (!session) {
        navigate("/login");
        return;
      }

      // Get user profile
      const { data: profile } = await supabase
        .from("profiles")
        .select("username")
        .eq("id", session.user.id)
        .single();

      if (profile) {
        setUsername(profile.username);
      }

      // Check if user is admin
      const { data: roles } = await supabase
        .from("user_roles")
        .select("role")
        .eq("user_id", session.user.id)
        .eq("role", "admin")
        .single();

      setIsAdmin(!!roles);

      // Fetch latest sensor data
      fetchSensorData();

      // Subscribe to real-time updates
      const channel = supabase
        .channel("sensor_data_changes")
        .on(
          "postgres_changes",
          {
            event: "*",
            schema: "public",
            table: "sensor_data",
          },
          () => {
            fetchSensorData();
          }
        )
        .subscribe();

      return () => {
        supabase.removeChannel(channel);
      };
    };

    checkAuthAndFetchData();
  }, [navigate]);

  const fetchSensorData = async () => {
    const { data, error } = await supabase
      .from("sensor_data")
      .select("*")
      .order("created_at", { ascending: false })
      .limit(1)
      .single();

    if (error) {
      console.error("Error fetching sensor data:", error);
    } else if (data) {
      setSensorData(data);
    }
  };

  const handleLogout = async () => {
    const { error } = await supabase.auth.signOut();
    if (error) {
      toast({
        title: "เกิดข้อผิดพลาด",
        description: "ไม่สามารถออกจากระบบได้",
        variant: "destructive",
      });
    } else {
      navigate("/login");
    }
  };

  if (!sensorData) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen p-4 md:p-8">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 glass-card p-6 rounded-lg">
          <div>
            <h1 className="text-3xl md:text-4xl font-bold gradient-text mb-2">
              ระบบตรวจสอบสภาพแวดล้อม
            </h1>
            <p className="text-muted-foreground flex items-center gap-2">
              <User className="h-4 w-4" />
              {username} {isAdmin && <span className="text-primary font-semibold">(Admin)</span>}
            </p>
          </div>
          <Button
            onClick={handleLogout}
            variant="outline"
            className="flex items-center gap-2 border-border/50"
          >
            <LogOut className="h-4 w-4" />
            ออกจากระบบ
          </Button>
        </div>

        {/* Gauges Section */}
        <Card className="glass-card shadow-glow">
          <CardHeader>
            <CardTitle className="text-2xl flex items-center gap-2">
              <Thermometer className="h-6 w-6 text-primary" />
              ข้อมูลอุณหภูมิและความชื้น
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8 md:gap-12">
              <div className="flex justify-center">
                <GaugeChart
                  value={sensorData.temperature}
                  max={50}
                  label="อุณหภูมิอากาศ"
                  unit="°C"
                  color="hsl(var(--primary))"
                />
              </div>
              <div className="flex justify-center">
                <GaugeChart
                  value={sensorData.humidity}
                  max={100}
                  label="ความชื้นในอากาศ"
                  unit="%"
                  color="hsl(var(--secondary))"
                />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Soil Moisture */}
        <Card className="glass-card shadow-glow">
          <CardHeader>
            <CardTitle className="text-2xl flex items-center gap-2">
              <Droplets className="h-6 w-6 text-secondary" />
              ความชื้นในดิน
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex justify-center">
              <GaugeChart
                value={sensorData.soil_moisture}
                max={100}
                label="ความชื้นในดิน"
                unit="%"
                color="hsl(var(--accent))"
              />
            </div>
          </CardContent>
        </Card>

        {/* NPK Values */}
        <Card className="glass-card shadow-glow">
          <CardHeader>
            <CardTitle className="text-2xl flex items-center gap-2">
              <Sprout className="h-6 w-6 text-primary" />
              ค่าธาตุอาหารในดิน (NPK)
            </CardTitle>
          </CardHeader>
          <CardContent>
            <NPKDisplay
              nitrogen={sensorData.nitrogen_value}
              phosphorus={sensorData.phosphorus_value}
              potassium={sensorData.potassium_value}
            />
          </CardContent>
        </Card>

        {/* Auto Message */}
        {sensorData.auto_message && (
          <Card className="glass-card shadow-glow">
            <CardHeader>
              <CardTitle className="text-2xl flex items-center gap-2">
                <MessageSquare className="h-6 w-6 text-primary" />
                ข้อความอัตโนมัติ
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-lg p-4 bg-muted/30 rounded-lg border border-border/50">
                {sensorData.auto_message}
              </p>
            </CardContent>
          </Card>
        )}

        {/* Audio Player */}
        {sensorData.audio_url && (
          <Card className="glass-card shadow-glow">
            <CardHeader>
              <CardTitle className="text-2xl flex items-center gap-2">
                <Volume2 className="h-6 w-6 text-primary" />
                ไฟล์เสียง
              </CardTitle>
            </CardHeader>
            <CardContent>
              <audio controls className="w-full">
                <source src={sensorData.audio_url} />
                เบราว์เซอร์ของคุณไม่รองรับการเล่นเสียง
              </audio>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
};

export default Dashboard;
