# Database Schema for Chat Application

## Firebase Collections

### 1. Users
- `uid` (string): Unique identifier for the user
- `username` (string): User's display name
- `email` (string): User's email address
- `password` (string): Hashed password
- `role` (string): User role (admin, moderator, user)
- `status` (string): Account status (active, banned, frozen)
- `country` (string): User's country (detected from IP)
- `createdAt` (timestamp): Account creation date
- `lastLogin` (timestamp): Last login date
- `banInfo` (object, optional):
  - `reason` (string): Reason for ban
  - `duration` (number): Ban duration in minutes
  - `bannedBy` (string): Admin/moderator who issued the ban
  - `bannedAt` (timestamp): When the ban was issued
  - `expiresAt` (timestamp): When the ban expires
- `freezeInfo` (object, optional):
  - `reason` (string): Reason for account freeze
  - `frozenBy` (string): Admin who froze the account
  - `frozenAt` (timestamp): When the account was frozen

### 2. Messages
- `id` (string): Unique message identifier
- `content` (string): Message content
- `sender` (string): User ID of sender
- `senderName` (string): Username of sender
- `senderRole` (string): Role of sender
- `senderCountry` (string): Country of sender
- `timestamp` (timestamp): When the message was sent
- `isDeleted` (boolean): Whether the message has been deleted
- `deletedBy` (string, optional): Who deleted the message
- `deletedReason` (string, optional): Why the message was deleted

### 3. Reports
- `id` (string): Unique report identifier
- `reporterId` (string): User ID of reporter
- `targetId` (string): User ID of reported user
- `messageId` (string, optional): ID of reported message
- `reason` (string): Reason for report
- `description` (string): Detailed description
- `timestamp` (timestamp): When the report was submitted
- `status` (string): Report status (pending, reviewed, closed)
- `reviewedBy` (string, optional): Admin/moderator who reviewed the report
- `reviewedAt` (timestamp, optional): When the report was reviewed
- `aiVerdict` (string, optional): AI system's assessment
- `action` (string, optional): Action taken (none, warning, ban, etc.)

### 4. BanAppeals
- `id` (string): Unique appeal identifier
- `userId` (string): User ID of banned user
- `banId` (string): Reference to the ban record
- `reason` (string): Reason for appeal
- `timestamp` (timestamp): When the appeal was submitted
- `status` (string): Appeal status (pending, approved, rejected)
- `reviewedBy` (string, optional): Admin who reviewed the appeal
- `reviewedAt` (timestamp, optional): When the appeal was reviewed
- `response` (string, optional): Admin response to the appeal

### 5. Announcements
- `id` (string): Unique announcement identifier
- `title` (string): Announcement title
- `content` (string): Announcement content
- `type` (string): Announcement type (news, update, alert)
- `createdBy` (string): Admin who created the announcement
- `createdAt` (timestamp): When the announcement was created
- `duration` (number): Display duration in seconds (default: 130)
- `isActive` (boolean): Whether the announcement is active
- `expiresAt` (timestamp, optional): When the announcement expires

### 6. ChatSettings
- `id` (string): Unique identifier (usually a single document)
- `isOpen` (boolean): Whether the chat is open
- `closedReason` (string, optional): Reason for chat closure
- `maintenanceMode` (boolean): Whether maintenance mode is active
- `maintenanceReason` (string, optional): Reason for maintenance
- `maintenanceEndTime` (timestamp, optional): When maintenance ends
- `language` (string): Default language (ar, en)
- `lastUpdated` (timestamp): When settings were last updated
- `updatedBy` (string): Admin who last updated settings

### 7. ModeratorActions
- `id` (string): Unique action identifier
- `moderatorId` (string): User ID of moderator
- `actionType` (string): Type of action (ban, delete, etc.)
- `targetId` (string): User ID of target
- `messageId` (string, optional): ID of affected message
- `reason` (string): Reason for action
- `timestamp` (timestamp): When the action was taken
- `reviewedBy` (string, optional): Admin who reviewed the action
- `reviewStatus` (string, optional): Status of review

### 8. AIModeration
- `id` (string): Unique identifier
- `messageId` (string): ID of analyzed message
- `content` (string): Content that was analyzed
- `verdict` (string): AI verdict (appropriate, inappropriate)
- `confidence` (number): Confidence score (0-1)
- `categories` (array): Categories of violation
- `timestamp` (timestamp): When analysis occurred
- `action` (string): Action taken (none, delete, ban)

### 9. SystemLogs
- `id` (string): Unique log identifier
- `type` (string): Log type (error, warning, info)
- `message` (string): Log message
- `timestamp` (timestamp): When the log was created
- `userId` (string, optional): Related user ID
- `metadata` (object, optional): Additional information

## Security Rules

Firebase security rules will be implemented to ensure:

1. Only authenticated users can read/write messages
2. Users can only modify their own data
3. Only admins/moderators can access reports and ban appeals
4. Only admins can modify system settings
5. Message history is accessible to all authenticated users
6. Banned users cannot write new messages
7. AI moderation logs are only accessible to admins

## Indexes

The following indexes will be created for optimal performance:

1. Messages: by timestamp (descending)
2. Reports: by status and timestamp
3. BanAppeals: by status and timestamp
4. Users: by role and status
5. Announcements: by isActive and createdAt
