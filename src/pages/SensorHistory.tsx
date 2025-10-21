import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { ArrowLeft, History } from "lucide-react";
import { Badge } from "@/components/ui/badge";

interface HistoryRecord {
  id: string;
  created_at: string;
  nitrogen_value: number | null;
  phosphorus_value: number | null;
  potassium_value: number | null;
  auto_message: string | null;
}

const SensorHistory = () => {
  const navigate = useNavigate();
  const [records, setRecords] = useState<HistoryRecord[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const checkAuthAndFetchData = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      
      if (!session) {
        navigate("/login");
        return;
      }

      fetchHistoryData();
    };

    checkAuthAndFetchData();
  }, [navigate]);

  const fetchHistoryData = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from("sensor_data")
      .select("id, created_at, nitrogen_value, phosphorus_value, potassium_value, auto_message")
      .not("nitrogen_value", "is", null)
      .order("created_at", { ascending: false })
      .limit(50);

    if (error) {
      console.error("Error fetching history:", error);
    } else {
      setRecords(data || []);
    }
    setLoading(false);
  };

  if (loading) {
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
        <div className="glass-card p-6 rounded-lg">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-3">
              <History className="h-8 w-8 text-primary" />
              <h1 className="text-3xl md:text-4xl font-bold gradient-text">
                ประวัติข้อมูล NPK
              </h1>
            </div>
            <Button
              onClick={() => navigate("/dashboard")}
              variant="outline"
              className="flex items-center gap-2 border-border/50"
            >
              <ArrowLeft className="h-4 w-4" />
              กลับ
            </Button>
          </div>
          <p className="text-muted-foreground">
            แสดงข้อมูล NPK และข้อความอัตโนมัติย้อนหลัง 50 รายการล่าสุด
          </p>
        </div>

        {/* History Table */}
        <Card className="glass-card shadow-glow">
          <CardHeader>
            <CardTitle className="text-xl">รายการข้อมูล</CardTitle>
          </CardHeader>
          <CardContent>
            {records.length === 0 ? (
              <div className="text-center py-12 text-muted-foreground">
                ไม่มีข้อมูลในระบบ
              </div>
            ) : (
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="min-w-[180px]">วันที่และเวลา</TableHead>
                      <TableHead className="text-center">N (mg/kg)</TableHead>
                      <TableHead className="text-center">P (mg/kg)</TableHead>
                      <TableHead className="text-center">K (mg/kg)</TableHead>
                      <TableHead className="min-w-[200px]">ข้อความอัตโนมัติ</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {records.map((record) => (
                      <TableRow key={record.id}>
                        <TableCell className="font-medium">
                          {new Date(record.created_at).toLocaleString('th-TH', {
                            year: 'numeric',
                            month: 'short',
                            day: 'numeric',
                            hour: '2-digit',
                            minute: '2-digit',
                            second: '2-digit'
                          })}
                        </TableCell>
                        <TableCell className="text-center">
                          <Badge variant="outline" className="bg-primary/10 border-primary/20">
                            {record.nitrogen_value?.toFixed(1) ?? '-'}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-center">
                          <Badge variant="outline" className="bg-secondary/10 border-secondary/20">
                            {record.phosphorus_value?.toFixed(1) ?? '-'}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-center">
                          <Badge variant="outline" className="bg-accent/10 border-accent/20">
                            {record.potassium_value?.toFixed(1) ?? '-'}
                          </Badge>
                        </TableCell>
                        <TableCell className="max-w-[300px]">
                          {record.auto_message ? (
                            <div className="text-sm p-2 bg-muted/30 rounded border border-border/50 line-clamp-2">
                              {record.auto_message}
                            </div>
                          ) : (
                            <span className="text-muted-foreground text-sm">-</span>
                          )}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default SensorHistory;
