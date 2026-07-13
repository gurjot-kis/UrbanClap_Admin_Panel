export interface ConversationUser {
  _id: string;
  name: string;
  phone: string;
  gender: string;
  status: string;
  avatar?: string;
  profilePicture?:string;
  createdAt: string;
  updatedAt: string;
}

export interface LastMessage {
  _id: string;
  conversation: string;
  sender: string;
  messageType: string;
  text: string;
  mediaUrl?: string;
  readBy: any[];
  deliveredTo: any[];
  createdAt: string;
  updatedAt: string;
}

export interface Conversation {
  _id: string;
  type: "private" | "group";
  groupName: string | null;
  groupImage: string | null;
  admin: string | null;

  user: ConversationUser;

  lastMessage: LastMessage | null;
  unreadCount?: number;

  createdAt: string;
  updatedAt: string;
}

export interface GetConversationResponse {
  success: boolean;
  message: string;
  data: Conversation[];
}

/* -------------------------------- Messages -------------------------------- */

export interface MessageSender {
  _id: string;
  name: string;
  phone: string;
  avatar?: string;
    profilePicture?:string;
}

export interface Message {
  _id: string;
  conversation: string;

  sender: MessageSender;

  messageType: string;
  text: string;
  mediaUrl?: string;

  parentMessage?: Message | null;

  readBy: any[];
  deliveredTo: any[];

  createdAt: string;
  updatedAt: string;
}

export interface MessagesData {
  messages: Message[];
  page: number;
  limit: number;
  hasMore: boolean;
}

export interface GetMessagesResponse {
  success: boolean;
  message: string;
  data: MessagesData;
}

/* ------------------------------ Send Message ------------------------------ */

export interface SendMessageRequest {
  conversationId: string;
  text?: string;
  messageType?: string;
  mediaUrl?: string;
  parentMessageId?: string;
}

export interface SendMessageResponse {
  success: boolean;
  message: string;
  data: Message;
}

export interface UploadMediaResponse {
  success: boolean;
  message: string;
  data: {
    mediaUrl: string;
    messageType: "image" | "video" | "file";
  };
}

export interface UploadMultipleMediaResponse {
  success: boolean;
  message: string;
  data: Array<{
    mediaUrl: string;
    messageType: "image" | "video" | "file";
  }>;
}
