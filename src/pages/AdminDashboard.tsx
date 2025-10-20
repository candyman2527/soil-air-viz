import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useNavigate } from "react-router-dom";
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
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { toast } from "sonner";
import { Users, UserCog, Trash2, Shield, ArrowLeft } from "lucide-react";

interface UserProfile {
  id: string;
  username: string;
  email: string;
  created_at: string;
}

interface UserRole {
  user_id: string;
  role: string;
}

const AdminDashboard = () => {
  const navigate = useNavigate();
  const [users, setUsers] = useState<UserProfile[]>([]);
  const [userRoles, setUserRoles] = useState<UserRole[]>([]);
  const [loading, setLoading] = useState(true);
  const [deleteDialog, setDeleteDialog] = useState<{ open: boolean; userId: string | null }>({
    open: false,
    userId: null,
  });
  const [roleDialog, setRoleDialog] = useState<{ open: boolean; userId: string | null; action: 'add' | 'remove' }>({
    open: false,
    userId: null,
    action: 'add',
  });
  const [selectedRole, setSelectedRole] = useState<string>('user');

  useEffect(() => {
    fetchUsers();
  }, []);

  const fetchUsers = async () => {
    try {
      setLoading(true);
      
      // Fetch all profiles
      const { data: profilesData, error: profilesError } = await supabase
        .from('profiles')
        .select('*')
        .order('created_at', { ascending: false });

      if (profilesError) throw profilesError;

      // Fetch all user roles
      const { data: rolesData, error: rolesError } = await supabase
        .from('user_roles')
        .select('*');

      if (rolesError) throw rolesError;

      setUsers(profilesData || []);
      setUserRoles(rolesData || []);
    } catch (error: any) {
      console.error('Error fetching users:', error);
      toast.error('ไม่สามารถโหลดข้อมูลผู้ใช้ได้');
    } finally {
      setLoading(false);
    }
  };

  const getUserRoles = (userId: string) => {
    return userRoles.filter(ur => ur.user_id === userId).map(ur => ur.role);
  };

  const handleDeleteUser = async () => {
    if (!deleteDialog.userId) return;

    try {
      const { error } = await supabase.functions.invoke('admin-manage-users', {
        body: { action: 'delete_user', userId: deleteDialog.userId },
      });

      if (error) throw error;

      toast.success('ลบผู้ใช้สำเร็จ');
      fetchUsers();
      setDeleteDialog({ open: false, userId: null });
    } catch (error: any) {
      console.error('Error deleting user:', error);
      toast.error('ไม่สามารถลบผู้ใช้ได้');
    }
  };

  const handleRoleChange = async () => {
    if (!roleDialog.userId) return;

    try {
      const action = roleDialog.action === 'add' ? 'add_role' : 'remove_role';
      const { error } = await supabase.functions.invoke('admin-manage-users', {
        body: { 
          action, 
          userId: roleDialog.userId,
          role: selectedRole 
        },
      });

      if (error) throw error;

      toast.success(roleDialog.action === 'add' ? 'เพิ่มสิทธิ์สำเร็จ' : 'ลบสิทธิ์สำเร็จ');
      fetchUsers();
      setRoleDialog({ open: false, userId: null, action: 'add' });
    } catch (error: any) {
      console.error('Error managing role:', error);
      toast.error('ไม่สามารถจัดการสิทธิ์ได้');
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button
            variant="outline"
            onClick={() => navigate('/dashboard')}
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            กลับ
          </Button>
          <div className="flex items-center gap-2">
            <Shield className="h-8 w-8 text-primary" />
            <h1 className="text-3xl font-bold">จัดการผู้ใช้งาน</h1>
          </div>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Users className="h-6 w-6" />
            รายชื่อสมาชิกทั้งหมด ({users.length} คน)
          </CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>ชื่อผู้ใช้</TableHead>
                <TableHead>อีเมล</TableHead>
                <TableHead>สิทธิ์</TableHead>
                <TableHead>วันที่สร้าง</TableHead>
                <TableHead className="text-right">จัดการ</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {users.map((user) => {
                const roles = getUserRoles(user.id);
                return (
                  <TableRow key={user.id}>
                    <TableCell className="font-medium">{user.username}</TableCell>
                    <TableCell>{user.email}</TableCell>
                    <TableCell>
                      <div className="flex gap-1 flex-wrap">
                        {roles.map((role) => (
                          <span
                            key={role}
                            className="px-2 py-1 text-xs rounded-full bg-primary/10 text-primary"
                          >
                            {role}
                          </span>
                        ))}
                      </div>
                    </TableCell>
                    <TableCell>
                      {new Date(user.created_at).toLocaleDateString('th-TH')}
                    </TableCell>
                    <TableCell className="text-right space-x-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setRoleDialog({ open: true, userId: user.id, action: 'add' })}
                      >
                        <UserCog className="h-4 w-4 mr-1" />
                        เพิ่มสิทธิ์
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setRoleDialog({ open: true, userId: user.id, action: 'remove' })}
                      >
                        <UserCog className="h-4 w-4 mr-1" />
                        ลบสิทธิ์
                      </Button>
                      <Button
                        variant="destructive"
                        size="sm"
                        onClick={() => setDeleteDialog({ open: true, userId: user.id })}
                      >
                        <Trash2 className="h-4 w-4 mr-1" />
                        ลบ
                      </Button>
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Delete Confirmation Dialog */}
      <Dialog open={deleteDialog.open} onOpenChange={(open) => setDeleteDialog({ ...deleteDialog, open })}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>ยืนยันการลบผู้ใช้</DialogTitle>
            <DialogDescription>
              คุณแน่ใจหรือไม่ที่จะลบผู้ใช้นี้? การกระทำนี้ไม่สามารถย้อนกลับได้
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setDeleteDialog({ open: false, userId: null })}
            >
              ยกเลิก
            </Button>
            <Button variant="destructive" onClick={handleDeleteUser}>
              ลบผู้ใช้
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Role Management Dialog */}
      <Dialog open={roleDialog.open} onOpenChange={(open) => setRoleDialog({ ...roleDialog, open })}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {roleDialog.action === 'add' ? 'เพิ่มสิทธิ์ผู้ใช้' : 'ลบสิทธิ์ผู้ใช้'}
            </DialogTitle>
            <DialogDescription>
              เลือกสิทธิ์ที่ต้องการ{roleDialog.action === 'add' ? 'เพิ่ม' : 'ลบ'}
            </DialogDescription>
          </DialogHeader>
          <div className="py-4">
            <Select value={selectedRole} onValueChange={setSelectedRole}>
              <SelectTrigger>
                <SelectValue placeholder="เลือกสิทธิ์" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="user">User</SelectItem>
                <SelectItem value="admin">Admin</SelectItem>
                <SelectItem value="moderator">Moderator</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setRoleDialog({ open: false, userId: null, action: 'add' })}
            >
              ยกเลิก
            </Button>
            <Button onClick={handleRoleChange}>
              {roleDialog.action === 'add' ? 'เพิ่มสิทธิ์' : 'ลบสิทธิ์'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default AdminDashboard;