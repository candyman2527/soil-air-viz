import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { Settings } from "lucide-react";

interface MqttSettings {
  url: string;
  port: number;
  message: string;
}

export const MqttSettingsDialog = () => {
  const { toast } = useToast();
  const [open, setOpen] = useState(false);
  const [settings, setSettings] = useState<MqttSettings>({
    url: "110.164.222.23",
    port: 1883,
    message: "out/esp32"
  });
  const [settingsId, setSettingsId] = useState<string | null>(null);

  useEffect(() => {
    if (open) {
      loadSettings();
    }
  }, [open]);

  const loadSettings = async () => {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) return;

    const { data, error } = await supabase
      .from("mqtt_settings")
      .select("*")
      .eq("user_id", session.user.id)
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle();

    if (error) {
      console.error("Error loading MQTT settings:", error);
      return;
    }

    if (data) {
      setSettings({
        url: data.url,
        port: data.port,
        message: data.message
      });
      setSettingsId(data.id);
    }
  };

  const handleSave = async () => {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) {
      toast({
        title: "เกิดข้อผิดพลาด",
        description: "กรุณาเข้าสู่ระบบก่อน",
        variant: "destructive",
      });
      return;
    }

    // Validate inputs
    if (!settings.url.trim()) {
      toast({
        title: "ข้อมูลไม่ครบ",
        description: "กรุณากรอก URL",
        variant: "destructive",
      });
      return;
    }

    if (!settings.message.trim()) {
      toast({
        title: "ข้อมูลไม่ครบ",
        description: "กรุณากรอก Message",
        variant: "destructive",
      });
      return;
    }

    const settingsData = {
      user_id: session.user.id,
      url: settings.url.trim(),
      port: settings.port,
      message: settings.message.trim()
    };

    let error;
    if (settingsId) {
      const result = await supabase
        .from("mqtt_settings")
        .update(settingsData)
        .eq("id", settingsId);
      error = result.error;
    } else {
      const result = await supabase
        .from("mqtt_settings")
        .insert([settingsData])
        .select()
        .single();
      error = result.error;
      if (!error && result.data) {
        setSettingsId(result.data.id);
      }
    }

    if (error) {
      toast({
        title: "เกิดข้อผิดพลาด",
        description: "ไม่สามารถบันทึกการตั้งค่าได้",
        variant: "destructive",
      });
    } else {
      toast({
        title: "สำเร็จ",
        description: "บันทึกการตั้งค่า WebSocket เรียบร้อยแล้ว",
      });
      setOpen(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" className="flex items-center gap-2 border-border/50">
          <Settings className="h-4 w-4" />
          ตั้งค่า WebSocket
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>ตั้งค่าการเชื่อมต่อ WebSocket</DialogTitle>
        </DialogHeader>
        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <Label htmlFor="url">WebSocket Server URL</Label>
            <Input
              id="url"
              placeholder="110.164.222.23"
              value={settings.url}
              onChange={(e) => setSettings({ ...settings, url: e.target.value })}
            />
            <p className="text-xs text-muted-foreground">
              ใส่เฉพาะ IP address หรือ domain name (ไม่ต้องใส่ ws://)
            </p>
          </div>
          <div className="space-y-2">
            <Label htmlFor="port">WebSocket Port</Label>
            <Input
              id="port"
              type="number"
              placeholder="9001"
              value={settings.port}
              onChange={(e) => setSettings({ ...settings, port: parseInt(e.target.value) || 9001 })}
            />
            <p className="text-xs text-muted-foreground">
              Port สำหรับ WebSocket (เช่น 9001)
            </p>
          </div>
          <div className="space-y-2">
            <Label htmlFor="message">ข้อความที่ต้องการส่ง</Label>
            <Textarea
              id="message"
              placeholder="yes"
              value={settings.message}
              onChange={(e) => setSettings({ ...settings, message: e.target.value })}
              rows={4}
            />
            <p className="text-xs text-muted-foreground">
              ข้อความที่ต้องการส่งผ่าน WebSocket
            </p>
          </div>
        </div>
        <div className="flex justify-end gap-2">
          <Button variant="outline" onClick={() => setOpen(false)}>
            ยกเลิก
          </Button>
          <Button onClick={handleSave}>
            บันทึก
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};
