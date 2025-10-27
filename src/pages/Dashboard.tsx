import { useEffect, useState, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { GaugeChart } from "@/components/dashboard/GaugeChart";
import { NPKDisplay } from "@/components/dashboard/NPKDisplay";
import { Thermometer, Droplets, Sprout, MessageSquare, Volume2, LogOut, User, Shield, History, Send } from "lucide-react";
import { MqttSettingsDialog } from "@/components/dashboard/MqttSettingsDialog";
import mqtt from 'mqtt';

interface SensorData {
  temperature: number;
  humidity: number;
  soil_moisture: number;
  nitrogen_value: number;
  phosphorus_value: number;
  potassium_value: number;
  auto_message: string;
  audio_url: string | null;
  webhook_timestamp: string;
  created_at: string;
  updated_at: string;
  id: string;
}

const Dashboard = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [sensorData, setSensorData] = useState<SensorData | null>(null);
  const [username, setUsername] = useState("");
  const [isAdmin, setIsAdmin] = useState(false);

  // Authentication check
  useEffect(() => {
    const checkAuth = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        navigate("/login");
        return;
      }
      
      const { data: profile } = await supabase
        .from("profiles")
        .select("username")
        .eq("id", session.user.id)
        .single();

      if (profile) {
        setUsername(profile.username);
      }

      const { data: roles } = await supabase
        .from("user_roles")
        .select("role")
        .eq("user_id", session.user.id)
        .eq("role", "admin")
        .single();

      setIsAdmin(!!roles);
    };

    checkAuth();
  }, [navigate]);

  // Fetch sensor data
  const fetchSensorData = useCallback(async () => {
    try {
      const { data, error } = await supabase
        .from("sensor_data")
        .select("*")
        .order("created_at", { ascending: false })
        .limit(1)
        .single();

      if (error) throw error;
      if (data) {
        setSensorData(data);
      }
    } catch (error) {
      console.error("Error fetching sensor data:", error);
      toast({
        title: "เกิดข้อผิดพลาด",
        description: "ไม่สามารถดึงข้อมูลเซ็นเซอร์ได้",
        variant: "destructive"
      });
    }
  }, [toast]);

  // Initial data fetch
  useEffect(() => {
    fetchSensorData();
  }, [fetchSensorData]);

  // Send MQTT message function
  const sendMqttMessage = async () => {
    try {
      const client = mqtt.connect('mqtt://110.164.222.23:1883');
      
      client.on('connect', () => {
        console.log('MQTT Connected');
        client.publish('out/esp32', 'yes', (error) => {
          if (error) {
            console.error('MQTT Publish Error:', error);
            toast({
              title: "เกิดข้อผิดพลาด",
              description: "ไม่สามารถส่งข้อมูลไปยัง MQTT ได้",
              variant: "destructive"
            });
          } else {
            console.log('MQTT Message Published');
            toast({
              title: "ส่งข้อมูลสำเร็จ",
              description: "ส่งคำสั่งไปยังเซ็นเซอร์แล้ว"
            });
          }
          // Close connection after sending
          setTimeout(() => {
            client.end();
          }, 1000);
        });
      });

      client.on('error', (err) => {
        console.error('MQTT Error:', err);
        toast({
          title: "เกิดข้อผิดพลาด",
          description: "ไม่สามารถเชื่อมต่อกับ MQTT broker ได้",
          variant: "destructive"
        });
        client.end();
      });
    } catch (error) {
      console.error('MQTT Connection error:', error);
      toast({
        title: "เกิดข้อผิดพลาด",
        description: "ไม่สามารถส่งข้อมูลไปยัง MQTT ได้",
        variant: "destructive"
      });
    }
  };

  useEffect(() => {
    const checkAuth = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        navigate("/login");
        return;
      }
      
      const { data: profile } = await supabase
        .from("profiles")
        .select("username")
        .eq("id", session.user.id)
        .single();

      if (profile) {
        setUsername(profile.username);
      }

      const { data: roles } = await supabase
        .from("user_roles")
        .select("role")
        .eq("user_id", session.user.id)
        .eq("role", "admin")
        .single();

      setIsAdmin(!!roles);
    };

    checkAuth();
  }, [navigate]);

  const sendMqttMessage = useCallback(async () => {
    try {
      const client = mqtt.connect('mqtt://110.164.222.23:1883');
      
      client.on('connect', () => {
        client.publish('out/esp32', 'yes', (error) => {
          if (error) {
            toast({
              title: "เกิดข้อผิดพลาด",
              description: "ไม่สามารถส่งข้อมูลไปยัง MQTT ได้",
              variant: "destructive"
            });
          } else {
            toast({
              title: "ส่งข้อมูลสำเร็จ",
              description: "ส่งคำสั่งไปยังเซ็นเซอร์แล้ว"
            });
          }
        });
        
        // Close connection after sending
        client.end();
      });
    } catch (error) {
      toast({
        title: "เกิดข้อผิดพลาด",
        description: "ไม่สามารถส่งข้อมูลไปยัง MQTT ได้",
        variant: "destructive"
      });
    }
  }, [toast]);

  const initMqttClient = useCallback(() => {
    const client = mqtt.connect('mqtt://110.164.222.23:1883');
    
    client.on('connect', () => {
      console.log('MQTT Connected');
      toast({
        title: "MQTT เชื่อมต่อสำเร็จ",
        description: "พร้อมรับ-ส่งข้อมูล"
      });
    });

    client.on('error', (err) => {
      console.error('MQTT Error:', err);
      toast({
        title: "การเชื่อมต่อ MQTT ล้มเหลว",
        description: "กรุณาลองใหม่อีกครั้ง",
        variant: "destructive"
      });
    });

    setMqttClient(client);
    return client;
  }, [toast]);

  const sendMqttMessage = useCallback(() => {
    try {
      const client = mqttClient || initMqttClient();
      client.publish('out/esp32', 'yes', (error) => {
        if (error) {
          toast({
            title: "เกิดข้อผิดพลาด",
            description: "ไม่สามารถส่งข้อมูลไปยัง MQTT ได้",
            variant: "destructive"
          });
        } else {
          toast({
            title: "ส่งข้อมูลสำเร็จ",
            description: "ส่งคำสั่งไปยังเซ็นเซอร์แล้ว"
          });
        }
      });
    } catch (error) {
      toast({
        title: "เกิดข้อผิดพลาด",
        description: "ไม่สามารถส่งข้อมูลไปยัง MQTT ได้",
        variant: "destructive"
      });
    }
  }, [mqttClient, initMqttClient, toast]);

  const initMqttClient = () => {
    const client = mqtt.connect('mqtt://110.164.222.23:1883');
    setMqttClient(client);

    client.on('connect', () => {
      console.log('MQTT Connected');
      client.subscribe('sensor/data');
    });

    client.on('message', (topic, message) => {
      try {
        const data = JSON.parse(message.toString());
        setSensorData(data);
      } catch (error) {
        console.error('Error parsing MQTT message:', error);
      }
    });

    return client;
  };
  
  const sendMqttMessage = async () => {
    try {
      const client = mqttClient || initMqttClient();
      
      client.publish('out/esp32', 'yes', (error) => {
        if (error) {
          toast({
            title: "เกิดข้อผิดพลาด",
            description: "ไม่สามารถส่งข้อมูลไปยัง MQTT ได้",
            variant: "destructive"
          });
        } else {
          toast({
            title: "ส่งข้อมูลสำเร็จ",
            description: "ส่งคำสั่งไปยังเซ็นเซอร์แล้ว"
          });
        }
      });
    } catch (error) {
      toast({
        title: "เกิดข้อผิดพลาด",
        description: "ไม่สามารถส่งข้อมูลไปยัง MQTT ได้",
        variant: "destructive"
      });
    }
  };

  useEffect(() => {
    const setupMqttAndAuth = async () => {
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

      // Initialize MQTT client if not already initialized
      if (!mqttClient) {
        const client = initMqttClient();
        
        return () => {
          client.end();
        };
      }
    };

    setupMqttAndAuth();
    };

    checkAuthAndFetchData();

      return () => {
        supabase.removeChannel(channel);
      };
    };

    checkAuthAndFetchData();
  }, [navigate]);

  const sendMqttMessage = () => {
    const client = mqtt.connect('mqtt://110.164.222.23:1883');
    
    client.on('connect', () => {
      client.publish('out/esp32', 'yes', (err) => {
        if (!err) {
          toast({
            title: "ส่งคำสั่งสำเร็จ",
            description: "ส่งคำสั่งไปยังเซ็นเซอร์แล้ว",
          });
        } else {
          toast({
            title: "เกิดข้อผิดพลาด",
            description: "ไม่สามารถส่งคำสั่งได้",
            variant: "destructive",
          });
        }
        client.end();
      });
    });
  };

  const fetchSensorData = async () => {
    // Get latest temperature/humidity/soil_moisture from Node-RED
    const { data: nodeRedData } = await supabase
      .from("sensor_data")
      .select("temperature, humidity, soil_moisture, created_at")
      .not("temperature", "is", null)
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle();

    // Get latest NPK/audio data from Webhook
    const { data: webhookData } = await supabase
      .from("sensor_data")
      .select("nitrogen_value, phosphorus_value, potassium_value, auto_message, audio_url, created_at")
      .not("nitrogen_value", "is", null)
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle();

    // Merge the two datasets
    const mergedData: SensorData = {
      temperature: nodeRedData?.temperature ?? null,
      humidity: nodeRedData?.humidity ?? null,
      soil_moisture: nodeRedData?.soil_moisture ?? null,
      nitrogen_value: webhookData?.nitrogen_value ?? null,
      phosphorus_value: webhookData?.phosphorus_value ?? null,
      potassium_value: webhookData?.potassium_value ?? null,
      auto_message: webhookData?.auto_message ?? "",
      audio_url: webhookData?.audio_url ?? null,
      webhook_timestamp: webhookData?.created_at ?? null,
    };

    setSensorData(mergedData);
  };

  const handlePublishMqtt = async () => {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) {
      toast({
        title: "เกิดข้อผิดพลาด",
        description: "กรุณาเข้าสู่ระบบก่อน",
        variant: "destructive",
      });
      return;
    }

    // Load MQTT settings
    const { data: mqttSettings, error: settingsError } = await supabase
      .from("mqtt_settings")
      .select("*")
      .eq("user_id", session.user.id)
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle();

    if (settingsError || !mqttSettings) {
      toast({
        title: "ไม่พบการตั้งค่า",
        description: "กรุณาตั้งค่า WebSocket ก่อนส่งข้อมูล",
        variant: "destructive",
      });
      return;
    }

    // Call edge function to publish MQTT
    const { error } = await supabase.functions.invoke("publish-mqtt", {
      body: {
        url: mqttSettings.url,
        port: mqttSettings.port,
        message: mqttSettings.message,
      },
    });

    if (error) {
      toast({
        title: "เกิดข้อผิดพลาด",
        description: "ไม่สามารถส่งข้อมูลไป WebSocket ได้",
        variant: "destructive",
      });
    } else {
      toast({
        title: "สำเร็จ",
        description: "ส่งข้อมูลไป WebSocket เรียบร้อยแล้ว",
      });
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
          <div className="flex flex-wrap gap-2">
            <Button
              onClick={handlePublishMqtt}
              className="flex items-center gap-2"
            >
              <Send className="h-4 w-4" />
              กดดูสภาพดิน
            </Button>
            <MqttSettingsDialog />
            <Button
              onClick={() => navigate('/history')}
              variant="outline"
              className="flex items-center gap-2 border-border/50"
            >
              <History className="h-4 w-4" />
              ประวัติข้อมูล
            </Button>
            {isAdmin && (
              <Button
                onClick={() => navigate('/admin')}
                variant="outline"
                className="flex items-center gap-2 border-border/50"
              >
                <Shield className="h-4 w-4" />
                จัดการผู้ใช้
              </Button>
            )}
            <Button
              onClick={handleLogout}
              variant="outline"
              className="flex items-center gap-2 border-border/50"
            >
              <LogOut className="h-4 w-4" />
              ออกจากระบบ
            </Button>
          </div>
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
            {sensorData.webhook_timestamp && (
              <p className="text-sm text-muted-foreground mt-1">
                วันที่ส่งข้อมูล: {new Date(sensorData.webhook_timestamp).toLocaleString('th-TH', {
                  year: 'numeric',
                  month: 'long',
                  day: 'numeric',
                  hour: '2-digit',
                  minute: '2-digit',
                  second: '2-digit'
                })}
              </p>
            )}
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
