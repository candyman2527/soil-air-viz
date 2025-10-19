import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Leaf, ArrowRight } from "lucide-react";

const Index = () => {
  const navigate = useNavigate();

  useEffect(() => {
    const checkAuth = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (session) {
        navigate("/dashboard");
      }
    };
    checkAuth();
  }, [navigate]);

  return (
    <div className="flex min-h-screen items-center justify-center p-4">
      <div className="text-center space-y-8 max-w-2xl">
        <div className="flex justify-center mb-8">
          <div className="rounded-full bg-gradient-to-br from-primary to-secondary p-6 shadow-glow animate-fade-in">
            <Leaf className="h-16 w-16 text-primary-foreground" />
          </div>
        </div>
        
        <h1 className="text-4xl md:text-6xl font-bold gradient-text mb-4 animate-fade-in">
          ระบบตรวจสอบสภาพแวดล้อม
        </h1>
        
        <p className="text-lg md:text-xl text-muted-foreground mb-8 animate-fade-in">
          ระบบ IoT สำหรับติดตามและวิเคราะห์สภาพแวดล้อมการเพาะปลูกแบบเรียลไทม์
        </p>

        <div className="flex flex-col sm:flex-row gap-4 justify-center animate-fade-in">
          <Button
            size="lg"
            onClick={() => navigate("/login")}
            className="bg-gradient-to-r from-primary to-secondary hover:opacity-90 transition-opacity text-lg px-8"
          >
            เข้าสู่ระบบ
            <ArrowRight className="ml-2 h-5 w-5" />
          </Button>
          <Button
            size="lg"
            variant="outline"
            onClick={() => navigate("/register")}
            className="border-border/50 text-lg px-8"
          >
            ลงทะเบียน
          </Button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-16 animate-fade-in">
          {[
            { title: "ตรวจสอบเรียลไทม์", desc: "ข้อมูลอุณหภูมิและความชื้นแบบ Real-time" },
            { title: "วิเคราะห์ดิน", desc: "ค่า NPK และความชื้นในดิน" },
            { title: "การแจ้งเตือน", desc: "รับข้อความและเสียงแจ้งเตือนอัตโนมัติ" },
          ].map((feature, idx) => (
            <div key={idx} className="glass-card p-6 rounded-lg hover:shadow-glow transition-shadow">
              <h3 className="font-semibold text-lg mb-2 text-primary">{feature.title}</h3>
              <p className="text-sm text-muted-foreground">{feature.desc}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default Index;
