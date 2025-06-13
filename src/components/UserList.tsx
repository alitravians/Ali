
import { Card, CardContent, CardHeader, CardTitle } from './ui/card'
import { Avatar, AvatarFallback } from './ui/avatar'
import { Badge } from './ui/badge'
import { Users } from 'lucide-react'
import { arabicTranslations } from '../lib/arabic'

interface User {
  username: string
  role: string
  status: string
}

interface UserListProps {
  users: User[]
}

export default function UserList({ users }: UserListProps) {
  const getRoleColor = (role: string) => {
    switch (role) {
      case 'admin': return 'bg-red-500'
      case 'moderator': return 'bg-blue-500'
      default: return 'bg-gray-500'
    }
  }

  const getRoleText = (role: string) => {
    switch (role) {
      case 'admin': return arabicTranslations.admin
      case 'moderator': return arabicTranslations.moderator
      default: return arabicTranslations.user
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active': return 'bg-green-500'
      case 'muted': return 'bg-yellow-500'
      case 'banned': return 'bg-red-500'
      default: return 'bg-gray-500'
    }
  }

  const getStatusText = (status: string) => {
    switch (status) {
      case 'active': return arabicTranslations.active
      case 'muted': return arabicTranslations.muted
      case 'banned': return arabicTranslations.banned
      default: return 'غير معروف'
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="rtl-flex items-center gap-2">
          <Users className="w-4 h-4" />
          {arabicTranslations.onlineUsers} ({users.length})
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-2">
          {users.map((user, index) => (
            <div key={index} className="flex items-center gap-2 p-2 rounded-lg bg-gray-50">
              <Avatar className="w-8 h-8">
                <AvatarFallback className={getRoleColor(user.role)}>
                  {user.username.charAt(0).toUpperCase()}
                </AvatarFallback>
              </Avatar>
              
              <div className="flex-1 text-right">
                <div className="font-semibold text-sm">{user.username}</div>
                <div className="flex gap-1 justify-end">
                  <Badge variant="secondary" className="text-xs">
                    {getRoleText(user.role)}
                  </Badge>
                  <Badge 
                    variant="outline" 
                    className={`text-xs ${getStatusColor(user.status)} text-white`}
                  >
                    {getStatusText(user.status)}
                  </Badge>
                </div>
              </div>
            </div>
          ))}
          
          {users.length === 0 && (
            <div className="text-center text-gray-500 py-4 rtl-text">
              {arabicTranslations.noUsersOnline}
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  )
}
