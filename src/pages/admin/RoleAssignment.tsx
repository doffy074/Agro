import React, { useEffect, useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Alert, AlertDescription } from '@/components/ui/alert';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Search,
  Shield,
  ShieldCheck,
  ShieldAlert,
  ChevronLeft,
  ChevronRight,
  Loader2,
  ArrowRight,
  CheckCircle2,
  AlertTriangle,
} from 'lucide-react';
import { adminApi } from '@/services/api';
import { User, UserRole } from '@/types';

const RoleAssignment: React.FC = () => {
  const [users, setUsers] = useState<User[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const pageSize = 10;

  // Role change dialog state
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [newRole, setNewRole] = useState<UserRole>('farmer');
  const [isChangingRole, setIsChangingRole] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchUsers();
  }, [currentPage]);

  const fetchUsers = async () => {
    setIsLoading(true);
    try {
      const response = await adminApi.getUsers(currentPage, pageSize);
      if (response.data) {
        setUsers(response.data.users);
        setTotalPages(Math.ceil(response.data.total / pageSize));
      }
    } catch (error) {
      console.error('Failed to fetch users:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleOpenRoleDialog = (user: User) => {
    setSelectedUser(user);
    setNewRole(user.role);
    setError(null);
  };

  const handleCloseDialog = () => {
    setSelectedUser(null);
    setError(null);
  };

  const handleChangeRole = async () => {
    if (!selectedUser) return;

    if (newRole === selectedUser.role) {
      handleCloseDialog();
      return;
    }

    setIsChangingRole(true);
    setError(null);

    try {
      await adminApi.updateUserRole(selectedUser.id, newRole);
      fetchUsers();
      handleCloseDialog();
    } catch (err: any) {
      setError(err.message || 'Failed to update role');
    } finally {
      setIsChangingRole(false);
    }
  };

  const filteredUsers = users.filter(
    (user) =>
      user.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      user.email.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const getRoleIcon = (role: string) => {
    switch (role) {
      case 'admin':
        return <ShieldAlert className="w-5 h-5 text-destructive" />;
      case 'officer':
        return <ShieldCheck className="w-5 h-5 text-early-green" />;
      default:
        return <Shield className="w-5 h-5 text-matcha" />;
    }
  };

  const getRoleBadgeColor = (role: string) => {
    switch (role) {
      case 'admin':
        return 'bg-destructive text-destructive-foreground';
      case 'officer':
        return 'bg-early-green text-white';
      default:
        return 'bg-matcha text-white';
    }
  };

  return (
    <>
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold text-calm-green">Role Assignment</h1>
          <p className="text-muted-foreground">Manage user roles and permissions</p>
        </div>

        {/* Info card */}
        <Alert className="border-matcha bg-ever-green/20">
          <Shield className="w-4 h-4" />
          <AlertDescription>
            <strong>Role Assignment Policy:</strong> New users are automatically assigned the "farmer" role. 
            Only admins can promote users to "officer" or "admin" roles. All role changes are logged.
          </AlertDescription>
        </Alert>

        {/* Search */}
        <Card className="border-matcha/30">
          <CardContent className="p-4">
            <div className="relative">
              <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search by name or email..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
              />
            </div>
          </CardContent>
        </Card>

        {/* Users list */}
        <Card className="border-matcha/30">
          <CardHeader>
            <CardTitle className="text-calm-green flex items-center gap-2">
              <Shield className="w-5 h-5" />
              User Roles
            </CardTitle>
            <CardDescription>Click on a user to change their role</CardDescription>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="flex items-center justify-center py-12">
                <Loader2 className="w-8 h-8 animate-spin text-calm-green" />
              </div>
            ) : filteredUsers.length === 0 ? (
              <div className="text-center py-12">
                <Shield className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
                <p className="text-muted-foreground">No users found</p>
              </div>
            ) : (
              <div className="space-y-3">
                {filteredUsers.map((user) => (
                  <div
                    key={user.id}
                    className="flex items-center gap-4 p-4 rounded-lg border border-matcha/20 hover:bg-pistage transition-colors cursor-pointer"
                    onClick={() => handleOpenRoleDialog(user)}
                  >
                    <Avatar className="h-12 w-12">
                      <AvatarImage src={user.avatar} />
                      <AvatarFallback className="bg-early-green text-white">
                        {user.name.charAt(0).toUpperCase()}
                      </AvatarFallback>
                    </Avatar>
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-calm-green">{user.name}</p>
                      <p className="text-sm text-muted-foreground">{user.email}</p>
                    </div>
                    <div className="flex items-center gap-3">
                      {getRoleIcon(user.role)}
                      <Badge className={getRoleBadgeColor(user.role)}>{user.role}</Badge>
                      <ArrowRight className="w-4 h-4 text-muted-foreground" />
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="flex items-center justify-center gap-2">
            <Button
              variant="outline"
              size="icon"
              onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
              disabled={currentPage === 1}
              className="border-matcha"
            >
              <ChevronLeft className="w-4 h-4" />
            </Button>
            <span className="text-sm text-muted-foreground px-4">
              Page {currentPage} of {totalPages}
            </span>
            <Button
              variant="outline"
              size="icon"
              onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
              disabled={currentPage === totalPages}
              className="border-matcha"
            >
              <ChevronRight className="w-4 h-4" />
            </Button>
          </div>
        )}

        {/* Role change dialog */}
        <Dialog open={!!selectedUser} onOpenChange={() => handleCloseDialog()}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle className="text-calm-green">Change User Role</DialogTitle>
              <DialogDescription>
                Update the role for {selectedUser?.name}. This action will be logged.
              </DialogDescription>
            </DialogHeader>

            {error && (
              <Alert variant="destructive">
                <AlertTriangle className="w-4 h-4" />
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}

            <div className="space-y-4 py-4">
              <div className="flex items-center gap-4 p-4 bg-pistage rounded-lg">
                <Avatar className="h-12 w-12">
                  <AvatarImage src={selectedUser?.avatar} />
                  <AvatarFallback className="bg-early-green text-white">
                    {selectedUser?.name?.charAt(0).toUpperCase()}
                  </AvatarFallback>
                </Avatar>
                <div>
                  <p className="font-medium text-calm-green">{selectedUser?.name}</p>
                  <p className="text-sm text-muted-foreground">{selectedUser?.email}</p>
                </div>
              </div>

              <div className="space-y-2">
                <Label>Current Role</Label>
                <Badge className={getRoleBadgeColor(selectedUser?.role || 'farmer')}>
                  {selectedUser?.role}
                </Badge>
              </div>

              <div className="space-y-2">
                <Label htmlFor="newRole">New Role</Label>
                <Select value={newRole} onValueChange={(value: UserRole) => setNewRole(value)}>
                  <SelectTrigger id="newRole">
                    <SelectValue placeholder="Select new role" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="farmer">
                      <div className="flex items-center gap-2">
                        <Shield className="w-4 h-4 text-matcha" />
                        Farmer
                      </div>
                    </SelectItem>
                    <SelectItem value="officer">
                      <div className="flex items-center gap-2">
                        <ShieldCheck className="w-4 h-4 text-early-green" />
                        Officer
                      </div>
                    </SelectItem>
                    <SelectItem value="admin">
                      <div className="flex items-center gap-2">
                        <ShieldAlert className="w-4 h-4 text-destructive" />
                        Admin
                      </div>
                    </SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {newRole !== selectedUser?.role && (
                <Alert className="border-yellow-500 bg-yellow-50">
                  <AlertTriangle className="w-4 h-4 text-yellow-600" />
                  <AlertDescription className="text-yellow-700">
                    You are about to change this user's role from{' '}
                    <strong>{selectedUser?.role}</strong> to <strong>{newRole}</strong>.
                  </AlertDescription>
                </Alert>
              )}
            </div>

            <DialogFooter>
              <Button variant="outline" onClick={handleCloseDialog} disabled={isChangingRole}>
                Cancel
              </Button>
              <Button
                className="bg-calm-green hover:bg-resting-green text-white"
                onClick={handleChangeRole}
                disabled={isChangingRole || newRole === selectedUser?.role}
              >
                {isChangingRole ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Updating...
                  </>
                ) : (
                  <>
                    <CheckCircle2 className="w-4 h-4 mr-2" />
                    Update Role
                  </>
                )}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </>
  );
};

export default RoleAssignment;
